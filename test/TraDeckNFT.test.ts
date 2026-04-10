import { expect } from "chai";
import { network } from "hardhat";

// Tu forma mágica e infalible de importar ethers
const { ethers } = await network.connect();

describe("TraDeck - Pruebas del Ecosistema con Moneda", function () {
    let coin: any;
    let tradeck: any;
    let owner: any;
    let seller: any;
    let buyer: any;

    beforeEach(async function () {
        [owner, seller, buyer] = await ethers.getSigners();

        // 1. Desplegamos la Moneda
        coin = await ethers.deployContract("TraDeckCoin");

        // 2. Desplegamos el Mercado pasándole la dirección de la moneda
        const coinAddress = await coin.getAddress();
        tradeck = await ethers.deployContract("TraDeckNFT", [coinAddress]);
    });
    
    it("Debería permitir a un usuario crear una carta", async function () {
        const tokenURI = "ipfs://example-token-uri";

        await tradeck.connect(seller).mintCard(tokenURI);

        expect(await tradeck.ownerOf(0)).to.equal(seller.address);
    });

    it("Debería ejecutar una compraventa completa y segura con TDKC", async function () {
        const precio = 100n; // 100 TDKC
    
        // 0. El comprador pide dinero al banco (Airdrop)
        await coin.connect(buyer).airdrop();

        // 1. El vendedor crea la carta
        await tradeck.connect(seller).mintCard("ipfs://test");
        
        // 2. El vendedor la pone a la venta por 100 TDKC
        await tradeck.connect(seller).listForSale(0, precio);

        // 3. El comprador DA PERMISO al mercado para gastar sus 100 TDKC
        const mercadoAddress = await tradeck.getAddress();
        await coin.connect(buyer).approve(mercadoAddress, precio);

        // 4. El comprador compra la carta (el mercado se cobra las monedas)
        // OJO: Ya no enviamos { value: precio } porque no usamos ETH
        await tradeck.connect(buyer).buyCard(0);

        // 5. El comprador confirma para que el vendedor reciba las monedas
        await tradeck.connect(buyer).confirmDelivery(0);

        // Comprobaciones finales:
        // La carta ahora debe ser del comprador
        expect(await tradeck.ownerOf(0)).to.equal(buyer.address);
        
        // El vendedor debe tener las 100 monedas en su saldo
        expect(await coin.balanceOf(seller.address)).to.equal(precio);
    });
});