
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const createApplication = async (req, res) => {
    try {
        const db = getDB();

        const {
            tuitionId,
            tuitionTitle,
            studentName,
            studentEmail,
            tutorEmail,
        } = req.body;

        // Validate required fields
        if (
            !tuitionId ||
            !studentName ||
            !studentEmail ||
            !tutorEmail
        ) {
            return res.status(400).send({
                message: "All required fields must be provided",
            });
        }

        // Validate MongoDB ID
        if (!ObjectId.isValid(tuitionId)) {
            return res.status(400).send({
                message: "Invalid tuition ID",
            });
        }

        // Check whether tuition exists and is approved
        const tuition = await db.collection("tuitions").findOne({
            _id: new ObjectId(tuitionId),
            approvalStatus: "approved",
            isActive: true,
        });

        if (!tuition) {
            return res.status(404).send({
                message: "Tuition not found or unavailable",
            });
        }

        // Prevent duplicate applications
        const existingApplication = await db
            .collection("applications")
            .findOne({
                tuitionId,
                studentEmail,
            });

        if (existingApplication) {
            return res.status(409).send({
                message: "You have already applied for this tuition",
            });
        }

        // Save application
        const newApplication = {
            tuitionId,
            tuitionTitle: tuition.title,
            studentName,
            studentEmail,
            tutorEmail: tuition.tutorEmail,
            status: "pending",
            appliedAt: new Date(),
        };

        const result = await db
            .collection("applications")
            .insertOne(newApplication);

        res.status(201).send({
            message: "Application submitted successfully!",
            insertedId: result.insertedId,
        });

    } catch (error) {
        console.error("Create Application Error:", error);

        res.status(500).send({
            message: "Failed to submit application",
        });
    }
};

export { createApplication };
