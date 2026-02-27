import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// Middlewares
// ─────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "smartprogress-api",
        timestamp: new Date().toISOString(),
    });
});

// ─────────────────────────────────────────────
// Routes (sonraki aşamada eklenecek)
// ─────────────────────────────────────────────
// app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/sports", sportRoutes);
// app.use("/api/v1/workouts", workoutRoutes);

// ─────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 SmartProgress API running on port ${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
