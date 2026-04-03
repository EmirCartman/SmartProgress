import { z } from "zod";

const result1 = z.number().min(1).safeParse(0);
console.log("min(1):", !result1.success ? result1.error.errors[0].message : "SUCCESS");

const result2 = z.number().gt(0).safeParse(0);
console.log("gt(0):", !result2.success ? result2.error.errors[0].message : "SUCCESS");

const result3 = z.number().positive().safeParse(0);
console.log("positive():", !result3.success ? result3.error.errors[0].message : "SUCCESS");
