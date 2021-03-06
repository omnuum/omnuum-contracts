// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.10;

import '../V1/OmnuumExchange.sol';

contract MockExchange {
    function exchangeToken(
        address _exchangeCA,
        address _token,
        uint256 _amount,
        address _to
    ) public payable {
        OmnuumExchange(_exchangeCA).exchangeToken{ value: msg.value }(_token, _amount, _to);
    }
}
