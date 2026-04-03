import jwt from "jsonwebtoken";
import axios from "axios";
import prisma from "./src/config/prisma";
import { ENV } from "./src/config/env";

async function test() {
    const user = await prisma.user.findFirst();
    if (!user) return console.log("Missing user in DB");
    
    const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, { expiresIn: "10h" });
    
    const payload = {
        name: "Test Fake Program",
        description: "Checking if data saves",
        isPublic: false,
        frequency: 3,
        data: {
            frequency: 3,
            days: [
                { label: "Day 1", isRestDay: false, exercises: [{ id: "ex1", name: "Squat", targetSets: [] }] }
            ]
        }
    };

    try {
        console.log("Sending POST /api/v1/programs...");
        const res = await axios.post(`http://localhost:3000/api/v1/programs`, payload, { 
            headers: { Authorization: "Bearer " + token } 
        });
        console.log("SUCCESS CREATING:", res.data);

        console.log("Checking DB directly for created program...");
        const stored = await prisma.program.findUnique({ where: { id: res.data.id } });
        console.log("STORED DATA:", JSON.stringify(stored?.data));
    } catch (err: any) {
        console.log("ERROR:", err.response?.data || err.message);
    }
}

test().finally(() => prisma.$disconnect());
