import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("TraDeck Platform", function () {
  async function deployTraDeckFixture() {
    const TraDeckContract = await ethers.getContractFactory("TraDeck");
    const tradeck = await TraDeckContract.deploy();
    const [seller, buyer, outsider] = await ethers.getSigners();

    return { tradeck, seller, buyer, outsider };
  }

  it("Deberia crear (mint) una nueva carta y asignar el owner correctamente", async function () {
    const { tradeck, seller } = await deployTraDeckFixture();

    const tokenURI = "ipfs://QmTstEjemploCID123456";
    await tradeck.connect(seller).mintCard(tokenURI);

    expect(await tradeck.ownerOf(0)).to.equal(seller.address);
    expect(await tradeck.tokenURI(0)).to.equal(tokenURI);
  });

  it("Deberia completar el flujo mint -> list -> buy -> confirm", async function () {
    const { tradeck, seller, buyer } = await deployTraDeckFixture();
    const price = ethers.parseEther("1");

    await tradeck.connect(seller).mintCard("ipfs://QmFlujoCompleto");
    await tradeck.connect(seller).listForSale(0, price);
    await tradeck.connect(buyer).buyCard(0, { value: price });

    const contractAddress = await tradeck.getAddress();
    expect(await ethers.provider.getBalance(contractAddress)).to.equal(price);

    await tradeck.connect(buyer).confirmDelivery(0);

    expect(await tradeck.ownerOf(0)).to.equal(buyer.address);
    expect(await ethers.provider.getBalance(contractAddress)).to.equal(0n);

    const listing = await tradeck.listings(0);
    expect(listing.active).to.equal(false);

    const purchase = await tradeck.purchases(0);
    expect(purchase.active).to.equal(false);
  });

  it("No deberia permitir listar por un usuario no propietario", async function () {
    const { tradeck, seller, buyer } = await deployTraDeckFixture();
    await tradeck.connect(seller).mintCard("ipfs://QmNoOwner");

    await expect(
      tradeck.connect(buyer).listForSale(0, ethers.parseEther("1")),
    ).to.be.revertedWith("No eres el dueno");
  });

  it("No deberia permitir compra con monto incorrecto", async function () {
    const { tradeck, seller, buyer } = await deployTraDeckFixture();
    await tradeck.connect(seller).mintCard("ipfs://QmMontoIncorrecto");
    await tradeck.connect(seller).listForSale(0, ethers.parseEther("1"));

    await expect(
      tradeck.connect(buyer).buyCard(0, { value: ethers.parseEther("0.5") }),
    ).to.be.revertedWith("Monto invalido");
  });

  it("Solo el comprador deberia poder confirmar la entrega", async function () {
    const { tradeck, seller, buyer, outsider } = await deployTraDeckFixture();
    const price = ethers.parseEther("1");

    await tradeck.connect(seller).mintCard("ipfs://QmConfirmAuth");
    await tradeck.connect(seller).listForSale(0, price);
    await tradeck.connect(buyer).buyCard(0, { value: price });

    await expect(tradeck.connect(outsider).confirmDelivery(0)).to.be.revertedWith(
      "Solo el comprador confirma",
    );
  });

  it("El vendedor deberia poder cancelar el listado si no hay compra", async function () {
    const { tradeck, seller } = await deployTraDeckFixture();

    await tradeck.connect(seller).mintCard("ipfs://QmCancelListing");
    await tradeck.connect(seller).listForSale(0, ethers.parseEther("1"));
    await tradeck.connect(seller).cancelListing(0);

    const listing = await tradeck.listings(0);
    expect(listing.active).to.equal(false);
  });

  it("No deberia permitir cancelar listado si ya hay compra en curso", async function () {
    const { tradeck, seller, buyer } = await deployTraDeckFixture();
    const price = ethers.parseEther("1");

    await tradeck.connect(seller).mintCard("ipfs://QmCancelBlocked");
    await tradeck.connect(seller).listForSale(0, price);
    await tradeck.connect(buyer).buyCard(0, { value: price });

    await expect(tradeck.connect(seller).cancelListing(0)).to.be.revertedWith(
      "Compra en curso",
    );
  });

  it("El comprador deberia poder cancelar su compra y recuperar fondos", async function () {
    const { tradeck, seller, buyer } = await deployTraDeckFixture();
    const price = ethers.parseEther("1");

    await tradeck.connect(seller).mintCard("ipfs://QmCancelPurchase");
    await tradeck.connect(seller).listForSale(0, price);
    await tradeck.connect(buyer).buyCard(0, { value: price });

    const contractAddress = await tradeck.getAddress();
    expect(await ethers.provider.getBalance(contractAddress)).to.equal(price);

    await tradeck.connect(buyer).cancelPurchase(0);

    const purchase = await tradeck.purchases(0);
    expect(purchase.active).to.equal(false);
    expect(await ethers.provider.getBalance(contractAddress)).to.equal(0n);
  });
});