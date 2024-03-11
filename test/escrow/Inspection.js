const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { calculateTotalGasCost, tokens } = require("../utils/TestUtils");

async function deployEscrowWithAListedRealEstate() {
  const [buyer, seller, inspector, lender, randomAcc] =
    await ethers.getSigners();
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

  const price = tokens(10);
  const escrowAmount = tokens(5);

  await realEstate.connect(seller).approve(escrow.target, 1);
  await escrow.connect(seller).list(1, buyer, price, escrowAmount);

  return {
    realEstate,
    escrow,
    buyer,
    seller,
    inspector,
    lender,
    price,
    escrowAmount,
    randomAcc,
  };
}

describe("Escrow inspection", function () {
  it("WHEN Inspector approves the inspection Then Real State inspection passed is true", async () => {
    // Given
    const { realEstate, escrow, buyer, seller, inspector } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );

    // When
    await escrow.connect(inspector).updateInspectionStatus(1, true);

    // Then
    const result = await escrow.inspectionPassed(1);
    expect(result).to.be.equal(true);
  });

  it("WHEN inspector disapprove the inspection THEN Real State inspection is not passed", async () => {
    // Given
    const { realEstate, escrow, buyer, seller, inspector } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );

    // When
    await escrow.connect(inspector).updateInspectionStatus(1, false);

    // Then
    const result = await escrow.inspectionPassed(1);
    expect(result).to.be.equal(false);
  });
});
