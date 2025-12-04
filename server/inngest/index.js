import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEMail from "../configs/nodeMailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "profile-marketplace" });

// INNGEST FUNCTION TO SAVE USER DATA TO A DATABASE
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { data } = event;

    // Check if user already exists in database
    const user = await prisma.user.findFirst({
      where: { id: data.id }
    });

    const firstName = data?.first_name || '';
    const lastName = data?.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown User';
    const email = data?.email_addresses?.[0]?.email_address;
    if (!email) {
      console.error('No email address provided for user:', data.id);
      return; // Or throw an error as needed
    }

    if (user) {
      // Update user data if exists
      await prisma.user.update({
        where: { id: data.id },
        data: {
          email,
          name: fullName,
          image: data?.image_url,
        }
      });
      return;
    }

    await prisma.user.create({
      data: {
        id: data.id,
        email,
        name: fullName,
        image: data?.image_url,
      }
    });
  },
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data } = event;

    const listings = await prisma.listing.findMany({
      where: { ownerId: data.id }
    });
    const chats = await prisma.chat.findMany({
      where: {
        OR: [{ ownerId: data.id }, { chatUserId: data.id }]
      }
    });
    const transactions = await prisma.transaction.findMany({
      where: { userId: data.id }
    });

    if (listings.length === 0 && chats.length === 0 && transactions.length === 0) {
      await prisma.user.delete({ where: { id: data.id } });
    } else {
      // Update listings to inactive
      await prisma.listing.updateMany({
        where: { ownerId: data.id },
        data: { status: "inactive" }
      });

      // Update chats to inactive (assuming a status field exists; adjust as needed)
      await prisma.chat.updateMany({
        where: {
          OR: [{ ownerId: data.id }, { chatUserId: data.id }]
        },
        data: { status: "inactive" }
      });

      // Update transactions to inactive (assuming a status field exists; adjust as needed)
      await prisma.transaction.updateMany({
        where: { userId: data.id },
        data: { status: "inactive" }
      });
    }
  },
);

// Inngest function to update user from database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { data } = event;

    const firstName = data?.first_name || '';
    const lastName = data?.last_name || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown User';
    const email = data?.email_addresses?.[0]?.email_address;
    if (!email) {
      console.error('No email address provided for user update:', data.id);
      return; // Or throw an error as needed
    }

    // Check if user exists before updating
    const user = await prisma.user.findFirst({ where: { id: data.id } });
    if (!user) {
      console.error('User not found for update:', data.id);
      return;
    }

    await prisma.user.update({
      where: { id: data.id },
      data: {
        email,
        name: fullName,
        image: data?.image_url,
      }
    });
  },
);

const sendPurchase = inngest.createFunction(
  { id: 'send-purchase-email' },
  { event: 'app/purchase' },
  async ({ event }) => {
    const { transaction } = event.data;

    const customer = await prisma.user.findFirst({
      where: {
        id: transaction.userId
      }
    });

    if (!customer) {
      console.error('Customer not found for transaction:', transaction.id);
      return;
    }

    const listing = await prisma.listing.findFirst({
      where: { id: transaction.listingId }
    });

    if (!listing) {
      console.error('Listing not found for transaction:', transaction.id);
      return;
    }

    const credential = await prisma.credential.findFirst({
      where: { listingId: transaction.listingId }
    });

    if (!credential?.updatedCredential) {
      console.error('Credentials not found for listing:', transaction.listingId);
      return;
    }

    await sendEMail({
      to: customer.email,
      subject: "Your Credentials for the account you purchased",
      html: `
        <h2>Thank you for purchasing account @${listing.username} of ${listing.platform} platform</h2>
        <p>Here are your credential for the listing you purchased.</p>
        <h3>New Credentials</h3>
        <div>
          ${credential.updatedCredential.map((cred) => `<p>${cred.name} : ${cred.value}</p>`).join('')}
        </div>
        <p>If you have any questions, please contact us at <a href="mailto:support@example.com">support@example.com</a></p>
      `
    });
  }
);

// Inngest function to send new credentials
const sendNewCredential = inngest.createFunction(
  { id: 'send-new-credentials' },
  { event: "app/listing-deleted" },
  async ({ event }) => {
    const { listing, listingId } = event.data;

    if (!listing?.owner?.email) {
      console.error('Owner email not available for listing:', listingId);
      return;
    }

    const newCredential = await prisma.credential.findFirst({
      where: { listingId }
    });

    if (!newCredential) {
      console.error('New credentials not found for listing:', listingId);
      return;
    }

    await sendEMail({
      to: listing.owner.email,
      subject: "New Credentials for your deleted listing",
      html: `
        <h2>Your new credentials for your deleted listing:</h2>
        <p>title: ${listing.title}</p>
        <p>username: ${listing.username}</p>
        <p>platform: ${listing.platform}</p>
        <h3>New Credentials</h3>
        <div>
          ${newCredential.updatedCredential.map((cred) => `<p>${cred.name} : ${cred.value}</p>`).join('')}
        </div>
        <h3>Old Credentials</h3>
        <div>
          ${newCredential.originalCredential.map((cred) => `<p>${cred.name} : ${cred.value}</p>`).join('')}
        </div>
        <p>If you have any questions, please contact us at <a href="mailto:support@example.com">support@example.com</a></p>
      `
    });
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, sendPurchase, sendNewCredential];