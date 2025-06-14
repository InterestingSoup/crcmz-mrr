require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createClient } = require("@supabase/supabase-js");

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

syncActiveSubscriptions();

