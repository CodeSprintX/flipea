import Stripe from 'stripe';
import prisma from '../configs/prisma.js';
import { inngest } from '../inngest/index.js';

export const stripeWebhook = async (request, response) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  if (endpointSecret) {
    // Get the signature sent by Stripe
    const signature = request.headers['stripe-signature'];
    try {
      event = stripeInstance.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret
      );
    } catch (err) {
      console.log(`⚠️ Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const sessionList = await stripeInstance.checkout.sessions.list({
            payment_intent: paymentIntent.id
          });
          const session = sessionList.data[0];
          if (!session) {
            console.error('No checkout session found for payment intent:', paymentIntent.id);
            break;
          }
          const { transactionId, appId } = session.metadata || {};
          if (appId === 'flipearn' && transactionId) {
            // Fetch transaction first to ensure it exists and get full data
            const transaction = await prisma.transaction.findUnique({
              where: { transactionId }
            });
            if (!transaction) {
              console.error('Transaction not found:', transactionId);
              break;
            }

            await prisma.transaction.update({
              where: { transactionId },
              data: { isPaid: true }
            });

            // Send credential to the buyer
            await inngest.send({
              name: "app/purchase",
              data: { transaction }
            });

            // Mark the listing as sold
            await prisma.listing.update({
              where: { id: transaction.listingId },
              data: { status: "sold" }
            });

            // Credit the seller's earnings (assuming transaction has ownerId for seller)
            await prisma.user.update({
              where: { id: transaction.ownerId },
              data: { earned: { increment: transaction.amount } }
            });
          }
          break;
        case 'payment_method.attached':
          const paymentMethod = event.data.object;
          // Handle payment method attached if needed
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Return a response to acknowledge receipt of the event
      response.json({ received: true });
    } catch (error) {
      console.error("Webhook processing error", error);
      response.status(500).send("Internal Server error");
    }
  } else {
    // If no endpoint secret, skip verification but still ack (for local dev; not recommended in prod)
    console.warn("No Stripe webhook secret provided; skipping verification");
    response.json({ received: true });
  }
};