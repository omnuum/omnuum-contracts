// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol';

contract OmnuumCAManager is OwnableUpgradeable {
    struct Contract {
        string topic;
        bool active;
    }

    mapping(address => Contract) contracts;
    mapping(string => address) indexedContracts;

    event ContractRegistered(address, bytes32);
    event ContractRemoved(address, bytes32);

    // 비콘 프록시 배포
    function deployNFT() public {
        new BeaconProxy();
    }

    function initialize() public initializer {
        __Ownable_init();
    }

    function registerContractMultiple(address[] calldata CAs, string[] calldata topics) public onlyOwner {
        require(CAs.length == topics.length, 'length unmatched');
        for (uint256 i; i < CAs.length; i++) {
            registerContract(CAs[i], topics[i]);
        }
    }

    function registerContract(address CA, string calldata topic) public onlyOwner {
        contracts[CA] = Contract(topic, true);
        indexedContracts[topic] = CA;
        emit ContractRegistered(CA, keccak256(abi.encodePacked(contracts[CA].topic)));
    }

    function removeContract(address CA) public onlyOwner {
        string memory topic = contracts[CA].topic;
        delete contracts[CA];

        if (indexedContracts[topic] == CA) {
            delete indexedContracts[topic];
        }

        emit ContractRemoved(CA, keccak256(abi.encodePacked(contracts[CA].topic)));
    }

    function isRegistered(address CA) external view returns (bool) {
        return contracts[CA].active;
    }

    function getContract(string calldata topic) public view returns (address) {
        return indexedContracts[topic];
    }
}
