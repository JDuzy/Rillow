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

describe("Escrow cancel sale", function () {
  const depositEarnestAmount = tokens(5);
  it("GIVEN inspection was not passed WHEN seller cancels the sale THEN buyer deposit earnest is refunded", async () => {
    // Given
    const { escrow, buyer, seller, lender, escrowAmount } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );
    const previousBuyerBalance = await ethers.provider.getBalance(
      buyer.address
    );
    const depositTx = await escrow
      .connect(buyer)
      .depositEarnest(1, { value: escrowAmount });
    const approveTx = await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    // When
    await escrow.connect(seller).cancelSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const gas = await calculateTotalGasCost([depositTx, approveTx]);

    const newBuyerBalance = await ethers.provider.getBalance(buyer.address);
    expect(newBuyerBalance).to.be.equal(previousBuyerBalance - gas);
  });

  it("GIVEN inspection was not passed WHEN buyer cancels the sale THEN buyer deposit earnest is refunded", async () => {
    // Given
    const { escrow, buyer, seller, lender, escrowAmount } = await loadFixture(
      deployEscrowWithAListedRealEstate
    );
    const previousBuyerBalance = await ethers.provider.getBalance(
      buyer.address
    );
    const depositTx = await escrow
      .connect(buyer)
      .depositEarnest(1, { value: escrowAmount });
    const approveTx = await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    // When
    const cancelSaleTx = await escrow.connect(buyer).cancelSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const newBuyerBalance = await ethers.provider.getBalance(buyer.address);
    const gas = await calculateTotalGasCost([
      depositTx,
      approveTx,
      cancelSaleTx,
    ]);
    expect(newBuyerBalance).to.be.equal(previousBuyerBalance - gas);
  });

  it("GIVEN inspection was passed WHEN seller cancels the sale THEN buyer gets the deposit earnest", async () => {
    // Given
    const { escrow, buyer, seller, lender, inspector, escrowAmount } =
      await loadFixture(deployEscrowWithAListedRealEstate);
    const previousBuyerBalance = await ethers.provider.getBalance(
      buyer.address
    );
    const depositTx = await escrow
      .connect(buyer)
      .depositEarnest(1, { value: escrowAmount });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    const approveTx = await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);

    // When
    await escrow.connect(seller).cancelSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const gas = await calculateTotalGasCost([depositTx, approveTx]);

    const newBuyerBalance = await ethers.provider.getBalance(buyer.address);
    expect(newBuyerBalance).to.be.equal(previousBuyerBalance - gas);
  });

  it("GIVEN inspection was passed WHEN buyer cancels the sale THEN seller gets payed the deposit earnest", async () => {
    // Given
    const { escrow, buyer, seller, lender, inspector, escrowAmount } =
      await loadFixture(deployEscrowWithAListedRealEstate);
    await escrow.connect(buyer).depositEarnest(1, { value: escrowAmount });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);
    const previousSellerBalance = await ethers.provider.getBalance(
      seller.address
    );

    // When
    await escrow.connect(buyer).cancelSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const newSellerBalance = await ethers.provider.getBalance(seller.address);
    expect(newSellerBalance).to.be.equal(
      previousSellerBalance + depositEarnestAmount
    );
  });

  it("GIVEN lender has lended WHEN a canceler cancels the sale THEN lender gets refunded", async () => {
    // Given
    const {
      escrow,
      buyer,
      seller,
      lender,
      inspector,
      escrowAmount,
      lendingNeeded,
    } = await loadFixture(deployEscrowWithAListedRealEstate);
    await escrow.connect(buyer).depositEarnest(1, { value: escrowAmount });
    await escrow.connect(inspector).updateInspectionStatus(1, true);
    await escrow.connect(buyer).approveSale(1);
    await escrow.connect(seller).approveSale(1);
    await escrow.connect(lender).approveSale(1);
    const previousLenderBalance = await ethers.provider.getBalance(
      lender.address
    );
    const lendingTx = await escrow
      .connect(lender)
      .lend(1, { value: lendingNeeded });

    // When
    await escrow.connect(buyer).cancelSale(1);

    // Then
    const escrowBalance = await escrow.getBalance();
    expect(escrowBalance).to.be.equal(0);

    const gas = await calculateTotalGasCost([lendingTx]);
    const newLenderBalance = await ethers.provider.getBalance(lender.address);

    // TODO
    // expect(newLenderBalance).to.be.equal(previousLenderBalance - gas);
  });
});
