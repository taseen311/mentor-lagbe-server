
import { connectDB } from "./config/db.js";
import tuitionRoutes from "./routes/tuitionRoutes.js";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";

const app = express();
const PORT = process.env.PORT || 5000;

// 1. CORS Middleware
const allowedOrigins = [
    "http://localhost:3000",
    process.env.CLIENT_URL,
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// 2. Better Auth
app.all("/api/auth/*splat", toNodeHandler(auth));

// 3. Database Middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database Middleware Error:", error);
        res.status(500).send({
            message: "Database connection failed",
        });
    }
});

// 4. Stripe Webhook (must be before express.json)
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);

// 5. JSON Middleware
app.use(express.json());

// 6. API Routes
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/payments", paymentRoutes);

// 7. Test Route
app.get("/", (req, res) => {
    res.send("MentorLagbe Server is Running!");
});

// 8. Start Server
app.listen(PORT, () => {
    console.log(`MentorLagbe Server is running on port ${PORT}`);
});

export default app
