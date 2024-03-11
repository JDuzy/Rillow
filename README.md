# Real Estate escrow smart contract
This project implements a smart contract for handling real estate transactions using an escrow mechanism. The contract is designed to facilitate secure and transparent transactions between buyers and sellers of real estate assets.

### Features
- Escrow Mechanism: Securely holds deposit earnest and the lending during the real estate transaction process, providing trust between buyers and sellers.
- Listing the Real Estate
- Inspector approval/disapproval of the Real Estate
- Canceling the operation
- Ownership transfer of the ERC721: The smart contract holds the Real Estate ownership during the process and then is accordingly transferred when sale is finished or cancel


## Project Overview
### Roles:

- Seller: The party initiating the sale.
- Buyer: The party purchasing the real estate.
- Inspector: The entity responsible for inspecting the real estate.
- Lender: The entity providing funds for the transaction.

## Running Tests and Deployment

To run the test suite, execute the following command:

```bash
npx hardhat test
```

Run a local node:
```bash
npx hardhat node
```

Deploy smart contract to the local node:
```bash
npx hardhat run scripts/deploy.js --network localhost
```
