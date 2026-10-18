const knownResumeSkills = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "Python",
  "Java",
  "C++",
  "C#",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "AWS",
  "Azure",
  "Google Cloud",
  "Docker",
  "Kubernetes",
  "TensorFlow",
  "PyTorch",
  "scikit-learn",
  "Machine Learning",
  "Data Analysis",
  "Figma",
  "GraphQL",
  "REST API",
  "Git",
  "CI/CD",
];

function getResumeEvidence(resumeText: string): string[] {
  return resumeText
    .split(/[\r\n.!?]+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) =>
      part.length >= 24 &&
      /[a-z]{3}/i.test(part) &&
      !/^(resume|curriculum vitae|experience|education|skills|projects|certifications|references)$/i.test(part)
    )
    .map((part) => part.slice(0, 180));
}

function resumeMentionsSkill(resumeText: string, skill: string): boolean {
  const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escapedSkill}(?=$|[^a-z0-9])`, "i").test(resumeText);
}

export function createResumeFallbackQuestions(resumeText: string, role: string): string[] {
  const skills = knownResumeSkills.filter((skill) => resumeMentionsSkill(resumeText, skill));
  const evidence = getResumeEvidence(resumeText);
  const fallbackEvidence = resumeText.replace(/\s+/g, " ").trim().slice(0, 180);
  const details = evidence.length > 0 ? evidence : [fallbackEvidence];
  const firstSkills = skills.slice(0, 4).join(", ");
  const detail = (index: number) => details[Math.min(index, details.length - 1)];

  return [
    skills.length > 0
      ? `Your resume lists ${firstSkills}. Which of these skills is most relevant to a ${role} role, and how have you applied it in a project?`
      : `Your resume includes "${detail(0)}". How does this experience prepare you for a ${role} role?`,
    `Your resume states "${detail(0)}". What was your specific contribution, and how did you approach the work?`,
    `For the experience described as "${detail(1)}", what important technical or practical trade-off did you make?`,
    `Your resume mentions "${detail(2)}". What was the hardest challenge, and how did you determine whether your solution worked?`,
    skills.length > 0
      ? `How would you apply your experience with ${firstSkills} to solve a new, complex problem as a ${role}?`
      : `Looking back at "${detail(3)}", what would you improve if you worked on it again, and why?`,
  ];
}
