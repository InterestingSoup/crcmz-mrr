require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncActiveSubscriptions() {
  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100,
  });

  for (const sub of subscriptions.data) {
    const id = sub.id;
    const amount = sub.items.data[0].price.unit_amount / 100;

    const { error } = await supabase
      .from("subscriptions")
      .upsert({ id, amount });

    if (error) {
      console.error(`❌ Failed to sync ${id}:`, error.message);
    } else {
      console.log(`✅ Synced ${id}: $${amount}`);
    }
  }

  console.log("🎉 Finished syncing active subscriptions.");
}

async function postMRR() {
  const { data, error } = await supabase.from("subscriptions").select("amount");
  if (error) {
    console.error("❌ Error fetching subscriptions:", error.message);
    return;
  }

  const STRIPE_FEE_PERCENT = 0.029;
  const STRIPE_FLAT_FEE = 0.30;

  const mrr = data.reduce((sum, sub) => {
    const net = sub.amount - (sub.amount * STRIPE_FEE_PERCENT + STRIPE_FLAT_FEE);
    return sum + net;
  }, 0).toFixed(2);

  await axios.post(process.env.DISCORD_REVENUE_WEBHOOK_URL, {
    content: `📈 **Monthly Recurring Revenue** synced: **$${mrr}/month** (after Stripe fees)`
  });

  console.log("📤 MRR posted to Discord.");
}

// Run sync and then post MRR
syncActiveSubscriptions().then(postMRR);

