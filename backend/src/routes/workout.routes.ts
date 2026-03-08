// ─────────────────────────────────────────────
// Workout Routes
// ─────────────────────────────────────────────
import { Router } from "express";
import { workoutController } from "../controllers/workout.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// All workout routes require authentication
router.use(authenticate);

router.post("/sync", (req, res, next) => workoutController.sync(req, res, next));
router.get("/", (req, res, next) => workoutController.list(req, res, next));

export default router;
