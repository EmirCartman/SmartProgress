import { z } from "zod";

const testCases = [
    { name: "min(0)", schema: z.number().min(0) },
    { name: "min(1)", schema: z.number().min(1) },
    { name: "gt(0)", schema: z.number().gt(0) },
    { name: "gte(0)", schema: z.number().gte(0) },
    { name: "positive()", schema: z.number().positive() },
    { name: "nonnegative()", schema: z.number().nonnegative() }
];

for (const tc of testCases) {
    const r = tc.schema.safeParse(-1);
    if (!r.success) {
        console.log(`${tc.name}: ${r.error.errors[0].message}`);
    }
}
