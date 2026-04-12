// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TraDeckNFT is ERC721URIStorage {

    IERC20 public paymentToken;
    uint256 private _nextTokenId;

    constructor(address _tokenAddress) ERC721("TraDeck", "TDK") {
        paymentToken = IERC20(_tokenAddress);
    }

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

    function listForSale(uint256 tokenId, uint256 price) public {
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
    function buyCard(uint256 tokenId) public {
        Trade storage trade = trades[tokenId];

        require(trade.state == TradeState.Listed, "La carta no esta listada para la venta");
        require(paymentToken.transferFrom(msg.sender, address(this), trade.price), "Fallo al transferir el pago");

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

        require(paymentToken.transfer(seller, price), "Fallo al transferir el pago al vendedor");

        _transfer(address(this), buyer, tokenId);
    }

    //TRUEQUE
    struct SwapOffer {
        address proposer;
        uint256 proposerTokenId;
        uint256 wantedTokenId;
        bool isActive;
    }

    //Diccionario con las ofertas de trueque
    mapping(uint256 => SwapOffer) public swapOffers;

    //Proponer intercambio
    function proposeSwap(uint256 myTokenId, uint256 wantedTokenId) public {
        require(ownerOf(myTokenId) == msg.sender, "Solo el propietario puede proponer un intercambio");
        require(ownerOf(wantedTokenId) != address(0), "La carta que deseas no existe");
        require(ownerOf(wantedTokenId) != msg.sender, "No puedes intercambiar una carta contigo mismo");

        swapOffers[myTokenId] = SwapOffer({
            proposer: msg.sender,
            proposerTokenId: myTokenId,
            wantedTokenId: wantedTokenId,
            isActive: true
        });
    }

    //Aceptar intercambio
    function acceptSwap(uint256 proposerTokenId) public {
        SwapOffer memory offer = swapOffers[proposerTokenId];

        require(offer.isActive, "La oferta de intercambio no esta activa");
        require(ownerOf(offer.wantedTokenId) == msg.sender, "Solo el propietario de la carta deseada puede aceptar el intercambio");
        require(ownerOf(offer.proposerTokenId) == offer.proposer, "El proponente ya no es el propietario de la carta ofrecida");

        //Seguridad
        delete swapOffers[proposerTokenId];

        _transfer(offer.proposer, msg.sender, offer.proposerTokenId);
        _transfer(msg.sender, offer.proposer, offer.wantedTokenId);
    }

    //Cancelar intercambio
    function cancelSwap(uint256 myTokenId) public {
        require(ownerOf(myTokenId) == msg.sender, "Solo el propietario puede cancelar un intercambio");
        delete swapOffers[myTokenId];
    }


}