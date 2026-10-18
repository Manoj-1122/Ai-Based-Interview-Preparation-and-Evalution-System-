import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { learningPaths } from "@/data/learningPaths";

export default function LearningPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-8 px-4 max-w-6xl pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <p className="text-sm text-muted-foreground">
            <Link to="/roles" className="hover:text-primary">Job Roles</Link> / <span className="text-foreground font-medium">Resources</span>
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
          <h1 className="font-display text-2xl font-bold text-primary mb-2">Learning Resources</h1>
          <p className="text-muted-foreground text-sm">Study these materials to build a strong foundation before practicing interviews.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {learningPaths.map((path, i) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <div className="h-20 w-20 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground text-sm mb-1">{path.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">{path.subtitle}</p>
                <p className="text-xs font-semibold text-foreground mb-1">{path.courses} courses</p>
                <p className="text-xs text-muted-foreground mb-4">{path.description}</p>

                <p className="text-xs text-muted-foreground font-medium mb-2">Learning outcomes:</p>
                <ul className="space-y-1.5 mb-5">
                  {path.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-xs text-foreground">
                      <Check className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              <Link to={`/learning/${path.id}`}>
                <Button variant="heroOutline" size="sm" className="w-full">
                  Explore this path
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA to Practice */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView="visible" viewport={{ once: true }} animate={{ opacity: 1, y: 0 }}
          className="text-center glass-card rounded-2xl p-10 mt-12"
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Done studying?</h2>
          <p className="text-muted-foreground text-sm mb-6">Put your knowledge to the test with AI-powered practice interviews.</p>
          <Link to="/setup">
            <Button variant="hero" size="lg">
              Go to Practice <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
