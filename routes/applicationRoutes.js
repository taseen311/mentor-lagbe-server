
import express from "express";
import {
    createApplication,
    getMyApplications,
} from "../controllers/applicationController.js";

const router = express.Router();

router.post("/", createApplication);
router.get("/my-applications", getMyApplications);

export default router;
