import express from "express";

import {
    getAllTuitions,
    createTuition,
    getTuitionById,
    updateTuition,
    deleteTuition,
    getPendingTuitions,
    updateTuitionApproval,
} from "../controllers/tuitionController.js";

const router = express.Router();

router.get("/pending", getPendingTuitions);
router.patch("/:id/approval", updateTuitionApproval);

router.get("/", getAllTuitions);
router.post("/", createTuition);

router.get("/:id", getTuitionById);
router.patch("/:id", updateTuition);
router.delete("/:id", deleteTuition);

export default router;