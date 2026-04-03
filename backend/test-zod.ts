import { syncWorkoutsSchema } from "./src/services/workout.service";

const payload = {
  workouts: [
    {
      "sportId": "00000000-0000-0000-0000-000000000001",
      "title": "psuhlamak",
      "data": {
        "exercises": [
          {
            "name": "bench",
            "sets": [
              {
                "reps": 0,
                "weight": 101,
                "unit": "kg"
              }
            ]
          }
        ],
        "totalDuration": 7,
        "totalVolume": 0
      },
      "logDate": "2026-03-19T20:44:46.382Z"
    }
  ]
};

const parsed = syncWorkoutsSchema.safeParse(payload);
if (!parsed.success) {
    console.log(JSON.stringify(parsed.error.flatten(), null, 2));
} else {
    console.log("Success!");
}
