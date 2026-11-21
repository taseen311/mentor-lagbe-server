import express from "express";
import { getAllTuitions, createTuition, getTuitionById, updateTuition, deleteTuition } from "../controllers/tuitionController.js";

const router = express.Router();

router.get("/", getAllTuitions);
router.post("/", createTuition);
// Get a single tuition by ID
router.get("/:id", getTuitionById);
// Update a tuition
router.patch("/:id", updateTuition);
// Delete a tuition
router.delete("/:id", deleteTuition);

export default router;