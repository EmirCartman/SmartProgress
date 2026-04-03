import express from "express";
import programRoutes from "./src/routes/program.routes";

const app = express();
app.use(express.json());

// Mock authenticate middleware since it's imported in programRoutes
jest = require('jest-mock');
const authMock = jest.fn((req: any, res: any, next: any) => {
    req.user = { userId: "test-user-id", role: "user" };
    next();
});
// Need to mock the imports inside programRoutes if they fail. 
// But actually we can just start it and test the route matching.
app.use("/api/v1/programs", programRoutes);

app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
});

const server = app.listen(3001, async () => {
    console.log("Server listening on 3001");
    const axios = require('axios');
    try {
        const res = await axios.get("http://localhost:3001/api/v1/programs/123-abc");
        console.log("SUCCESS:", res.status, res.data);
    } catch (e: any) {
        console.log("ERROR STATUS:", e.response?.status);
        console.log("ERROR DATA:", e.response?.data);
    }
    server.close();
    process.exit(0);
});
