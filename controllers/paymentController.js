
import stripe from "../config/stripe.js";
import { auth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { getDB } from "../config/db.js";

const createCheckoutSession = async (req, res) => {
    try {
        // 1. Check logged-in user's session
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
            return res.status(401).send({
                message: "Please login first",
            });
        }

        const user = session.user;

        // 2. Determine price according to user role
        let amount;

        if (user.role === "tutor") {
            amount = 1500; // $15
        } else if (user.role === "student") {
            amount = 1000; // $10
        } else {
            return res.status(403).send({
                message: "Invalid user role",
            });
        }

        // 3. Create Stripe Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            // payment_method_types: ["card"],
            customer_email: user.email,
            client_reference_id: user.id,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "MentorLagbe Pro Plan",
                            description: `${user.role} monthly Pro subscription`,
                        },
                        unit_amount: amount,
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                userId: user.id,
                userEmail: user.email,
                role: user.role,
            },
            subscription_data: {
                metadata: {
                    userId: user.id,
                    userEmail: user.email,
                    role: user.role,
                },
            },
            success_url: "http://localhost:3000/pricing?success=true",
            cancel_url: "http://localhost:3000/pricing?canceled=true",
        });

        // 4. Send Checkout URL to frontend
        res.send({
            url: checkoutSession.url,
        });
    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).send({
            message: "Failed to create checkout session",
        });
    }
};


const handleStripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook signature error:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        if (event.type === "checkout.session.completed") {
            const checkoutSession = event.data.object;

            if (checkoutSession.payment_status !== "paid") {
                return res.send({ received: true });
            }

            const db = getDB();
            const userEmail = checkoutSession.metadata.userEmail;

            // Upgrade user to Pro
            await db.collection("user").updateOne(
                { email: userEmail },
                {
                    $set: {
                        plan: "pro",
                        stripeCustomerId: checkoutSession.customer,
                        stripeSubscriptionId: checkoutSession.subscription,
                    },
                }
            );

            // Prevent duplicate payment records
            const existingPayment = await db.collection("payments").findOne({
                stripeSessionId: checkoutSession.id,
            });

            if (!existingPayment) {
                await db.collection("payments").insertOne({
                    userEmail,
                    userId: checkoutSession.metadata.userId,
                    role: checkoutSession.metadata.role,
                    amount: checkoutSession.amount_total / 100,
                    currency: checkoutSession.currency,
                    stripeSessionId: checkoutSession.id,
                    subscriptionId: checkoutSession.subscription,
                    status: "paid",
                    createdAt: new Date(),
                });
            }
        }

        res.send({ received: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        res.status(500).send({ message: "Webhook processing failed" });
    }
};

export { createCheckoutSession, handleStripeWebhook };
