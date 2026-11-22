
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { auth } from "../config/auth.js";
import { fromNodeHeaders } from "better-auth/node";

// Verify logged-in student
const getStudentSession = async (req) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session) return null;
    if (session.user.role !== "student") return null;

    return session;
};

// Create Application
const createApplication = async (req, res) => {
    try {
        const db = getDB();
        const session = await getStudentSession(req);

        if (!session) {
            return res.status(401).send({
                message: "Please login with a student account",
            });
        }

        const { tuitionId } = req.body;

        if (!tuitionId || !ObjectId.isValid(tuitionId)) {
            return res.status(400).send({
                message: "Invalid tuition ID",
            });
        }

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

        const studentEmail = session.user.email;

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

        const newApplication = {
            tuitionId,
            tuitionTitle: tuition.title,
            studentName: session.user.name,
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

// Get logged-in student's applications
const getMyApplications = async (req, res) => {
    try {
        const db = getDB();
        const session = await getStudentSession(req);

        if (!session) {
            return res.status(401).send({
                message: "Please login with a student account",
            });
        }

        const applications = await db
            .collection("applications")
            .find({
                studentEmail: session.user.email,
            })
            .sort({ appliedAt: -1 })
            .toArray();

        res.send(applications);

    } catch (error) {
        console.error("Get My Applications Error:", error);

        res.status(500).send({
            message: "Failed to fetch applications",
        });
    }
};


const getTutorApplications = async (req, res) => {
    try {
        const db = getDB();

        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session || session.user.role !== "tutor") {
            return res.status(401).send({
                message: "Tutor access required",
            });
        }

        const applications = await db.collection("applications")
            .find({
                tutorEmail: session.user.email,
            })
            .sort({ appliedAt: -1 })
            .toArray();

        res.send(applications);

    } catch (error) {
        console.error("Get Tutor Applications Error:", error);

        res.status(500).send({
            message: "Failed to fetch applications",
        });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const db = getDB();

        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session || session.user.role !== "tutor") {
            return res.status(401).send({
                message: "Tutor access required",
            });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).send({
                message: "Invalid application ID",
            });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).send({
                message: "Invalid application status",
            });
        }

        const result = await db.collection("applications").updateOne(
            {
                _id: new ObjectId(id),
                tutorEmail: session.user.email,
            },
            {
                $set: {
                    status,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send({
                message: "Application not found",
            });
        }

        res.send({
            message: `Application ${status} successfully!`,
        });

    } catch (error) {
        console.error("Update Application Status Error:", error);

        res.status(500).send({
            message: "Failed to update application status",
        });
    }
};


export { createApplication, getMyApplications, getTutorApplications, updateApplicationStatus };

