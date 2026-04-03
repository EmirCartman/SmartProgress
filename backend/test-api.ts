import axios from "axios";
import { PrismaClient } from "@prisma/client";

async function run() {
    const prisma = new PrismaClient();
    try {
        const u = await prisma.user.findFirst();
        const progs = await prisma.program.findMany({ take: 1, orderBy: { createdAt: 'desc' } });
        if(progs.length === 0) return console.log("No programs");

        console.log("Found program ID:", progs[0].id);

        try {
            const loginRes = await axios.post("http://localhost:3000/api/v1/auth/login", {
                email: u!.email,
                password: "password123" // Attempting standard test password
            });
            const token = loginRes.data.token;
            console.log("Logged in!", token.substring(0, 5));

            const apiRes = await axios.get(`http://localhost:3000/api/v1/programs/${progs[0].id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("API replied successfully:", apiRes.status);
            
        } catch(e: any) {
            if(e.response) {
                console.log("API failed with:", e.response.status, e.response.data);
            } else {
                console.log("API error:", e.message);
            }
        }

    } finally {
        await prisma.$disconnect();
    }
}
run();
