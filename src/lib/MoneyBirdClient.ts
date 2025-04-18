import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const API_KEY = process.env.MONEYBIRD_API_KEY;
const BASE_URL = "https://moneybird.com/api/v2";
const ADMINISTRATION_ID = process.env.MONEYBIRD_ADMINISTRATION_ID;

type ExternalSalesInvoice = {
  reference: string;
  contact_id: string;
  prices_are_incl_tax: boolean;
  details_attributes: {
    description: string;
    price: number;
  }[];
};

export async function createExternalSalesInvoice(
  invoice: ExternalSalesInvoice,
  dryRun: boolean = false
) {
  if (dryRun) {
    console.log(
      "[MONEYBIRD] [DRY RUN] Would create external sales invoice:",
      JSON.stringify(invoice, null, 2)
    );
    return { id: "dry-run-id", ...invoice };
  }

  const response = await axios.post(
    `${BASE_URL}/${ADMINISTRATION_ID}/external_sales_invoices`,
    {
      external_sales_invoice: invoice,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  console.log(
    "[MONEYBIRD] Created external sales invoice with id",
    response.data.id
  );

  return response.data;
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

  const results = await Promise.all(
    invoices.map((invoice) => createExternalSalesInvoice(invoice, dryRun))
  );

  console.log(
    "[MONEYBIRD] Created batch of external sales invoices:",
    results.length
  );
  return results;
}

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

type Payment = {
  payment_date: string;
  price: number;
  invoice_id: string;
  financial_account_id: string;
};

export async function createPayment(payment: Payment, dryRun: boolean = false) {
  if (dryRun) {
    console.log("[MONEYBIRD] [DRY RUN] Would create payment:", payment);
    return { id: "dry-run-id", ...payment };
  }

  const response = await axios.post(
    `${BASE_URL}/${ADMINISTRATION_ID}/external_sales_invoices/${payment.invoice_id}/payments`,
    { payment },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  console.log(
    "[MONEYBIRD] Created payment:",
    JSON.stringify(response.data, null, 2)
  );

  return response.data;
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

  const results = await Promise.all(
    payments.map((payment) => createPayment(payment, dryRun))
  );

  console.log("[MONEYBIRD] Created batch of payments:", results.length);
  return results;
}

export async function createFinancialStatement(
  financialStatement: FinancialStatement,
  dryRun: boolean = false
) {
  if (dryRun) {
    console.log(
      "[MONEYBIRD] [DRY RUN] Would create financial statement:",
      JSON.stringify(financialStatement, null, 2)
    );
    return { id: "dry-run-id", ...financialStatement };
  }

  const response = await axios.post(
    `${BASE_URL}/${ADMINISTRATION_ID}/financial_statements`,
    financialStatement,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  console.log(
    "[MONEYBIRD] Created financial statement:",
    JSON.stringify(response.data, null, 2)
  );

  return response.data;
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
