import { describe, expect, it } from "vitest";
import { CreateWaitlistEntrySchema } from "./waitlist";

describe("CreateWaitlistEntrySchema", () => {
  it("accepts a valid email", () => {
    const result = CreateWaitlistEntrySchema.safeParse({ email: "jane@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = CreateWaitlistEntrySchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing email", () => {
    const result = CreateWaitlistEntrySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
