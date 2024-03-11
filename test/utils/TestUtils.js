const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

async function calculateTotalGasCost(transactions) {
  const gasCosts = await Promise.all(
    transactions.map(async (tx) => {
      const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
      return receipt.fee;
    })
  );
  return gasCosts.reduce((total, cost) => total + cost, BigInt(0));
}

module.exports = {
  calculateTotalGasCost,
  tokens,
};
