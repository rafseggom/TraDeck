import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("TraDeckNFT - Pruebas del Escrow", function () {
    let tradeck: any;
    let owner: any;
    let seller: any;
    let buyer: any;

    beforeEach(async function () {
        [owner, seller, buyer] = await ethers.getSigners();

        tradeck = await ethers.deployContract("TraDeckNFT");
    });

    it("Debería permitir a un usuario crear una carta", async function () {
        const tokenURI = "ipfs://example-token-uri";

        await tradeck.connect(seller).mintCard(tokenURI);

        expect(await tradeck.ownerOf(0)).to.equal(seller.address);
    });

    it("Debería ejecutar una compraventa completa y segura", async function () {
        const precio = ethers.parseEther("1.0"); // Simulamos que cuesta 1 ETH
    
        // 1. El vendedor crea la carta
        await tradeck.connect(seller).mintCard("ipfs://test");
        
        // 2. El vendedor la pone a la venta por 1 ETH
        await tradeck.connect(seller).listForSale(0, precio);

        // 3. El comprador se conecta y la compra (envía el dinero al contrato)
        await tradeck.connect(buyer).buyCard(0, { value: precio });

        // 4. El comprador recibe la carta y confirma para que el vendedor cobre
        await tradeck.connect(buyer).confirmDelivery(0);

        // Comprobación final: La carta ahora debe ser del comprador
        expect(await tradeck.ownerOf(0)).to.equal(buyer.address);
    });
});