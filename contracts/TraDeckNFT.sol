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

    //2: Estructura del Mercado
    enum TradeState {NotListed, Listed, InEscrow}

    struct Trade {
        address seller;
        address buyer;
        uint256 price;
        TradeState state;
    }

    mapping(uint256 => Trade) public trades;

    function ListForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede listar la carta");
        require(price > 0, "El precio debe ser mayor a cero");
        require(trades[tokenId].state == TradeState.NotListed, "La carta ya esta listada");

        _transfer(msg.sender, address(this), tokenId);

        trades[tokenId] = Trade({
            seller: msg.sender,
            buyer: address(0),
            price: price,
            state: TradeState.Listed
        });

    }


}