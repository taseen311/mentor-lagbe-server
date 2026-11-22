import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { connectDB } from "./db.js";
import "dotenv/config";

const db = await connectDB();

export const auth = betterAuth({
    database: mongodbAdapter(db),

    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,

    trustedOrigins: [
        "http://localhost:3000",
        "https://mentorlagbe-client-theta.vercel.app",
        ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.replace(/\/$/, "")] : [])
    ],

    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
        },
    },

    emailAndPassword: {
        enabled: true,
    },

    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    return {
                        data: {
                            ...user,
                            role: user.role === "tutor" ? "tutor" : "student",
                        },
                    };
                },
            },
        },
    },

    user: {
        additionalFields: {
            role: {
                type: ["student", "tutor", 'admin'],
                required: true,
                defaultValue: "student",
                input: true,
            },
            plan: {
                type: ["free", "pro"],
                required: true,
                defaultValue: "free",
                input: false,
            },
        },
    },
});