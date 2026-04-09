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

    //Compra y Liquidacion
    function buyCard(uint256 tokenId) public payable {
        Trade storage trade = trades[tokenId];

        require(trade.state == TradeState.Listed, "La carta no esta listada para la venta");
        require(msg.value == trade.price, "El valor enviado no coincide con el precio de la carta");
        require(trade.seller != msg.sender, "No puedes comprar tu propia carta");

        trade.buyer = msg.sender;
        trade.state = TradeState.InEscrow;
    }

    // Función final: El comprador confirma que todo está bien y se libera todo.
    function confirmDelivery(uint256 tokenId) public {
        Trade storage trade = trades[tokenId];
        
        require(trade.state == TradeState.InEscrow, "La transaccion no esta en Escrow");
        require(msg.sender == trade.buyer, "Solo el comprador puede confirmar la entrega");

        address seller = trade.seller;
        address buyer = trade.buyer;
        uint256 price = trade.price;

        delete trades[tokenId];

        (bool success, ) = payable(seller).call{value: price}("");
        require(success, "Fallo al enviar el dinero al vendedor");

        _transfer(address(this), buyer, tokenId);
    }


}