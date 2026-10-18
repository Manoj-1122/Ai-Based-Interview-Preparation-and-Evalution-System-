import { describe, expect, it } from "vitest";
import { validatePassword } from "./password";

describe("validatePassword", () => {
  it("allows passwords up to 50 characters", () => {
    const password = "Abcdefghij123#" + "a".repeat(36);
    expect(validatePassword(password)).toBeNull();
  });

  it("rejects passwords longer than 50 characters", () => {
    const password = "Abcdefghij123#" + "a".repeat(37);
    expect(validatePassword(password)).toBe("Password must be at most 50 characters");
  });
});
