import { z } from "zod";

const syncWorkoutsSchema = z.object({
    workouts: z.array(z.object({
        data: z.object({
            exercises: z.array(z.object({
                sets: z.array(z.object({
                    weight: z.number().positive()
                }))
            }))
        })
    }))
});

const payload = {
    workouts: [
        {
            data: {
                exercises: [
                    {
                        sets: [ { weight: -5 } ]
                    }
                ]
            }
        }
    ]
};

const parsed = syncWorkoutsSchema.safeParse(payload);
if (!parsed.success) {
    console.log(JSON.stringify(parsed.error.flatten(), null, 2));
}
