// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FUSD is ERC20 {
    constructor() ERC20("FUSD", "FUSD") {
        _mint(msg.sender, 100000000000 * 10**uint256(decimals()));
    }
}
