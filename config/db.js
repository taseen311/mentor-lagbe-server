
import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI);

let db;

const connectDB = async () => {
    if (db) return db;

    try {
        await client.connect();

        db = client.db("mentorlagbe");

        console.log("MongoDB Connected Successfully!");

        return db;
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        throw error;
    }
};

const getDB = () => {
    if (!db) {
        throw new Error("Database is not connected!");
    }

    return db;
};

export { connectDB, getDB };


