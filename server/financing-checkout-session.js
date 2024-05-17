require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const success_url = "https://www.vrarify.com/kickoff-call-alex";
const cancel_url = "https://vrarify.com/7-day-free-trial-financing";
const payment_options = ["us_bank_account"];

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const { trial_days, lookupkey } = requestBody;

    const prices = await stripe.prices.list({
        lookup_keys: [lookupkey],
        expand: ['data.product'],
    });

    try {
        if (trial_days == 0) {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: payment_options,
                mode: "subscription",
                line_items: [
                    {
                        price: prices.data[0].id,
                        adjustable_quantity: {
                            enabled: true,
                            minimum: 1,
                            maximum: 10,
                        },
                        quantity: 1,
                    },
                ],
                success_url: success_url,
                cancel_url: cancel_url,
            })

            return {
                statusCode: 200,
                body: JSON.stringify({
                    url: session.url,
                }),
            };
        } else {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: payment_options,
                mode: "subscription",
                line_items: [
                    {
                        price: prices.data[0].id,
                        adjustable_quantity: {
                            enabled: true,
                            minimum: 1,
                            maximum: 10,
                        },
                        quantity: 1,
                    },
                ],
                subscription_data: {
                    trial_settings: {
                        end_behavior: {
                            missing_payment_method: 'cancel',
                        },
                    },
                    trial_period_days: trial_days,
                },
                success_url: success_url,
                cancel_url: cancel_url,
            })

            return {
                statusCode: 200,
                body: JSON.stringify({
                    url: session.url,
                }),
            };
        }

    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: e.message,
            }),
        };
    }
};
