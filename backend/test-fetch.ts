import jwt from "jsonwebtoken";
import axios from "axios";
import prisma from "./src/config/prisma";
import { ENV } from "./src/config/env";

async function test() {
    const user = await prisma.user.findFirst();
    const program = await prisma.program.findFirst();
    if (!user || !program) return console.log("Missing user/program in DB");
    
    console.log(`Testing GET /api/v1/programs/${program.id} with secret: ${ENV.JWT_SECRET.slice(0, 3)}...`);
    
    const token = jwt.sign({ userId: user.id, email: user.email }, ENV.JWT_SECRET, { expiresIn: "10h" });
    
    try {
        const res = await axios.get(`http://localhost:3000/api/v1/programs/${program.id}`, { 
            headers: { Authorization: "Bearer " + token } 
        });
        console.log("SUCCESS HTTP STATUS:", res.status);
    } catch (err: any) {
        if(err.response) {
            console.log("ERROR HTTP STATUS:", err.response.status);
            console.log("ERROR HTTP DATA:", err.response.data);
        } else {
            console.log("ERROR:", err.message);
        }
    }
}
test().finally(() => prisma.$disconnect());
