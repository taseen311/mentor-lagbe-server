import { connectDB } from "./config/db.js";
import tuitionRoutes from "./routes/tuitionRoutes.js";
import express from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import applicationRoutes from "./routes/applicationRoutes.js";
const app = express();

// Server port
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

// Database Middleware
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

//routes

// Routes
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/applications", applicationRoutes);


// Test route
app.get("/", (req, res) => {
    res.send("MentorLagbe Server is Running!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`MentorLagbe Server is running on port ${PORT}`);
});
