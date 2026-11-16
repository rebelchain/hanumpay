// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILoanPoolHook {
    function repayFromSale(address shop, uint256 saleAmount) external returns (uint256 netAmount);
}

contract SalesLedger {
    struct Sale {
        address shop;
        uint256 amountUSD8;
        bytes32 customerId;
        uint256 timestamp;
    }

    struct ShopStats {
        uint256 totalSales30d;
        uint256 uniqueCustomers30d;
        uint256 totalSalesAllTime;
        uint256 totalSaleCount;
        uint256 lastSaleTimestamp;
        bool    hasMinimumHistory;
    }

    bytes32 public constant RECORD_SALE_TYPEHASH =
        keccak256("RecordSale(address shop,uint256 amountUSD8,bytes32 customerId,uint256 deadline)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    address public loanPool;
    address public owner;
    address[] private _shops;
    mapping(address => bool) public isRegisteredShop;
    mapping(address => uint256) public shopRegisteredAt;
    mapping(address => Sale[]) private _shopSales;
    mapping(address => mapping(bytes32 => uint256)) private _lastSeenCustomer;
    mapping(address => uint256) private _uniqueCount30d;

    event SaleRecorded(address indexed shop, uint256 amount, bytes32 indexed customerId, uint256 timestamp, uint256 saleIndex);

    error InvalidAmount();
    error InvalidSignature();
    error ShopNotRegistered(address shop);
    error ZeroCustomerId();

    constructor() {
        owner = msg.sender;
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("HanumPaySalesLedger"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    function setLoanPool(address _loanPool) external {
        require(msg.sender == owner, "Only owner");
        loanPool = _loanPool;
    }

    function registerShop(string calldata) external {
        if (!isRegisteredShop[msg.sender]) {
            isRegisteredShop[msg.sender] = true;
            shopRegisteredAt[msg.sender] = block.timestamp;
            _shops.push(msg.sender);
        }
    }

    function recordSale(
        address shop,
        uint256 amountUSD8,
        bytes32 customerId,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (!isRegisteredShop[shop]) revert ShopNotRegistered(shop);
        if (amountUSD8 < 100_000 || amountUSD8 > 500_000_000) revert InvalidAmount();
        if (customerId == bytes32(0)) revert ZeroCustomerId();
        if (block.timestamp > deadline || signature.length != 65) revert InvalidSignature();

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(RECORD_SALE_TYPEHASH, shop, amountUSD8, customerId, deadline))
            )
        );
        if (_recover(digest, signature) != shop) revert InvalidSignature();

        if (_lastSeenCustomer[shop][customerId] < block.timestamp - 30 days) {
            _uniqueCount30d[shop] += 1;
        }
        _lastSeenCustomer[shop][customerId] = block.timestamp;

        uint256 idx = _shopSales[shop].length;
        _shopSales[shop].push(Sale(shop, amountUSD8, customerId, block.timestamp));
        emit SaleRecorded(shop, amountUSD8, customerId, block.timestamp, idx);

        if (loanPool != address(0)) {
            ILoanPoolHook(loanPool).repayFromSale(shop, amountUSD8);
        }
    }

    function getShopStats(address shop) external view returns (ShopStats memory stats) {
        Sale[] storage list = _shopSales[shop];
        uint256 cutoff = block.timestamp > 30 days ? block.timestamp - 30 days : 0;
        for (uint256 i = 0; i < list.length; i++) {
            stats.totalSalesAllTime += list[i].amountUSD8;
            if (list[i].timestamp >= cutoff) {
                stats.totalSales30d += list[i].amountUSD8;
            }
            stats.lastSaleTimestamp = list[i].timestamp;
        }
        stats.totalSaleCount = list.length;
        stats.uniqueCustomers30d = _uniqueCount30d[shop];
        stats.hasMinimumHistory = shopRegisteredAt[shop] > 0 && (block.timestamp - shopRegisteredAt[shop] >= 30 days);
    }

    function totalShops() external view returns (uint256) {
        return _shops.length;
    }

    function getShops(uint256 offset, uint256 limit) external view returns (address[] memory out) {
        uint256 len = _shops.length;
        if (offset >= len) return new address[](0);
        uint256 end = offset + limit > len ? len : offset + limit;
        out = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            out[i - offset] = _shops[i];
        }
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
