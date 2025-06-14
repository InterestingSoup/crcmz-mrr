const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");
const getRawBody = require("raw-body");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/stripe-webhook", async (req, res) => {
  const buf = await getRawBody(req);
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const subscription = event.data.object;
  const subId = subscription.id;
  const amount = subscription.items?.data[0]?.price?.unit_amount / 100;

  if (!amount) return res.status(400).send("Invalid amount");

  if (["customer.subscription.created", "customer.subscription.updated"].includes(event.type)) {
    if (subscription.status === "active") {
      await supabase
        .from("subscriptions")
        .upsert({ id: subId, amount }, { onConflict: ["id"] });
    }
  } else if (event.type === "customer.subscription.deleted") {
    await supabase
      .from("subscriptions")
      .delete()
      .eq("id", subId);
  }

  const { data, error } = await supabase.from("subscriptions").select("amount");
  const STRIPE_FEE_PERCENT = 0.029;
  const STRIPE_FLAT_FEE = 0.30;

  const mrr = data.reduce((sum, sub) => {
    const net = sub.amount - (sub.amount * STRIPE_FEE_PERCENT + STRIPE_FLAT_FEE);
    return sum + net;
  }, 0).toFixed(2);

  await axios.post(process.env.DISCORD_REVENUE_WEBHOOK_URL, {
    content: `📈 **Monthly Recurring Revenue** updated: **$${mrr}/month** (after Stripe fees)`
  });

  res.json({ received: true });
});

app.listen(port, () => console.log(`✅ Server listening on port ${port}`));
