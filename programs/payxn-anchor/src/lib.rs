use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Token, TokenAccount, Transfer},
};

declare_id!("HdoynEbNDtUF5Jsp9EQXSim9zKyEkSAU5nCuYNHrZoxP");

#[program]
pub mod payxn_anchor {
    use super::*;

    pub fn process_payment(ctx: Context<ProcessPayment>, amount: u64, fee_percentage: u64) -> Result<()> {
        let transaction_fee = amount.checked_mul(fee_percentage).unwrap_or(0) / 10000; // 0.1% fee
        let owner_amount = amount.checked_sub(transaction_fee).unwrap_or(0);

        // Process admin fee
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.customer_usdc.to_account_info(),
                    to: ctx.accounts.admin_usdc.to_account_info(),
                    authority: ctx.accounts.customer.to_account_info(),
                },
            ),
            transaction_fee,
        )?;

        // Process remaining amount to business owner
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.customer_usdc.to_account_info(),
                    to: ctx.accounts.business_owner_usdc.to_account_info(),
                    authority: ctx.accounts.customer.to_account_info(),
                },
            ),
            owner_amount,
        )?;

        msg!("Payment processed successfully: Fee = {}, Amount to Owner = {}", transaction_fee, owner_amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(mut)]
    pub customer: Signer<'info>,
    #[account(mut)]
    pub customer_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub business_owner_usdc: Account<'info, TokenAccount>,
    #[account(mut)]
    pub admin_usdc: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
