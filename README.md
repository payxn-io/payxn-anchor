# Payxn Anchor

Payxn Anchor is a Solana program built using the Anchor framework (version 0.30.1) that facilitates USDC payments between customers and business owners while deducting an admin fee.

## Overview

This program allows customers to make USDC payments to business owners. During the transaction, a small admin fee is deducted and sent to an admin account.

## Prerequisites

- Rust 1.70.0 or later
- Solana CLI 1.16.0 or later
- Anchor CLI 0.30.1
- Node.js 14.0.0 or later
- Yarn 1.22.0 or later

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/payxn-anchor.git
   cd payxn-anchor
   ```

2. Install dependencies:
   ```
   yarn install OR npm install
   ```

3. Build the program:
   ```
   anchor build
   ```

## Program Structure

The program consists of two main parts:

1. Rust program (`programs/payxn-anchor/src/lib.rs`): This contains the core logic for processing payments.
2. TypeScript tests (`tests/payxn-anchor.ts`): These tests verify the program's functionality.

### Rust Program

The main function in the Rust program is `process_payment`, which:

1. Calculates the admin fee based on the payment amount and fee percentage params.
2. Transfers the fee to the admin account.
3. Transfers the remaining amount to the business owner's account.

### Account Structure

The `ProcessPayment` struct defines the accounts required for the payment transaction:

- `customer`: The account initiating the payment (signer).
- `customer_usdc`: The customer's USDC token account.
- `business_owner_usdc`: The business owner's USDC token account.
- `admin_usdc`: The admin's USDC token account for receiving fees.
- `token_program`: The SPL Token program.

## Usage

To use this program:

1. Deploy the program to a Solana cluster (devnet, testnet, or mainnet).
2. Initialize the necessary token accounts (customer, business owner, and admin).
3. Call the `process_payment` instruction with the required accounts and parameters.

## Testing

The test file (`tests/payxn-anchor.ts`) sets up a simulated environment and tests the payment process. It:

1. Creates a USDC mint.
2. Sets up token accounts for the customer, business owner, and admin.
3. Mints USDC to the customer's account.
4. Executes the payment process.
5. Verifies the resulting balances.

To run the tests:

```
anchor test
```

