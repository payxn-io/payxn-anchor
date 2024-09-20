import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PayxnAnchor } from "../target/types/payxn_anchor";
import { expect } from "chai";

describe("payxn-anchor", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PayxnAnchor as Program<PayxnAnchor>;

  const payer = anchor.web3.Keypair.generate();
  const mintAuthority = anchor.web3.Keypair.generate();
  const customer = anchor.web3.Keypair.generate();
  const businessOwner = anchor.web3.Keypair.generate();
  const admin = anchor.web3.Keypair.generate();

  let usdcMint: anchor.web3.PublicKey;
  let customerUsdcAccount: anchor.web3.PublicKey;
  let businessOwnerUsdcAccount: anchor.web3.PublicKey;
  let adminUsdcAccount: anchor.web3.PublicKey;

  it("Processes a USDC payment!", async () => {
    const paymentAmount = 1000000; // 1 USDC
    const feePercentage = 10; // 0.1% fee in basis points

    // Airdrop SOL to customer for gas
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 2000000000)
    );

    // Create USDC mint
    usdcMint = await createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      6
    );

    // Create associated token accounts
    const customerAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcMint,
      customer.publicKey
    );
    customerUsdcAccount = customerAccount.address;

    const businessOwnerAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcMint,
      businessOwner.publicKey
    );
    businessOwnerUsdcAccount = businessOwnerAccount.address;

    const adminAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      usdcMint,
      admin.publicKey
    );
    adminUsdcAccount = adminAccount.address;

    // Mint USDC to customer for payment
    await mintTo(
      provider.connection,
      payer,
      usdcMint,
      customerUsdcAccount,
      mintAuthority,
      paymentAmount
    );

    console.log("Customer USDC Account:", customerUsdcAccount.toBase58());
    console.log(
      "Business Owner USDC Account:",
      businessOwnerUsdcAccount.toBase58()
    );
    console.log("Admin USDC Account:", adminUsdcAccount.toBase58());

    // Process payment flow
    await program.methods
      .processPayment(
        new anchor.BN(paymentAmount),
        new anchor.BN(feePercentage)
      )
      .accounts({
        customer: customer.publicKey,
        customerUsdc: customerUsdcAccount,
        businessOwnerUsdc: businessOwnerUsdcAccount,
        adminUsdc: adminUsdcAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([customer])
      .rpc();

    // Verify balances (you may want to add assertions here)
    const customerBalance = await provider.connection.getTokenAccountBalance(
      customerUsdcAccount
    );
    const businessOwnerBalance =
      await provider.connection.getTokenAccountBalance(
        businessOwnerUsdcAccount
      );
    const adminBalance = await provider.connection.getTokenAccountBalance(
      adminUsdcAccount
    );

    console.log("Customer balance:", customerBalance.value.uiAmount);
    console.log("Business Owner balance:", businessOwnerBalance.value.uiAmount);
    console.log("Admin balance:", adminBalance.value.uiAmount);

    // Calculate expected amounts
    const expectedFee = (paymentAmount * feePercentage) / 10000; // 0.1% fee
    const expectedBusinessOwnerAmount = paymentAmount - expectedFee;

    // Add expect statements
    expect(customerBalance.value.uiAmount).to.equal(
      0,
      "Customer balance should be 0 after payment"
    );
    expect(businessOwnerBalance.value.uiAmount).to.equal(
      expectedBusinessOwnerAmount / 1000000,
      "Business owner should receive the payment minus the fee"
    );
    expect(adminBalance.value.uiAmount).to.equal(
      expectedFee / 1000000,
      "Admin should receive the correct fee"
    );

    // Additional checks
    expect(
      customerBalance.value.uiAmount +
        businessOwnerBalance.value.uiAmount +
        adminBalance.value.uiAmount
    ).to.equal(paymentAmount / 1000000, "Total USDC should be conserved");
  });
});
