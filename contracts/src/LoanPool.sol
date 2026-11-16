// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract LoanPool {
    enum LoanStatus {
        Proposed,
        Active,
        Repaid,
        Expired
    }

    struct Loan {
        uint256 id;
        address shop;
        uint256 principal;     // tUSD8 (6 decimals)
        uint256 flatFee;       // fixed fee (6 decimals)
        uint256 repayPct;      // basis points (1000 = 10%)
        uint256 totalRepaid;
        uint256 proposedAt;
        uint256 acceptedAt;
        uint256 repaidAt;
        LoanStatus status;
    }

    struct PoolStats {
        uint256 totalDeposited;
        uint256 totalLoaned;
        uint256 totalAvailable;
        uint256 utilizationPct; // basis points
        uint256 totalFeeEarned;
        uint256 activeLoanCount;
    }

    uint256 public constant MAX_LOAN_USD8       = 500 * 1e6;
    uint256 public constant MAX_EXPOSURE_BPS    = 8000; // 80%
    uint256 public constant PROPOSAL_TTL        = 48 hours;
    uint256 public constant COOLDOWN_PERIOD     = 30 days;

    bytes32 public constant ACCEPT_LOAN_TYPEHASH =
        keccak256("AcceptLoan(uint256 loanId,address shop,uint256 principalUSD8,uint256 flatFeeUSD8,uint256 repayPctBps,uint256 deadline)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    IERC20Minimal public immutable tUSD8;
    address public immutable salesLedger;
    address public aiGuarantor;
    address public owner;

    uint256 public nextLoanId = 1;
    uint256 public totalDeposited;
    uint256 public totalLoaned;
    uint256 public totalFeeEarned;
    uint256 public activeLoanCount;
    uint256 public totalShares;

    mapping(uint256 => Loan) private _loans;
    mapping(address => uint256) private _activeLoanOf;
    mapping(address => uint256[]) private _shopLoans;
    mapping(address => uint256) private _cooldownEnd;
    mapping(address => uint256) public lenderShares;

    event LoanProposed(uint256 indexed loanId, address indexed shop, uint256 principal, uint256 flatFee, uint256 repayPct);
    event LoanAccepted(uint256 indexed loanId, address indexed shop, uint256 timestamp);
    event LoanRepayment(uint256 indexed loanId, address indexed shop, uint256 amount, uint256 totalRepaid, uint256 remaining);
    event LoanRepaid(uint256 indexed loanId, address indexed shop, uint256 totalRepaid, uint256 daysToRepay);
    event CreditPassportMinted(uint256 indexed loanId, address indexed shop, uint256 principal, uint256 daysToRepay);
    event LenderDeposited(address indexed lender, uint256 amount, uint256 shares);
    event LenderWithdrew(address indexed lender, uint256 amount, uint256 shares);

    error NotAIGuarantor();
    error NotSalesLedger();
    error LoanNotFound(uint256 loanId);
    error LoanNotProposed(uint256 loanId);
    error LoanAlreadyActive(address shop);
    error ExceedsMaxLoanSize(uint256 requested, uint256 max);
    error ExceedsPoolExposure();
    error InvalidSignature();
    error ProposalExpired(uint256 loanId);
    error InsufficientPoolLiquidity();
    error CooldownActive(address shop, uint256 unlockTimestamp);

    constructor(address _salesLedger, address _tUSD8) {
        owner = msg.sender;
        salesLedger = _salesLedger;
        tUSD8 = IERC20Minimal(_tUSD8);
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("HanumPayLoanPool"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    function setAIGuarantor(address _aiGuarantor) external {
        require(msg.sender == owner, "Only owner");
        aiGuarantor = _aiGuarantor;
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Zero amount");
        require(tUSD8.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 shares = totalShares == 0 || totalDeposited == 0
            ? amount
            : (amount * totalShares) / totalDeposited;
        totalShares += shares;
        totalDeposited += amount;
        lenderShares[msg.sender] += shares;
        emit LenderDeposited(msg.sender, amount, shares);
    }

    function withdraw(uint256 shares) external {
        require(shares > 0 && lenderShares[msg.sender] >= shares, "Insufficient shares");
        uint256 amount = (shares * totalDeposited) / totalShares;
        uint256 available = totalDeposited > totalLoaned ? totalDeposited - totalLoaned : 0;
        if (amount > available) revert InsufficientPoolLiquidity();

        lenderShares[msg.sender] -= shares;
        totalShares -= shares;
        totalDeposited -= amount;
        require(tUSD8.transfer(msg.sender, amount), "Transfer failed");
        emit LenderWithdrew(msg.sender, amount, shares);
    }

    function proposeLoan(
        address shop,
        uint256 principal,
        uint256 flatFee,
        uint256 repayPct
    ) external returns (uint256 loanId) {
        if (msg.sender != aiGuarantor) revert NotAIGuarantor();
        if (_activeLoanOf[shop] != 0) revert LoanAlreadyActive(shop);
        if (_cooldownEnd[shop] > block.timestamp) revert CooldownActive(shop, _cooldownEnd[shop]);
        if (principal > MAX_LOAN_USD8) revert ExceedsMaxLoanSize(principal, MAX_LOAN_USD8);

        uint256 projectedLoaned = totalLoaned + principal;
        if (totalDeposited == 0 || (projectedLoaned * 10_000) / totalDeposited > MAX_EXPOSURE_BPS) {
            revert ExceedsPoolExposure();
        }

        loanId = nextLoanId++;
        _loans[loanId] = Loan({
            id: loanId,
            shop: shop,
            principal: principal,
            flatFee: flatFee,
            repayPct: repayPct,
            totalRepaid: 0,
            proposedAt: block.timestamp,
            acceptedAt: 0,
            repaidAt: 0,
            status: LoanStatus.Proposed
        });
        _shopLoans[shop].push(loanId);
        emit LoanProposed(loanId, shop, principal, flatFee, repayPct);
    }

    function acceptLoan(uint256 loanId, uint256 deadline, bytes calldata signature) external {
        Loan storage loan = _loans[loanId];
        if (loan.id == 0) revert LoanNotFound(loanId);
        if (loan.status != LoanStatus.Proposed) revert LoanNotProposed(loanId);
        if (block.timestamp > loan.proposedAt + PROPOSAL_TTL) {
            loan.status = LoanStatus.Expired;
            revert ProposalExpired(loanId);
        }
        if (block.timestamp > deadline || signature.length != 65) revert InvalidSignature();

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encode(
                        ACCEPT_LOAN_TYPEHASH,
                        loanId,
                        loan.shop,
                        loan.principal,
                        loan.flatFee,
                        loan.repayPct,
                        deadline
                    )
                )
            )
        );
        if (_recover(digest, signature) != loan.shop) revert InvalidSignature();

        uint256 available = totalDeposited > totalLoaned ? totalDeposited - totalLoaned : 0;
        if (loan.principal > available) revert InsufficientPoolLiquidity();

        loan.status = LoanStatus.Active;
        loan.acceptedAt = block.timestamp;
        _activeLoanOf[loan.shop] = loanId;
        totalLoaned += loan.principal;
        activeLoanCount += 1;

        require(tUSD8.transfer(loan.shop, loan.principal), "Disburse failed");
        emit LoanAccepted(loanId, loan.shop, block.timestamp);
    }

    function repayFromSale(address shop, uint256 saleAmount) external returns (uint256 netAmount) {
        if (msg.sender != salesLedger) revert NotSalesLedger();
        uint256 loanId = _activeLoanOf[shop];
        if (loanId == 0) return saleAmount;

        Loan storage loan = _loans[loanId];
        uint256 totalDue = loan.principal + loan.flatFee;
        uint256 remaining = totalDue > loan.totalRepaid ? totalDue - loan.totalRepaid : 0;
        uint256 deduction = (saleAmount * loan.repayPct) / 10_000;
        if (deduction > remaining) deduction = remaining;

        if (deduction > 0) {
            require(tUSD8.transferFrom(shop, address(this), deduction), "Repay transfer failed");
            loan.totalRepaid += deduction;
            if (totalLoaned >= deduction) {
                totalLoaned -= deduction;
            } else {
                totalLoaned = 0;
            }
        }

        uint256 newRemaining = totalDue > loan.totalRepaid ? totalDue - loan.totalRepaid : 0;
        emit LoanRepayment(loanId, shop, deduction, loan.totalRepaid, newRemaining);

        if (newRemaining == 0) {
            loan.status = LoanStatus.Repaid;
            loan.repaidAt = block.timestamp;
            _activeLoanOf[shop] = 0;
            if (activeLoanCount > 0) activeLoanCount -= 1;
            totalFeeEarned += loan.flatFee;
            totalDeposited += loan.flatFee;
            _cooldownEnd[shop] = block.timestamp + COOLDOWN_PERIOD;

            uint256 daysToRepay = (block.timestamp - loan.acceptedAt) / 1 days;
            emit LoanRepaid(loanId, shop, loan.totalRepaid, daysToRepay);
            emit CreditPassportMinted(loanId, shop, loan.principal, daysToRepay);
        }

        return saleAmount - deduction;
    }

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return _loans[loanId];
    }

    function getActiveLoan(address shop) external view returns (uint256) {
        return _activeLoanOf[shop];
    }

    function getShopLoans(address shop) external view returns (uint256[] memory) {
        return _shopLoans[shop];
    }

    function getCooldownEnd(address shop) external view returns (uint256) {
        return _cooldownEnd[shop];
    }

    function getPoolStats() external view returns (PoolStats memory stats) {
        uint256 available = totalDeposited > totalLoaned ? totalDeposited - totalLoaned : 0;
        uint256 util = totalDeposited > 0 ? (totalLoaned * 10_000) / totalDeposited : 0;
        stats = PoolStats({
            totalDeposited: totalDeposited,
            totalLoaned: totalLoaned,
            totalAvailable: available,
            utilizationPct: util,
            totalFeeEarned: totalFeeEarned,
            activeLoanCount: activeLoanCount
        });
    }

    function getLenderBalance(address lender) external view returns (uint256 shares, uint256 tUSD8Value) {
        shares = lenderShares[lender];
        tUSD8Value = totalShares > 0 ? (shares * totalDeposited) / totalShares : 0;
    }

    function _recover(bytes32 digest, bytes memory sig) internal pure returns (address) {
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return ecrecover(digest, v, r, s);
    }
}
