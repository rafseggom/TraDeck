// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TraDeck is ERC721URIStorage, Ownable, ReentrancyGuard {
    uint256 private _nextTokenId;

    struct Listing {
        uint256 price;
        address seller;
        bool active;
    }

    struct Purchase {
        address buyer;
        uint256 amount;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Purchase) public purchases;

    event CardMinted(uint256 indexed tokenId, address indexed owner, string tokenURI);
    event CardListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event CardPurchased(uint256 indexed tokenId, address indexed buyer, uint256 amount);
    event DeliveryConfirmed(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 amount);
    event ListingCanceled(uint256 indexed tokenId, address indexed seller);
    event PurchaseCanceled(uint256 indexed tokenId, address indexed buyer, uint256 amount);

    // Actualizamos el nombre y el símbolo del token para la red
    constructor() ERC721("TraDeck", "TRDK") Ownable(msg.sender) {}

    // Fase 2.1: Crear la carta (NFT) con su enlace a IPFS
    function mintCard(string memory tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit CardMinted(tokenId, msg.sender, tokenURI);
        return tokenId;
    }

    // Fase 2.2: Poner a la venta
    function listForSale(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "No eres el dueno");
        require(price > 0, "Precio invalido");
        require(!listings[tokenId].active, "Ya esta listado");
        listings[tokenId] = Listing(price, msg.sender, true);
        emit CardListed(tokenId, msg.sender, price);
    }

    // Fase 2.3: Compra con Escrow (el dinero se queda en el contrato)
    function buyCard(uint256 tokenId) public payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "No esta a la venta");
        require(msg.sender != listing.seller, "El vendedor no puede comprar");
        require(msg.value == listing.price, "Monto invalido");
        require(!purchases[tokenId].active, "Compra ya iniciada");

        purchases[tokenId] = Purchase(msg.sender, msg.value, true);
        emit CardPurchased(tokenId, msg.sender, msg.value);
    }

    // Fase 2.4: Finalizar transaccion y transferir propiedad
    function confirmDelivery(uint256 tokenId) public nonReentrant {
        Listing storage listing = listings[tokenId];
        Purchase storage purchase = purchases[tokenId];

        require(listing.active, "Transaccion no activa");
        require(purchase.active, "No hay compra activa");
        require(msg.sender == purchase.buyer, "Solo el comprador confirma");

        listing.active = false;

        address seller = listing.seller;
        address buyer = purchase.buyer;
        uint256 amount = purchase.amount;

        delete purchases[tokenId];

        _transfer(seller, buyer, tokenId);

        (bool ok, ) = payable(seller).call{value: amount}("");
        require(ok, "Fallo el pago");

        emit DeliveryConfirmed(tokenId, seller, buyer, amount);
    }

    function cancelListing(uint256 tokenId) public {
        Listing storage listing = listings[tokenId];
        require(listing.active, "No esta listado");
        require(msg.sender == listing.seller, "Solo el vendedor cancela");
        require(!purchases[tokenId].active, "Compra en curso");

        listing.active = false;
        emit ListingCanceled(tokenId, msg.sender);
    }

    function cancelPurchase(uint256 tokenId) public nonReentrant {
        Listing storage listing = listings[tokenId];
        Purchase storage purchase = purchases[tokenId];

        require(listing.active, "Transaccion no activa");
        require(purchase.active, "No hay compra activa");
        require(msg.sender == purchase.buyer, "Solo el comprador cancela");

        uint256 amount = purchase.amount;
        delete purchases[tokenId];

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Fallo el reembolso");

        emit PurchaseCanceled(tokenId, msg.sender, amount);
    }
}