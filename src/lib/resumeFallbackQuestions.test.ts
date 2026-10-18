import { describe, expect, it } from "vitest";
import { createResumeFallbackQuestions } from "./resumeFallbackQuestions";

describe("createResumeFallbackQuestions", () => {
  it("creates five questions grounded in resume skills and experience", () => {
    const questions = createResumeFallbackQuestions(
      "Built a React dashboard with TypeScript for analytics reporting. Improved page load time by 40%.",
      "Software Developer"
    );

    expect(questions).toHaveLength(5);
    expect(questions.join(" ")).toContain("React");
    expect(questions.join(" ")).toContain("Improved page load time by 40%");
    expect(questions.every((question) => question.length > 0)).toBe(true);
  });

  it("still creates five questions when the resume has no recognized skills", () => {
    const questions = createResumeFallbackQuestions(
      "Led a customer onboarding project and reduced setup time for new clients.",
      "Product Manager"
    );

    expect(questions).toHaveLength(5);
    expect(questions.join(" ")).toContain("customer onboarding project");
    expect(questions.some((question) => question.includes("Product Manager"))).toBe(true);
  });
});
