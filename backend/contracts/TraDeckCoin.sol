// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TraDeckCoin is ERC20 {
    
    constructor() ERC20("TraDeck Coin", "TDC") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function airdrop() public {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}