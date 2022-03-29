// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.10;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol';
import './OmnuumCAManager.sol';

// in future, this contract will act like internal token exchange for business
contract OmnuumExchange is OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    OmnuumCAManager caManager;

    uint256 tmpLinkExRate;

    event Exchange(address baseToken, address targetToken, uint256 amount, address user, address receipient);

    function initialize(address _caManagerA) public initializer {
        require(_caManagerA != address(0));

        __Ownable_init();

        caManager = OmnuumCAManager(_caManagerA);

        tmpLinkExRate = 0.0055 ether; // TODO: should change before deploy
    }

    // temporary function for fixed link exchange rate -
    function getExchangeAmount(
        address _baseToken,
        address _targetToken,
        uint256 _amount
    ) public view returns (uint256) {
        return (tmpLinkExRate * _amount) / 1 ether;
    }

    function updateTmpExchangeRate(uint256 _newRate) public {
        require(caManager.isRegistered(msg.sender), 'OO3');
        tmpLinkExRate = _newRate;
    }

    // @dev exchange with ether, only receive token
    function exchangeToken(
        address _token,
        uint256 _amount,
        address _to
    ) public payable {
        require(caManager.isRegistered(msg.sender), 'OO3');

        IERC20Upgradeable(_token).safeTransfer(msg.sender, _amount);

        emit Exchange(address(0), _token, _amount, msg.sender, _to);
    }

    function withdraw() public {
        require(caManager.isRegistered(msg.sender), 'OO3');
        payable(msg.sender).transfer(address(this).balance);
    }
}
