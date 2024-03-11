const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { tokens } = require("../utils/TestUtils");

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
  const lendingNeeded = tokens(5);

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
    lendingNeeded,
    randomAcc,
  };
}

describe("Escrow finalizeSale", function () {
  it("GIVEN inspection was not passed WHEN finalizing the sale THEN tx is reverted", async () => {
    // Given
    const { escrow, buyer, seller, lender, inspector } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = escrow.connect(seller).finalizeSale(1);

    // Then
    expect(tx).to.be.reverted;
  });

  it("GIVEN buyer didnt deposit the earnest WHEN finalizing the sale THEN tx is reverted", async () => {
    // Given
    const { escrow, buyer, seller, lender, inspector } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = escrow.connect(seller).finalizeSale(1);

    // Then
    expect(tx).to.be.reverted;
  });

  it("GIVEN buyer didnt approve the sale WHEN finalizing the sale THEN tx is reverted", async () => {
    // Given
    const { escrow, buyer, seller, lender, inspector } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = escrow.connect(seller).finalizeSale(1);

    // Then
    expect(tx).to.be.reverted;
  });

  it("GIVEN seller didnt approve the sale WHEN finalizing the sale THEN tx is reverted", async () => {
    // Given
    const { escrow, buyer, seller, lender, inspector } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = escrow.connect(seller).finalizeSale(1);

    // Then
    expect(tx).to.be.reverted;
  });

  it("GIVEN lender didnt approve the sale WHEN finalizing the sale THEN tx is reverted", async () => {
    // Given
    const { escrow, buyer, seller, lender, inspector } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(buyer).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = escrow.connect(seller).finalizeSale(1);

    // Then
    expect(tx).to.be.reverted;
  });

  it("GIVEN all conditions are met WHEN a not allwed user finalizes the sale THEN tx reverts", async () => {
    // Given
    const { realEstate, escrow, buyer, seller, lender, inspector, randomAcc } =
      await loadFixture(deployEscrowWithAListedRealEstate);
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = escrow.connect(randomAcc).finalizeSale(1);

    // Then
    expect(tx).to.be.reverted;
  });

  it("GIVEN all conditions are met WHEN seller finalizes the sale THEN balances update according AND ownsership updates AND Real State is not listed anymore", async () => {
    // Given
    const { realEstate, escrow, buyer, seller, lender, inspector } =
      await loadFixture(deployEscrowWithAListedRealEstate);
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = await escrow.connect(seller).finalizeSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const newOwner = await realEstate.ownerOf(1);
    expect(newOwner).to.be.equal(buyer.address);

    const isListed = await escrow.isListed(1);
    expect(isListed).to.be.equal(false);
  });

  it("GIVEN all conditions are met WHEN buyer finalizes the sale THEN balances update according AND ownsership updates AND Real State is not listed anymore", async () => {
    // Given
    const { realEstate, escrow, buyer, seller, lender, inspector } =
      await loadFixture(deployEscrowWithAListedRealEstate);
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = await escrow.connect(buyer).finalizeSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const newOwner = await realEstate.ownerOf(1);
    expect(newOwner).to.be.equal(buyer.address);

    const isListed = await escrow.isListed(1);
    expect(isListed).to.be.equal(false);
  });

  it("GIVEN all conditions are met WHEN lender finalizes the sale THEN balances update according AND ownsership updates AND Real State is not listed anymore", async () => {
    // Given
    const { realEstate, escrow, buyer, seller, lender, inspector } =
      await loadFixture(deployEscrowWithAListedRealEstate);
    await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

    // When
    const tx = await escrow.connect(lender).finalizeSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const newOwner = await realEstate.ownerOf(1);
    expect(newOwner).to.be.equal(buyer.address);

    const isListed = await escrow.isListed(1);
    expect(isListed).to.be.equal(false);
  });
});
