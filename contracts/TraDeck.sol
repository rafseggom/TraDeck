// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TraDeck is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    struct Listing {
        uint256 price;
        address seller;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    // Actualizamos el nombre y el símbolo del token para la red
    constructor() ERC721("TraDeck", "TRDK") Ownable(msg.sender) {}

    // Fase 2.1: Crear la carta (NFT) con su enlace a IPFS
    function mintCard(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    // Fase 2.2: Poner a la venta
    function listForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "No eres el dueno");
        listings[tokenId] = Listing(price, msg.sender, true);
    }

    // Fase 2.3: Compra con Escrow (el dinero se queda en el contrato)
    function buyCard(uint256 tokenId) public payable {
        Listing storage listing = listings[tokenId];
        require(listing.active, "No esta a la venta");
        require(msg.value >= listing.price, "Saldo insuficiente");
        
        // El contrato retiene los fondos hasta confirmDelivery
    }

    // Fase 2.4: Finalizar transaccion y transferir propiedad
    function confirmDelivery(uint256 tokenId) public {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Transaccion no activa");
        
        listing.active = false;
        payable(listing.seller).transfer(listing.price);
        _transfer(listing.seller, msg.sender, tokenId);
    }
}