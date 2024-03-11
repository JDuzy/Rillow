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

describe("Deposit", function () {
  it("WHEN buyer deposits earnest THEN contract balance is updated", async () => {
    // Given
    const { escrow, buyer } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );

    // When
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });

    // Then
    const result = await escrow.getBalance();
    expect(result).to.be.equal(tokens(5));
  });
});
