
import { insertUserSchema } from "./shared/schema";
import { z } from "zod";

console.log("Testing admin payload validation...");

const adminPayload = {
    username: "test_user_123",
    password: "password123",
    name: "Test User",
    role: "cleaner",
    avatar: ""
};

try {
    const result = insertUserSchema.parse(adminPayload);
    console.log("Validation SUCCESS!");
    console.log("Parsed result:", result);
} catch (e: any) {
    console.error("Validation FAILED!");
    console.error(JSON.stringify(e.errors, null, 2));
}

console.log("\nTesting with isActive explicit...");
const payloadWithActive = {
    ...adminPayload,
    isActive: true
};

try {
    const result = insertUserSchema.parse(payloadWithActive);
    console.log("Validation SUCCESS (with isActive)!");
} catch (e: any) {
    console.error("Validation FAILED (with isActive)!");
    console.error(JSON.stringify(e.errors, null, 2));
}
