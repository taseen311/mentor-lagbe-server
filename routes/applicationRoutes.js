
import express from "express";

import {
    createApplication,
    getMyApplications,
    getTutorApplications,
    updateApplicationStatus,
} from "../controllers/applicationController.js";

const router = express.Router();

router.post("/", createApplication);

router.get("/my-applications", getMyApplications);

router.get("/tutor-applications", getTutorApplications);

router.patch("/:id/status", updateApplicationStatus);

export default router;

