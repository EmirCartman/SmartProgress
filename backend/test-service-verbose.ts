import { programService } from "./src/services/program.service";
import prisma from "./src/config/prisma";
import fs from "fs";

async function run() {
    let output = "";
    try {
        const user = await prisma.user.findFirst();
        const program = await prisma.program.findFirst();

        output += `DB User found: ${user?.id}\n`;
        output += `DB Program found: ${program?.id}\n`;

        if (!user || !program) {
            output += "Missing user or program\n";
        } else {
            const result = await programService.getProgramById(user.id, program.id);
            output += `getProgramById SUCCESS: ${result.id}\n`;
        }
    } catch (e: any) {
        output += `getProgramById ERROR: ${e.constructor.name} - ${e.message}\n`;
        output += `Stack: ${e.stack}\n`;
    } finally {
        fs.writeFileSync("test-service-output.txt", output);
        await prisma.$disconnect();
    }
}

run();
