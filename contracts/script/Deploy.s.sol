// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/ERC8004Registry.sol";
import "../src/SalesLedger.sol";
import "../src/LoanPool.sol";
import "../src/AIGuarantor.sol";

interface Vm {
    function envUint(string calldata name) external returns (uint256);
    function envAddress(string calldata name) external returns (address);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployHanumPay {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Official tUSD8 on QDay Aevum Testnet (6 decimals)
    address constant TUSD8_QDAY = 0x456569838f1d43009A91ebA4263147Afd7233483;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agentWallet = vm.envAddress("AGENT_WALLET_ADDRESS");

        vm.startBroadcast(deployerKey);

        ERC8004Registry registry = new ERC8004Registry();
        SalesLedger salesLedger = new SalesLedger();
        LoanPool loanPool = new LoanPool(address(salesLedger), TUSD8_QDAY);
        AIGuarantor aiGuarantor = new AIGuarantor(agentWallet, address(salesLedger), address(loanPool));

        salesLedger.setLoanPool(address(loanPool));
        loanPool.setAIGuarantor(address(aiGuarantor));

        vm.stopBroadcast();
    }
}
