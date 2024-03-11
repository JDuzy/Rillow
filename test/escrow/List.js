const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { calculateTotalGasCost, tokens } = require("../utils/TestUtils");

async function deployRealEstateWithEscrow() {
  const [buyer, seller, inspector, lender] = await ethers.getSigners();
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();

  await realEstate
    .connect(seller)
    .mint(
      "https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png"
    );

  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.target,
    seller.address,
    inspector.address,
    lender.address
  );

  return { realEstate, escrow, buyer, seller, inspector, lender };
}

describe("Escrow listing", function () {
  const price = tokens(10);
  const escrowAmount = tokens(5);
  it("WHEN nft is listed without approval THEN NFT ownership doesnt change AND tx reverts", async () => {
    // Given
    const { realEstate, seller, escrow, buyer } = await loadFixture(
      deployRealEstateWithEscrow
    );

    // When
    const listTransaction = escrow.list(1, buyer, price, escrowAmount);

    // Then
    await expect(listTransaction).to.be.reverted;
    const ownerAddress = await realEstate.ownerOf(1);
    expect(ownerAddress).to.be.equal(seller.address);
  });

  it("WHEN nft is listed not by the owner THEN NFT ownership doesnt change AND tx reverts", async () => {
    // Given
    const { realEstate, escrow, seller, buyer } = await loadFixture(
      deployRealEstateWithEscrow
    );
    await realEstate.connect(seller).approve(escrow.target, 1);

    // When
    const listTransaction = escrow
      .connect(buyer)
      .list(1, buyer, price, escrowAmount);

    // Then
    await expect(listTransaction).to.be.reverted;
    const ownerAddress = await realEstate.ownerOf(1);
    expect(ownerAddress).to.be.equal(seller.address);
  });

  it("WHEN nft is listed with approval THEN NFT ownership change to escrow address", async () => {
    // Given
    const { realEstate, escrow, seller, buyer } = await loadFixture(
      deployRealEstateWithEscrow
    );
    await realEstate.connect(seller).approve(escrow.target, 1);

    // When
    await escrow.connect(seller).list(1, buyer, price, escrowAmount);

    // Then
    const ownerAddress = await realEstate.ownerOf(1);
    expect(ownerAddress).to.be.equal(escrow.target);
  });

  it("WHEN nft is listed with approval THEN NFT state isListed", async () => {
    // Given
    const { realEstate, escrow, seller, buyer } = await loadFixture(
      deployRealEstateWithEscrow
    );
    await realEstate.connect(seller).approve(escrow.target, 1);

    // When
    await escrow.connect(seller).list(1, buyer, price, escrowAmount);

    // Then
    const isListed = await escrow.isListed(1);
    expect(isListed).to.be.equal(true);
  });

  it("WHEN nft is listed with approval THEN NFT has a purchase price", async () => {
    // Given
    const { realEstate, escrow, seller, buyer } = await loadFixture(
      deployRealEstateWithEscrow
    );
    await realEstate.connect(seller).approve(escrow.target, 1);

    // When
    await escrow.connect(seller).list(1, buyer, price, escrowAmount);

    // Then
    const actualPrice = await escrow.purcharsePrice(1);
    expect(actualPrice).to.be.equal(price);
  });

  it("WHEN nft is listed with approval THEN NFT has a buyer", async () => {
    // Given
    const { realEstate, escrow, seller, buyer } = await loadFixture(
      deployRealEstateWithEscrow
    );
    await realEstate.connect(seller).approve(escrow.target, 1);

    // When
    await escrow.connect(seller).list(1, buyer, price, escrowAmount);

    // Then
    const actualBuyer = await escrow.buyer(1);
    expect(actualBuyer).to.be.equal(buyer);
  });

  it("WHEN nft is listed with approval THEN NFT has a escrow amount", async () => {
    // Given
    const { realEstate, escrow, seller, buyer } = await loadFixture(
      deployRealEstateWithEscrow
    );
    await realEstate.connect(seller).approve(escrow.target, 1);

    // When
    await escrow.connect(seller).list(1, buyer, price, escrowAmount);

    // Then
    const actualAmount = await escrow.escrowAmount(1);
    expect(escrowAmount).to.be.equal(actualAmount);
  });
});
