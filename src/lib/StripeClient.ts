import { addDays, differenceInDays } from "date-fns";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

const MAX_DAYS_PER_REQUEST = parseInt(process.env.MAX_DAYS_PER_REQUEST ?? "30");

type PaymentIntent = Stripe.PaymentIntent & {
  latest_charge: Stripe.Charge & {
    balance_transaction: Stripe.BalanceTransaction;
  };
  invoice: Stripe.Invoice;
};

export async function getPaymentsByDateRange(
  dateStart: Date,
  dateEnd: Date
): Promise<PaymentIntent[]> {
  const totalDays = differenceInDays(dateEnd, dateStart);

  // Split the request into multiple requests
  if (totalDays > MAX_DAYS_PER_REQUEST) {
    const requests: Promise<Stripe.ApiList<PaymentIntent>>[] = [];
    for (let i = 0; i < totalDays; i += MAX_DAYS_PER_REQUEST) {
      const start = addDays(dateStart, i);
      const end = addDays(dateStart, i + MAX_DAYS_PER_REQUEST);
      requests.push(
        stripe.paymentIntents.list({
          limit: 100,
          created: { gte: start.getTime() / 1000, lte: end.getTime() / 1000 },
          expand: ["data.latest_charge.balance_transaction", "data.invoice"],
        }) as Promise<Stripe.ApiList<PaymentIntent>>
      );
    }

    const payments = await Promise.all(requests);

    console.log(
      `[STRIPE] Found ${
        payments.flatMap((payment) => payment.data).length
      } payments`
    );
    return payments.flatMap((payment) => payment.data);
  }

  // If total range is less than MAX_DAYS_PER_REQUEST, we can make a single request
  const payments = await stripe.paymentIntents.list({
    limit: 100,
    created: { gte: dateStart.getTime() / 1000, lte: dateEnd.getTime() / 1000 },
    expand: ["data.latest_charge.balance_transaction", "data.invoice"],
  });

  console.log(`[STRIPE] Found ${payments.data.length} payments`);

  return payments.data as PaymentIntent[];
}
