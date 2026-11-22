import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

const getAllTuitions = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 6;
        const skip = (page - 1) * limit;

        const db = getDB();

        const { search, mode, classLevel } = req.query;

        const query = {
            approvalStatus: "approved",
            isActive: true,
        };

        if (mode) {
            query.mode = mode;
        }

        if (classLevel) {
            query.classLevel = classLevel;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { subject: { $regex: search, $options: "i" } },
                { classLevel: { $regex: search, $options: "i" } },
                { mode: { $regex: search, $options: "i" } },
            ];
        }


        const collection = db.collection("tuitions");

        // Total matching tuition count
        const totalTuitions = await collection.countDocuments(query);

        // Fetch tuition for the current page
        const tuitions = await collection
            .find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        // Calculate total pages
        const totalPages = Math.ceil(totalTuitions / limit);

        res.send({
            tuitions,
            totalTuitions,
            totalPages,
            currentPage: page,
        });


        res.send(tuitions);
    } catch (error) {
        console.error("Get Tuitions Error:", error);
        res.status(500).send({
            message: "Failed to fetch tuitions",
        });
    }
};



const createTuition = async (req, res) => {
    try {
        const db = getDB();

        const {
            title,
            subject,
            classLevel,
            mode,
            location,
            monthlyFee,
            daysPerWeek,
            bannerImage,
            description,
            tutorName,
            tutorEmail,
        } = req.body;

        // Validate required fields
        if (
            !title ||
            !subject ||
            !classLevel ||
            !mode ||
            !location ||
            !monthlyFee ||
            !daysPerWeek ||
            !description ||
            !tutorName ||
            !tutorEmail
        ) {
            return res.status(400).send({
                message: "Please provide all required fields",
            });
        }

        // Validate mode
        if (!["Online", "Offline"].includes(mode)) {
            return res.status(400).send({
                message: "Mode must be Online or Offline",
            });
        }

        const fee = Number(monthlyFee);
        const days = Number(daysPerWeek);

        if (!Number.isFinite(fee) || fee <= 0) {
            return res.status(400).send({
                message: "Monthly fee must be a positive number",
            });
        }

        if (!Number.isInteger(days) || days < 1 || days > 7) {
            return res.status(400).send({
                message: "Days per week must be between 1 and 7",
            });
        }

        const newTuition = {
            title,
            subject,
            classLevel,
            mode,
            location,
            monthlyFee: fee,
            daysPerWeek: days,
            bannerImage: bannerImage || "",
            description,
            tutorName,
            tutorEmail,
            approvalStatus: "pending",
            isActive: true,
            createdAt: new Date(),
        };

        const result = await db
            .collection("tuitions")
            .insertOne(newTuition);

        res.status(201).send({
            message: "Tuition created successfully!",
            insertedId: result.insertedId,
        });

    } catch (error) {
        console.error("Error creating tuition:", error);

        res.status(500).send({
            message: "Failed to create tuition",
        });
    }
};

const getTuitionById = async (req, res) => {
    try {
        const db = getDB();

        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid tuition ID",
            });
        }

        const tuition = await db
            .collection("tuitions")
            .findOne({ _id: new ObjectId(id) });

        if (!tuition) {
            return res.status(404).send({
                message: "Tuition not found",
            });
        }

        res.send(tuition);

    } catch (error) {
        console.error("Error fetching tuition:", error);

        res.status(500).send({
            message: "Failed to fetch tuition",
        });
    }
};

const updateTuition = async (req, res) => {
    try {
        const db = getDB();

        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData._id; // prevent modifying immutable _id

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid tuition ID",
            });
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).send({
                message: "Please provide data to update",
            });
        }

        const result = await db.collection("tuitions").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({
                message: "Tuition not found",
            });
        }

        res.send({
            message: "Tuition updated successfully!",
            modifiedCount: result.modifiedCount,
        });

    } catch (error) {
        console.error("Error updating tuition:", error);

        res.status(500).send({
            message: "Failed to update tuition",
        });
    }
};

const deleteTuition = async (req, res) => {
    try {
        const db = getDB();

        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid tuition ID",
            });
        }

        const result = await db
            .collection("tuitions")
            .deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).send({
                message: "Tuition not found",
            });
        }

        res.send({
            message: "Tuition deleted successfully!",
            deletedCount: result.deletedCount,
        });

    } catch (error) {
        console.error("Error deleting tuition:", error);

        res.status(500).send({
            message: "Failed to delete tuition",
        });
    }
};

// Get all pending tuitions for Admin
const getPendingTuitions = async (req, res) => {
    try {
        const db = getDB();

        const tuitions = await db.collection("tuitions")
            .find({ approvalStatus: "pending" })
            .sort({ createdAt: -1 })
            .toArray();

        res.send(tuitions);

    } catch (error) {
        console.error("Get Pending Tuitions Error:", error);

        res.status(500).send({
            message: "Failed to fetch pending tuitions",
        });
    }
};


// Approve or Reject a tuition
const updateTuitionApproval = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { approvalStatus } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid tuition ID",
            });
        }

        if (!["approved", "rejected"].includes(approvalStatus)) {
            return res.status(400).send({
                message: "Status must be approved or rejected",
            });
        }

        const result = await db.collection("tuitions").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    approvalStatus,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({
                message: "Tuition not found",
            });
        }

        res.send({
            message: `Tuition ${approvalStatus} successfully!`,
        });

    } catch (error) {
        console.error("Update Approval Error:", error);

        res.status(500).send({
            message: "Failed to update tuition approval",
        });
    }
};


export { getAllTuitions, createTuition, getTuitionById, updateTuition, deleteTuition, getPendingTuitions, updateTuitionApproval };