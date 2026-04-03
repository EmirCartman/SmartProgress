import { z } from "zod";

const SyncWorkoutItemSchema = z.object({
    sportId: z.string().uuid("Invalid sport ID"),
});

const result = SyncWorkoutItemSchema.safeParse({ sportId: "00000000-0000-0000-0000-000000000001" });
if (!result.success) {
    console.log("FAILED:", result.error.errors[0].message);
} else {
    console.log("SUCCESS");
}
