
import { MongoClient } from "mongodb";
import "dotenv/config";

const client = new MongoClient(process.env.MONGODB_URI);

const subjects = [
    "Mathematics",
    "Physics",
    "English",
    "Chemistry",
    "Biology",
];

const classes = [
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
];

const modes = ["Online", "Offline"];

const tuitions = Array.from({ length: 15 }, (_, i) => ({
    title: `${classes[i % 5]} ${subjects[i % 5]} Tutor`,
    subject: subjects[i % 5],
    classLevel: classes[i % 5],
    mode: modes[i % 2],
    location: i % 2 === 0 ? "Barishal" : "Dhaka",
    monthlyFee: 3000 + i * 500,
    daysPerWeek: (i % 5) + 3,
    bannerImage: "",
    description: `Looking for an experienced ${subjects[i % 5]} tutor for ${classes[i % 5]}.`,
    tutorName: `Demo Tutor ${i + 1}`,
    tutorEmail: `demo${i + 1}@example.com`,
    approvalStatus: "approved",
    isActive: true,
    isDemo: true,
    createdAt: new Date(),
}));

async function seedTuitions() {
    try {
        await client.connect();

        const db = client.db("mentorlagbe");
        const collection = db.collection("tuitions");

        // Remove previously generated demo records
        await collection.deleteMany({ isDemo: true });

        // Insert 15 demo records
        const result = await collection.insertMany(tuitions);

        console.log(`${result.insertedCount} demo tuitions inserted successfully!`);

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await client.close();
    }
}

seedTuitions();
