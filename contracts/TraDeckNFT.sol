// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TraDeckNFT is ERC721URIStorage {

    uint256 private _nextTokenId;

    constructor() ERC721("TraDeck", "TDK") {}

    function mintCard(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;

        _mint(msg.sender, tokenId);

        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }

    


}