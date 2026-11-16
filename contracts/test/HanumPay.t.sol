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

    function _signSale(uint256 amount, bytes32 custId, uint256 deadline) internal returns (bytes memory) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                ledger.DOMAIN_SEPARATOR(),
                keccak256(abi.encode(ledger.RECORD_SALE_TYPEHASH(), shop, amount, custId, deadline))
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
}
