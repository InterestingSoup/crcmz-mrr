# 💸 MRR Tracker – Stripe + Supabase + Discord

Automatically track your Monthly Recurring Revenue (MRR) from Stripe subscriptions, store them in Supabase, and send real-time updates to a Discord channel. Deployed with ❤️ using Coolify.

---

## 🔧 Features

- ✅ Listens to Stripe webhooks for subscription events
- ✅ Tracks **net MRR** (after Stripe fees)
- ✅ Stores active subscriptions in **Supabase**
- ✅ Sends real-time updates to a **Discord channel**
- ✅ Shows **Active VIP count**
- ✅ Includes a manual sync script to backfill existing Stripe subs

---

## 📁 Project Structure

```bash
.
├── index.js                  # Main Express server handling Stripe webhooks
├── sync_subscriptions.js     # One-time script to sync existing Stripe subscriptions
├── .env.example              # Example environment variables
├── package.json              # Project metadata and scripts
```

---

## 🚀 Deployment

### 1. Clone the repo & install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file using the `.env.example` as a guide:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_or_sk_live_key
STRIPE_WEBHOOK_SECRET=whsec_...
DISCORD_REVENUE_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

---

### 3. Supabase Table

Run this SQL in your Supabase project:

```sql
create table subscriptions (
  id text primary key,
  amount numeric
);
```

---

### 4. Deploy to Coolify

Use **Nixpacks** (recommended) or your Docker setup.

Environment variables must be configured in Coolify for proper operation.

---

### 5. Add Stripe Webhook

In your [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks):

- **URL**: `https://your-domain.com/stripe-webhook`
- **Events to subscribe**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

---

## 🧪 Manual Sync (One-Time)

If you already have live subscriptions in Stripe and want to backfill them:

```bash
npm run sync
```

This:
- Fetches all active Stripe subscriptions
- Inserts them into Supabase
- Recalculates MRR
- Posts a synced summary to Discord

---

## 📦 Discord Output

Sample message when a new VIP subscribes:

```
✨ A new VIP joined!
📈 MRR: $42.80/month (after Stripe fees)
👥 Active VIPs: 3
```

Other supported messages:
- 🔁 A VIP changed their plan
- ❌ A VIP canceled their subscription

---

## ✅ Future Improvements

- Add `/mrr` bot command in Discord
- Daily/weekly MRR summaries using GitHub Actions or cron
- Add refund tracking or churn rates

---
