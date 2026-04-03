import jwt from "jsonwebtoken";
import axios from "axios";
import prisma from "./src/config/prisma";
import { ENV } from "./src/config/env";
import fs from "fs";

async function test() {
    let output = "";
    try {
        const user = await prisma.user.findFirst();
        if (!user) return console.log("Missing user in DB");
        
        const token = jwt.sign({ userId: user.id }, ENV.JWT_SECRET, { expiresIn: "10h" });
        
        const payload = {
            name: "Test HTTP Program",
            description: "Checking if controller preserves data",
            isPublic: false,
            frequency: 3,
            data: {
                frequency: 3,
                days: [
                    { label: "Day 1", isRestDay: false, exercises: [{ id: "ex1", name: "Squat", targetSets: [] }] }
                ]
            }
        };

        const res = await axios.post(`http://localhost:3000/api/v1/programs`, payload, { 
            headers: { Authorization: "Bearer " + token } 
        });
        
        output += "SUCCESS CREATING VIA HTTP: " + res.data.id + "\n";
        
        const stored = await prisma.program.findUnique({ where: { id: res.data.id } });
        output += "HTTP STORED DATA: " + JSON.stringify(stored?.data) + "\n";

    } catch (err: any) {
        output += "HTTP ERROR: " + (err.response?.data ? JSON.stringify(err.response.data) : err.message) + "\n";
    } finally {
        fs.writeFileSync("test-http-output.txt", output);
        await prisma.$disconnect();
    }
}
test();
