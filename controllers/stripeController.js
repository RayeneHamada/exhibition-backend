
const mongoose = require('mongoose'),
  User = mongoose.model('Users'),
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY),
  nodemailer = require('nodemailer'),
  fs = require('fs');
exports.webhook = async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.header('Stripe-Signature'),
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`);
    console.log(
      `⚠️  Check the env file and enter the correct webhook secret.`
    );
    return res.sendStatus(400);
  }

  // Extract the object from the event.
  const dataObject = event.data.object;

  // Handle the event
  // Review important events for Billing webhooks
  // https://stripe.com/docs/billing/webhooks
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log(dataObject);
      console.log("houni naawd process inscri wwala participation ema bel flous");
      if (dataObject['metadata']['appointmentId']) {
        let appointmentId = dataObject['metadata']['appointmentId'];
      }

      break;
    default:
  }
  res.sendStatus(200);

}

