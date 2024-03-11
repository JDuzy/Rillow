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

  return { realEstate: realEstate, escrow, buyer, seller, inspector, lender };
}

describe("Escrow approval", function () {
  it("WHEN All parties approve THEN approval status is OK", async () => {
    // Given
    const { escrow, buyer, seller, lender } = await loadFixture(
      deployRealEstateWithEscrow
    );

    // When
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    // Then
    expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
    expect(await escrow.approval(1, seller.address)).to.be.equal(true);
    expect(await escrow.approval(1, lender.address)).to.be.equal(true);
  });
});
