import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { ArrowRight, Briefcase, DollarSign, Wrench } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const jobRoles = [
  {
    id: "swe",
    title: "Software Developer",
    salary: "₹8L – ₹25L per year",
    description: "Build, test, and maintain software applications using modern technologies.",
    skills: ["JavaScript", "React", "Node.js", "SQL", "Git", "System Design"],
  },
  {
    id: "ds",
    title: "Data Scientist",
    salary: "₹10L – ₹30L per year",
    description: "Analyze complex datasets, build ML models, and derive actionable insights.",
    skills: ["Python", "Pandas", "Machine Learning", "Statistics", "SQL", "Visualization"],
  },
  {
    id: "ai",
    title: "AI Engineer",
    salary: "₹12L – ₹35L per year",
    description: "Design and deploy AI/ML systems for real-world applications.",
    skills: ["Deep Learning", "NLP", "TensorFlow", "PyTorch", "MLOps", "Python"],
  },
  {
    id: "ux",
    title: "UX/UI Designer",
    salary: "₹6L – ₹22L per year",
    description: "Create intuitive and engaging user experiences and interfaces.",
    skills: ["Figma", "Prototyping", "User Research", "Responsive Design", "Accessibility", "Design Systems"],
  },
  {
    id: "pm",
    title: "Product Manager",
    salary: "₹10L – ₹32L per year",
    description: "Lead product strategy, roadmap, and cross-functional team collaboration.",
    skills: ["Roadmapping", "Agile", "Stakeholder Management", "Analytics", "Market Research", "Prioritization"],
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    salary: "₹9L – ₹28L per year",
    description: "Automate and streamline CI/CD, infrastructure, and cloud deployments.",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"],
  },
  {
    id: "qa",
    title: "QA Engineer",
    salary: "₹5L – ₹18L per year",
    description: "Ensure software quality through testing strategies and automation.",
    skills: ["Selenium", "Test Planning", "API Testing", "Automation", "Bug Tracking", "Performance Testing"],
  },
  {
    id: "cyber",
    title: "Cybersecurity Analyst",
    salary: "₹7L – ₹24L per year",
    description: "Protect systems and networks from cyber threats and vulnerabilities.",
    skills: ["Network Security", "Ethical Hacking", "SIEM", "Firewalls", "Incident Response", "Compliance"],
  },
];

export default function JobRolesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-8 px-4 max-w-6xl pt-24">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-10 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Explore Job Roles</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover in-demand tech roles, required skills, and salary ranges. Choose a role to start preparing.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {jobRoles.map((role, i) => (
            <motion.div
              key={role.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-foreground text-lg mb-1">{role.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>

                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-accent">{role.salary}</span>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">Key Skills:</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {role.skills.map((skill) => (
                    <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <Link to="/learning">
                <Button variant="heroOutline" size="sm" className="w-full">
                  Start Preparing <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="text-center glass-card rounded-2xl p-10"
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Ready to prepare?</h2>
          <p className="text-muted-foreground text-sm mb-6">Browse our learning resources or jump straight into practice.</p>
          <div className="flex justify-center gap-4">
            <Link to="/learning">
              <Button variant="hero" size="lg">
                Browse Resources <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/setup">
              <Button variant="heroOutline" size="lg">Go to Practice</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
