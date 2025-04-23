# Stripe MoneyBird Sync
Creates MoneyBird-invoices for individual Stripe-transactions. Used for Lomo.

> THIS IS NOT FINANCIAL ADVICE. NO SUPPORT GIVEN. YOU ARE ON YOUR OWN (with your bookkeeper).

## How to use
- Duplicate `.env.example` to `.env` and enter all required fields
- Run `yarn`
- Run `yarn start --date-start 01-01-2025 --date-end 31-03-2025`

**Additional flags**
- `--dry-run`: Run in test mode without creating any records in MoneyBird
- `--just-one`: Process only the first transaction found (useful for testing)

## Environment variables
| Variable | Description |
|----------|-------------|
| STRIPE_SECRET_KEY | Your Stripe API secret key for accessing payment data |
| MONEYBIRD_API_KEY | Your MoneyBird API key for creating invoices and payments |
| MONEYBIRD_ADMINISTRATION_ID | The ID of your MoneyBird administration |
| MONEYBIRD_CONTACT_ID | The ID of the contact in MoneyBird to associate with invoices |
| MONEYBIRD_FINANCIAL_ACCOUNT_ID | The ID of the financial account in MoneyBird for the invoice payment transactions |
| MONEYBIRD_LEDGER_ACCOUNT_ID | The ID of the category in MoneyBird for the invoice line-items (like "Revenue") |
| FALLBACK_LINE_ITEM_DESCRIPTION | Default description used when Stripe line items are missing or no invoice is created |
| MAX_DAYS_PER_REQUEST | Maximum number of days to include in a single API request (default: 30) |

## How it works
### 1. Fetch Stripe Payment Intents
Retrieve all Stripe Payment Intents within a specified date range.

### 2. Generate External Invoices in Moneybird
Create a new external invoice in Moneybird, using the Stripe payment intent ID as the invoice reference and setting the invoice date and amount to match the transaction.

If no invoice or line-items are defined in Stripe, the `FALLBACK_LINE_ITEM_DESCRIPTION` will be used.

### 3. Register Payment
Record a payment on the invoice for the total amount.

## Configuring MoneyBird
To make sure transactions are automatically booked the the correct categories, make sure the following booking-rules (boekingsregels) are set up. These might be different for your specific configuration, but this is what we use.

| Categorie                | Voorwaarde                                                                 |
|--------------------------|----------------------------------------------------------------------------|
| Stripe balanscategorie   | De transactie-omschrijving bevat *Stripe processing fees*                  |
| Stripe balanscategorie   | De transactie-omschrijving bevat *Stripe Fee*                              |
| Kruisposten              | De transactie-omschrijving bevat *STRIPE PAYOUT*                           |
| Kruisposten              | De transactie-omschrijving bevat *REFUND FOR PAYMENT*                      |
| Kruisposten              | De transactie tegenrekening is gelijk aan *NL41CITI2032304805*\*           |

\* This is the bank account has been using for payouts in our case. This is not fool-proof and again, might be different for your specific configuration.

You'll also need to create a single contact (for example called "External Stripe Contact") that the invoices will be attached to.

## Limitations

### Refunds
Refunds (and credit-invoices) are not processed, you'll need to process those manually.

### Currencies
The tool assumes a single currency to be used.

### Contacts
The tool uses a single "external contact" for all invoices. If you require specific details, look up the invoice in Stripe using the payment-intent ID mentioned in the invoice reference.