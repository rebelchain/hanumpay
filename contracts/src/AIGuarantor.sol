// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISalesLedgerView {
    struct ShopStats {
        uint256 totalSales30d;
        uint256 uniqueCustomers30d;
        uint256 totalSalesAllTime;
        uint256 totalSaleCount;
        uint256 lastSaleTimestamp;
        bool    hasMinimumHistory;
    }
    function getShopStats(address shop) external view returns (ShopStats memory);
}

interface ILoanPoolWrite {
    function proposeLoan(address shop, uint256 principal, uint256 flatFee, uint256 repayPct) external returns (uint256);
    function getActiveLoan(address shop) external view returns (uint256);
    function getCooldownEnd(address shop) external view returns (uint256);
}

contract AIGuarantor {
    uint256 public constant MAX_LOAN_USD8        = 500 * 1e6;
    uint256 public constant MIN_LOAN_USD8        = 5 * 1e6;
    uint256 public constant MAX_DAILY_PROPOSALS  = 10;
    uint256 public constant MIN_UNIQUE_CUSTOMERS = 5;
    uint256 public constant FLAT_FEE_BPS         = 500;   // 5% flat
    uint256 public constant REPAY_PCT_BPS        = 1000;  // 10% per sale

    address public immutable agentWallet;
    ISalesLedgerView public immutable salesLedger;
    ILoanPoolWrite public immutable loanPool;

    mapping(uint256 => uint256) private _dailyCount;
    mapping(address => bool) public shopPausedAgent;

    event ProposalSubmitted(address indexed shop, uint256 principal, uint256 flatFee, uint256 loanId, uint256 timestamp);
    event AgentAccessUpdated(address indexed shop, bool paused, uint256 timestamp);

    error NotAuthorizedAgent();
    error DailyBudgetExhausted(uint256 usedToday, uint256 max);
    error ShopNotEligible(address shop, string reason);

    constructor(address _agentWallet, address _salesLedger, address _loanPool) {
        agentWallet = _agentWallet;
        salesLedger = ISalesLedgerView(_salesLedger);
        loanPool = ILoanPoolWrite(_loanPool);
    }

    function setAgentPaused(bool paused) external {
        shopPausedAgent[msg.sender] = paused;
        emit AgentAccessUpdated(msg.sender, paused, block.timestamp);
    }

    function proposeLoan(address shop) external returns (uint256 loanId) {
        if (msg.sender != agentWallet) revert NotAuthorizedAgent();
        uint256 dayKey = block.timestamp / 1 days;
        if (_dailyCount[dayKey] >= MAX_DAILY_PROPOSALS) {
            revert DailyBudgetExhausted(_dailyCount[dayKey], MAX_DAILY_PROPOSALS);
        }

        (bool eligible, string memory reason) = checkEligibility(shop);
        if (!eligible) revert ShopNotEligible(shop, reason);

        ISalesLedgerView.ShopStats memory stats = salesLedger.getShopStats(shop);
        uint256 principal = (stats.totalSales30d * 10) / 100;
        if (principal > MAX_LOAN_USD8) principal = MAX_LOAN_USD8;
        uint256 flatFee = (principal * FLAT_FEE_BPS) / 10_000;

        _dailyCount[dayKey] += 1;
        loanId = loanPool.proposeLoan(shop, principal, flatFee, REPAY_PCT_BPS);
        emit ProposalSubmitted(shop, principal, flatFee, loanId, block.timestamp);
    }

    function checkEligibility(address shop) public view returns (bool eligible, string memory reason) {
        if (shopPausedAgent[shop]) return (false, "Merchant paused AI Guarantor access");
        if (loanPool.getActiveLoan(shop) != 0) return (false, "Shop has an active loan");
        if (loanPool.getCooldownEnd(shop) > block.timestamp) return (false, "Shop in 30-day cooldown");

        ISalesLedgerView.ShopStats memory stats = salesLedger.getShopStats(shop);
        if (stats.uniqueCustomers30d < MIN_UNIQUE_CUSTOMERS) return (false, "Fewer than 5 unique customers");
        if (!stats.hasMinimumHistory) return (false, "Less than 30 days of sales history");

        uint256 principal = (stats.totalSales30d * 10) / 100;
        if (principal < MIN_LOAN_USD8) return (false, "Sales too low for minimum $5 tUSD8 loan");

        return (true, "");
    }

    function proposalsToday() external view returns (uint256) {
        return _dailyCount[block.timestamp / 1 days];
    }
}
