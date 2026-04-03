import prisma from "./src/config/prisma";
import { programService } from "./src/services/program.service";
import fs from "fs";

async function test() {
    let output = "";
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            output += "Missing user\n";
            return;
        }

        const payload = {
            name: "Test Direct Create",
            description: "Check if data is null",
            isPublic: false,
            frequency: 3,
            data: {
                frequency: 3,
                days: [
                    { label: "Day 1", isRestDay: false, exercises: [{ id: "ex1", name: "Squat", targetSets: [] }] }
                ]
            }
        };

        const res = await programService.createProgram(user.id, payload);
        output += "SUCCESS CREATING: " + res.id + "\n";
        
        const stored = await prisma.program.findUnique({ where: { id: res.id } });
        output += "STORED DATA: " + JSON.stringify(stored?.data) + "\n";

    } catch (err: any) {
        output += "ERROR: " + err.message + "\n";
    } finally {
        fs.writeFileSync("test-create-output.txt", output);
        await prisma.$disconnect();
    }
}
test();
