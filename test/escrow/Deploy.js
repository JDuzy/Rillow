const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

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

describe("Escrow deployment with a real state", function () {
  it("When getting nftAddress Then result is the RealEstate address", async () => {
    // Given
    const { realEstate, escrow } = await loadFixture(
      deployRealEstateWithEscrow
    );

    // When
    const result = await escrow.nftAddress();

    // Then
    expect(result).to.be.equal(realEstate.target);
  });

  it("When getting seller Then result is the seller address", async () => {
    // Given
    const { escrow, seller } = await loadFixture(deployRealEstateWithEscrow);

    // When
    const result = await escrow.seller();

    // Then
    expect(result).to.be.equal(seller.address);
  });

  it("When getting inspector Then result is the inspector address", async () => {
    // Given
    const { escrow, inspector } = await loadFixture(deployRealEstateWithEscrow);

    // When
    const result = await escrow.inspector();

    // Then
    expect(result).to.be.equal(inspector.address);
  });

  it("When getting lender Then result is the lender address", async () => {
    // Given
    const { escrow, lender } = await loadFixture(deployRealEstateWithEscrow);

    // When
    const result = await escrow.lender();

    // Then
    expect(result).to.be.equal(lender.address);
  });
});
