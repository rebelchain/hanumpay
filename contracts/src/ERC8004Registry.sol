// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ERC8004Registry {
    struct Identity {
        address wallet;
        string  name;
        string  category; // "shop" | "agent" | "supplier" | "lender"
        bytes   metadata;
        uint256 registeredAt;
        bool    active;
    }

    mapping(bytes32 => Identity) private _identities;
    mapping(address => string) private _nameOf;

    event IdentityRegistered(bytes32 indexed nameHash, address indexed wallet, string name, string category);
    event IdentityUpdated(bytes32 indexed nameHash, address indexed wallet);
    event IdentityRevoked(bytes32 indexed nameHash);

    error NameAlreadyTaken(string name);
    error IdentityNotFound(string name);
    error NotIdentityOwner();
    error EmptyName();

    function register(string calldata name, string calldata category, bytes calldata metadata) external {
        if (bytes(name).length == 0 || bytes(name).length > 64) revert EmptyName();
        bytes32 h = keccak256(bytes(name));
        if (_identities[h].wallet != address(0)) revert NameAlreadyTaken(name);

        _identities[h] = Identity({
            wallet: msg.sender,
            name: name,
            category: category,
            metadata: metadata,
            registeredAt: block.timestamp,
            active: true
        });
        _nameOf[msg.sender] = name;
        emit IdentityRegistered(h, msg.sender, name, category);
    }

    function update(string calldata name, bytes calldata newMetadata) external {
        bytes32 h = keccak256(bytes(name));
        Identity storage id = _identities[h];
        if (id.wallet == address(0)) revert IdentityNotFound(name);
        if (id.wallet != msg.sender) revert NotIdentityOwner();
        id.metadata = newMetadata;
        emit IdentityUpdated(h, msg.sender);
    }

    function revoke(string calldata name) external {
        bytes32 h = keccak256(bytes(name));
        Identity storage id = _identities[h];
        if (id.wallet == address(0)) revert IdentityNotFound(name);
        if (id.wallet != msg.sender) revert NotIdentityOwner();
        id.active = false;
        emit IdentityRevoked(h);
    }

    function resolve(string calldata name) external view returns (address) {
        Identity storage id = _identities[keccak256(bytes(name))];
        return id.active ? id.wallet : address(0);
    }

    function getIdentity(string calldata name) external view returns (Identity memory) {
        return _identities[keccak256(bytes(name))];
    }

    function isVerified(string calldata name) external view returns (bool) {
        return _identities[keccak256(bytes(name))].active;
    }

    function nameOf(address wallet) external view returns (string memory) {
        return _nameOf[wallet];
    }
}
