import dotenv from "dotenv";
import { ApiClient } from "./ApiClient";

dotenv.config();

const API_KEY = process.env.MONEYBIRD_API_KEY;
const BASE_URL = "https://moneybird.com/api/v2";
const ADMINISTRATION_ID = process.env.MONEYBIRD_ADMINISTRATION_ID;

const moneybirdClient = new ApiClient(BASE_URL, {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
});

type ExternalSalesInvoice = {
  reference: string;
  contact_id: string;
  prices_are_incl_tax: boolean;
  date: string;
  details_attributes: {
    description: string;
    price: number;
    ledger_account_id?: string;
  }[];
};

type ExternalSalesInvoiceResponse = ExternalSalesInvoice & {
  id: string;
  total_unpaid: number;
  date: string;
  prices_are_incl_tax: never;
  total_amount: never;
};

type Payment = {
  payment_date: string;
  price: number;
  invoice_id: string;
  financial_account_id: string;
};

type PaymentResponse = Payment & {
  id: string;
};

type FinancialStatement = {
  reference: string;
  financial_account_id: string;
  financial_mutations_attributes: {
    [key: string]: {
      date: string;
      message: string;
      amount: number;
    };
  };
};

type FinancialStatementResponse = FinancialStatement & {
  id: string;
};

export async function createExternalSalesInvoice(
  invoice: ExternalSalesInvoice,
  dryRun: boolean = false
): Promise<ExternalSalesInvoiceResponse> {
  if (dryRun) {
    console.log(
      "[MONEYBIRD] [DRY RUN] Would create external sales invoice:",
      JSON.stringify(invoice, null, 2)
    );
    return {
      id: "dry-run-id",
      total_unpaid: 0,
      reference: invoice.reference,
      contact_id: invoice.contact_id,
      prices_are_incl_tax: null as never,
      total_amount: null as never,
      details_attributes: invoice.details_attributes,
      date: new Date().toISOString(),
    };
  }

  const response = await moneybirdClient.post<ExternalSalesInvoiceResponse>(
    `/${ADMINISTRATION_ID}/external_sales_invoices`,
    {
      external_sales_invoice: invoice,
    }
  );

  console.log(
    "[MONEYBIRD] Created external sales invoice with id",
    response.id
  );

  return response;
}

export async function createExternalSalesInvoiceBatch(
  invoices: ExternalSalesInvoice[],
  dryRun: boolean = false
) {
  if (dryRun) {
    console.log(
      "[MONEYBIRD] [DRY RUN] Would create batch of external sales invoices:",
      invoices.length
    );
    const results = [];
    for (const invoice of invoices) {
      const result = await createExternalSalesInvoice(invoice, dryRun);
      results.push(result);
    }
    return results;
  }

  const results = [];
  for (const invoice of invoices) {
    const result = await createExternalSalesInvoice(invoice, dryRun);
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limit: 30 requests per minute = 1 request per 2 seconds
  }

  console.log(
    "[MONEYBIRD] Created batch of external sales invoices:",
    results.length
  );
  return results;
}

export async function createPayment(
  payment: Payment,
  dryRun: boolean = false
): Promise<PaymentResponse> {
  if (dryRun) {
    console.log("[MONEYBIRD] [DRY RUN] Would create payment:", payment);
    return { id: "dry-run-id", ...payment };
  }

  const response = await moneybirdClient.post<PaymentResponse>(
    `/${ADMINISTRATION_ID}/external_sales_invoices/${payment.invoice_id}/payments`,
    { payment }
  );

  console.log(
    "[MONEYBIRD] Created payment:",
    JSON.stringify(response, null, 2)
  );

  return response;
}

export async function createPaymentBatch(
  payments: Payment[],
  dryRun: boolean = false
) {
  if (dryRun) {
    console.log(
      "[MONEYBIRD] [DRY RUN] Would create batch of payments:",
      payments.length
    );
    const results = [];
    for (const payment of payments) {
      const result = await createPayment(payment, dryRun);
      results.push(result);
    }
    return results;
  }

  const results = [];
  for (const payment of payments) {
    const result = await createPayment(payment, dryRun);
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limit: 30 requests per minute = 1 request per 2 seconds
  }

  console.log("[MONEYBIRD] Created batch of payments:", results.length);
  return results;
}

export async function createFinancialStatement(
  financialStatement: FinancialStatement,
  dryRun: boolean = false
): Promise<FinancialStatementResponse> {
  if (dryRun) {
    console.log(
      "[MONEYBIRD] [DRY RUN] Would create financial statement:",
      JSON.stringify(financialStatement, null, 2)
    );
    return { id: "dry-run-id", ...financialStatement };
  }

  const response = await moneybirdClient.post<FinancialStatementResponse>(
    `/${ADMINISTRATION_ID}/financial_statements`,
    financialStatement
  );

  console.log(
    "[MONEYBIRD] Created financial statement:",
    JSON.stringify(response, null, 2)
  );

  return response;
}

export async function createFinancialStatementBatch(
  financialStatements: FinancialStatement[],
  dryRun: boolean = false
) {
  if (dryRun) {
    console.log(
      "[MONEYBIRD] [DRY RUN] Would create batch of financial statements:",
      financialStatements.length
    );
    const results = [];
    for (const statement of financialStatements) {
      const result = await createFinancialStatement(statement, dryRun);
      results.push(result);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limit: 30 requests per minute = 1 request per 2 seconds
    }
    return results;
  }

  const results = await Promise.all(
    financialStatements.map((statement) =>
      createFinancialStatement(statement, dryRun)
    )
  );

  console.log(
    "[MONEYBIRD] Created batch of financial statements:",
    results.length
  );

  return results;
}
