// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/ERC8004Registry.sol";
import "../src/SalesLedger.sol";
import "../src/LoanPool.sol";
import "../src/AIGuarantor.sol";

interface VmTest {
    function warp(uint256 newTimestamp) external;
    function prank(address msgSender) external;
    function startPrank(address msgSender) external;
    function stopPrank() external;
    function sign(uint256 privateKey, bytes32 digest) external returns (uint8 v, bytes32 r, bytes32 s);
    function addr(uint256 privateKey) external returns (address);
    function expectRevert() external;
}

contract MockTUSD8 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount && allowance[from][msg.sender] >= amount, "Allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract HanumPayTest {
    VmTest constant vm = VmTest(address(uint160(uint256(keccak256("hevm cheat code")))));

    MockTUSD8 tusd8;
    ERC8004Registry registry;
    SalesLedger ledger;
    LoanPool pool;
    AIGuarantor guarantor;

    uint256 shopPk = 0xA11CE;
    address shop;
    address agent = address(0xA6E47);
    address lender = address(0x1E4DE);

    function setUp() public {
        vm.warp(1_700_000_000);
        shop = vm.addr(shopPk);

        tusd8 = new MockTUSD8();
        registry = new ERC8004Registry();
        ledger = new SalesLedger();
        pool = new LoanPool(address(ledger), address(tusd8));
        guarantor = new AIGuarantor(agent, address(ledger), address(pool));

        ledger.setLoanPool(address(pool));
        pool.setAIGuarantor(address(guarantor));

        tusd8.mint(lender, 10_000 * 1e6);
        vm.startPrank(lender);
        tusd8.approve(address(pool), 10_000 * 1e6);
        pool.deposit(10_000 * 1e6);
        vm.stopPrank();

        vm.prank(shop);
        registry.register("Warung Bu Sri", "shop", "");
        vm.prank(shop);
        ledger.registerShop("Warung Bu Sri");
    }

    function _signSaleFor(
        uint256 pk,
        address shopAddr,
        uint256 amount,
        bytes32 custId,
        uint256 deadline
    ) internal returns (bytes memory) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                ledger.DOMAIN_SEPARATOR(),
                keccak256(abi.encode(ledger.RECORD_SALE_TYPEHASH(), shopAddr, amount, custId, deadline))
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function _signSale(uint256 amount, bytes32 custId, uint256 deadline) internal returns (bytes memory) {
        return _signSaleFor(shopPk, shop, amount, custId, deadline);
    }

    function _signAcceptLoan(
        uint256 loanId,
        uint256 principal,
        uint256 flatFee,
        uint256 repayPct,
        uint256 deadline
    ) internal returns (bytes memory) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                pool.DOMAIN_SEPARATOR(),
                keccak256(
                    abi.encode(
                        pool.ACCEPT_LOAN_TYPEHASH(),
                        loanId,
                        shop,
                        principal,
                        flatFee,
                        repayPct,
                        deadline
                    )
                )
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(shopPk, digest);
        return abi.encodePacked(r, s, v);
    }

    function testCannotProposeWithFewerThan5Customers() public {
        uint256 deadline = block.timestamp + 1 hours;
        for (uint256 i = 0; i < 4; i++) {
            bytes32 cust = keccak256(abi.encodePacked("cust", i));
            bytes memory sig = _signSale(250 * 1e6, cust, deadline);
            ledger.recordSale(shop, 250 * 1e6, cust, deadline, sig);
        }

        vm.warp(block.timestamp + 31 days);
        vm.prank(agent);
        vm.expectRevert();
        guarantor.proposeLoan(shop);
    }

    function testEndToEndGaslessSaleAndAIProposal() public {
        vm.warp(block.timestamp + 31 days);
        uint256 deadline = block.timestamp + 1 hours;
        for (uint256 i = 0; i < 5; i++) {
            bytes32 cust = keccak256(abi.encodePacked("cust", i));
            bytes memory sig = _signSale(200 * 1e6, cust, deadline);
            ledger.recordSale(shop, 200 * 1e6, cust, deadline, sig);
        }

        // 5 * $200 = $1,000 -> 10% = $100 tUSD8 loan
        vm.prank(agent);
        uint256 loanId = guarantor.proposeLoan(shop);
        LoanPool.Loan memory loan = pool.getLoan(loanId);
        require(loan.principal == 100 * 1e6, "Expected 100 tUSD8 principal");
        require(loan.flatFee == 5 * 1e6, "Expected 5 tUSD8 flat fee");
    }

    function testMerchantCanPauseAndResumeAgentAccess() public {
        vm.warp(block.timestamp + 31 days);
        uint256 deadline = block.timestamp + 1 hours;
        for (uint256 i = 0; i < 5; i++) {
            bytes32 cust = keccak256(abi.encodePacked("cust-p", i));
            bytes memory sig = _signSale(200 * 1e6, cust, deadline);
            ledger.recordSale(shop, 200 * 1e6, cust, deadline, sig);
        }

        vm.prank(shop);
        guarantor.setAgentPaused(true);

        vm.prank(agent);
        vm.expectRevert();
        guarantor.proposeLoan(shop);

        vm.prank(shop);
        guarantor.setAgentPaused(false);

        vm.prank(agent);
        uint256 loanId = guarantor.proposeLoan(shop);
        require(loanId > 0, "Expected proposal to succeed after resume");
    }

    function testAcceptLoanAutoRepayAndCooldown() public {
        vm.warp(block.timestamp + 31 days);
        uint256 deadline = block.timestamp + 1 hours;
        for (uint256 i = 0; i < 5; i++) {
            bytes32 cust = keccak256(abi.encodePacked("cust-repay", i));
            bytes memory sig = _signSale(200 * 1e6, cust, deadline);
            ledger.recordSale(shop, 200 * 1e6, cust, deadline, sig);
        }

        vm.prank(agent);
        uint256 loanId = guarantor.proposeLoan(shop);

        // Merchant signs EIP-712 consent to accept 100 tUSD8 (+ 5 tUSD8 flat fee)
        bytes memory acceptSig = _signAcceptLoan(loanId, 100 * 1e6, 5 * 1e6, 1000, deadline);
        pool.acceptLoan(loanId, deadline, acceptSig);
        require(tusd8.balanceOf(shop) == 100 * 1e6, "Expected 100 tUSD8 disbursed");
        require(pool.getActiveLoan(shop) == loanId, "Expected active loan recorded");

        // Shop receives incoming sales revenue & approves LoanPool auto-repay (10% cut per sale)
        tusd8.mint(shop, 10 * 1e6);
        vm.prank(shop);
        tusd8.approve(address(pool), 200 * 1e6);

        ledger.recordSale(shop, 500 * 1e6, keccak256("buyer-a"), deadline, _signSale(500 * 1e6, keccak256("buyer-a"), deadline));
        ledger.recordSale(shop, 500 * 1e6, keccak256("buyer-b"), deadline, _signSale(500 * 1e6, keccak256("buyer-b"), deadline));
        ledger.recordSale(shop, 50 * 1e6, keccak256("buyer-c"), deadline, _signSale(50 * 1e6, keccak256("buyer-c"), deadline));

        LoanPool.Loan memory settled = pool.getLoan(loanId);
        require(settled.status == LoanPool.LoanStatus.Repaid, "Expected loan repaid");
        require(settled.totalRepaid == 105 * 1e6, "Expected 105 tUSD8 total repaid");
        require(pool.getActiveLoan(shop) == 0, "Expected active loan cleared");
        require(pool.totalFeeEarned() == 5 * 1e6, "Expected 5 tUSD8 fee earned by LPs");

        // 30-day cooldown blocks immediate re-borrowing
        vm.prank(agent);
        vm.expectRevert();
        guarantor.proposeLoan(shop);
    }

    function testPoolMaxExposure80PercentCap() public {
        SalesLedger smallLedger = new SalesLedger();
        LoanPool smallPool = new LoanPool(address(smallLedger), address(tusd8));
        AIGuarantor smallGuarantor = new AIGuarantor(agent, address(smallLedger), address(smallPool));
        smallLedger.setLoanPool(address(smallPool));
        smallPool.setAIGuarantor(address(smallGuarantor));

        tusd8.mint(lender, 600 * 1e6);
        vm.startPrank(lender);
        tusd8.approve(address(smallPool), 600 * 1e6);
        smallPool.deposit(600 * 1e6);
        vm.stopPrank();

        uint256 bigShopPk = 0xB0B;
        address bigShop = vm.addr(bigShopPk);
        vm.prank(bigShop);
        smallLedger.registerShop("Toko Besar");

        vm.warp(block.timestamp + 31 days);
        uint256 deadline = block.timestamp + 1 hours;
        for (uint256 i = 0; i < 10; i++) {
            bytes32 cust = keccak256(abi.encodePacked("big-cust", i));
            bytes32 digest = keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    smallLedger.DOMAIN_SEPARATOR(),
                    keccak256(abi.encode(smallLedger.RECORD_SALE_TYPEHASH(), bigShop, uint256(500 * 1e6), cust, deadline))
                )
            );
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(bigShopPk, digest);
            smallLedger.recordSale(bigShop, 500 * 1e6, cust, deadline, abi.encodePacked(r, s, v));
        }

        // $5,000 sales -> $500 loan exceeds 80% ($480) of $600 pool TVL -> must revert
        vm.prank(agent);
        vm.expectRevert();
        smallGuarantor.proposeLoan(bigShop);
    }

    function testLoanPrincipalHardCappedAt500() public {
        vm.warp(block.timestamp + 31 days);
        uint256 deadline = block.timestamp + 1 hours;
        // 20 * $500 = $10,000 sales -> 10% would be $1,000, contract caps at $500
        for (uint256 i = 0; i < 20; i++) {
            bytes32 cust = keccak256(abi.encodePacked("high-vol", i));
            bytes memory sig = _signSale(500 * 1e6, cust, deadline);
            ledger.recordSale(shop, 500 * 1e6, cust, deadline, sig);
        }

        vm.prank(agent);
        uint256 loanId = guarantor.proposeLoan(shop);
        LoanPool.Loan memory loan = pool.getLoan(loanId);
        require(loan.principal == 500 * 1e6, "Expected principal hard-capped at 500 tUSD8");
        require(loan.flatFee == 25 * 1e6, "Expected 5% flat fee = 25 tUSD8");
    }

    function testERC8004ConfirmationOfPayeeAndRevoke() public {
        address supplier = address(0x5011);
        address attacker = address(0xBAD);

        vm.prank(supplier);
        registry.register("Pak Joko Distributor", "supplier", "");
        require(registry.resolve("Pak Joko Distributor") == supplier, "Expected supplier resolved");
        require(registry.isVerified("Pak Joko Distributor"), "Expected verified supplier");

        vm.prank(attacker);
        vm.expectRevert();
        registry.register("Pak Joko Distributor", "supplier", "");

        vm.prank(attacker);
        vm.expectRevert();
        registry.revoke("Pak Joko Distributor");

        vm.prank(supplier);
        registry.revoke("Pak Joko Distributor");
        require(registry.resolve("Pak Joko Distributor") == address(0), "Expected revoked address cleared");
        require(!registry.isVerified("Pak Joko Distributor"), "Expected unverified after revoke");
    }
}
