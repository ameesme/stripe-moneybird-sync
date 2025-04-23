import dotenv from "dotenv";
import { parseCliArgs } from "./lib/cli";
import { getPaymentsByDateRange } from "./lib/StripeClient";
import {
  createExternalSalesInvoiceBatch,
  createPaymentBatch,
} from "./lib/MoneyBirdClient";

dotenv.config();

if (!process.env.MONEYBIRD_CONTACT_ID) {
  throw new Error("MONEYBIRD_CONTACT_ID is not set");
}

if (!process.env.FALLBACK_LINE_ITEM_DESCRIPTION) {
  throw new Error("FALLBACK_LINE_ITEM_DESCRIPTION is not set");
}

if (!process.env.MONEYBIRD_FINANCIAL_ACCOUNT_ID) {
  throw new Error("MONEYBIRD_FINANCIAL_ACCOUNT_ID is not set");
}

async function main() {
  try {
    const { dateStart, dateEnd, dryRun, justOne } = parseCliArgs();
    console.log(
      `[MAIN] Processing transactions from ${dateStart.toISOString()} to ${dateEnd.toISOString()}`
    );
    if (!dryRun) {
      console.warn(
        "[MAIN] Running in production mode, will proceed with creating invoices in five seconds..."
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const payments = await getPaymentsByDateRange(dateStart, dateEnd);

    if (payments.length === 0) {
      console.log("[MAIN] No transactions found in the specified date range");
      return;
    }

    if (justOne) {
      console.log(
        "[MAIN] Just one flag is set, will process only the first transaction"
      );
      payments.length = 1; // Keep only the first payment
    }

    const invoiceRecords = payments.map((payment) => {
      const lineItems = payment.invoice?.lines.data.map((line) => {
        return {
          description:
            line.description ||
            process.env.FALLBACK_LINE_ITEM_DESCRIPTION ||
            "Unknown line item",
          price: line.amount / 100,
          ledger_account_id: process.env.MONEYBIRD_LEDGER_ACCOUNT_ID,
        };
      }) ?? [
        {
          description: process.env.FALLBACK_LINE_ITEM_DESCRIPTION,
          price: payment.amount / 100,
          ledger_account_id: process.env.MONEYBIRD_LEDGER_ACCOUNT_ID,
        },
      ];

      return {
        reference: payment.id,
        contact_id: process.env.MONEYBIRD_CONTACT_ID as string,
        details_attributes: lineItems,
        prices_are_incl_tax: true,
        date: new Date(payment.created * 1000).toISOString(),
      };
    });

    const invoices = await createExternalSalesInvoiceBatch(
      invoiceRecords,
      dryRun
    );

    const paymentRecords = invoices.map((invoice) => {
      const paymentRecord = payments.find(
        (payment) => payment.id === invoice.reference
      );

      if (!paymentRecord) {
        throw new Error(`Payment record not found for invoice ${invoice.id}`);
      }

      return {
        payment_date: invoice.date,
        price: invoice.total_unpaid,
        invoice_id: invoice.id,
        financial_account_id: process.env
          .MONEYBIRD_FINANCIAL_ACCOUNT_ID as string,
      };
    });

    await createPaymentBatch(paymentRecords, dryRun);

    console.log("[MAIN] Done!");
  } catch (error) {
    console.error(
      "[MAIN] Error:",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
    console.error(error);
    process.exit(1);
  }
}

main();
