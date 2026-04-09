import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("TraDeck Platform", function () {
  it("Deberia crear (mint) una nueva carta y asignar el owner correctamente", async function () {
    // 1. Desplegar el contrato TraDeck en la red local de prueba
    const TraDeckContract = await ethers.getContractFactory("TraDeck");
    const tradeck = await TraDeckContract.deploy();

    // 2. Obtener la cuenta de prueba que está simulando la transacción
    const [owner] = await ethers.getSigners();

    // 3. Crear la carta simulando un enlace a IPFS (CID)
    const tokenURI = "ipfs://QmTstEjemploCID123456";
    await tradeck.mintCard(tokenURI);

    // 4. Comprobar que el dueño de la carta #0 es nuestra cuenta
    expect(await tradeck.ownerOf(0)).to.equal(owner.address);
    expect(await tradeck.tokenURI(0)).to.equal(tokenURI);
  });
});