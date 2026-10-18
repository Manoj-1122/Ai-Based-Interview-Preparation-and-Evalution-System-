import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, RotateCcw, TrendingUp, Lightbulb, Star, AlertTriangle, BookOpen } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { generateInterviewPDF } from "@/lib/pdf-export";
import Navbar from "@/components/Navbar";

const fallbackSkills = [
  { name: "Content Relevance", score: 75 },
  { name: "Technical Accuracy", score: 80 },
  { name: "Communication Skills", score: 70 },
  { name: "Confidence & Fluency", score: 72 },
  { name: "Grammar & Vocabulary", score: 85 },
  { name: "Response Time", score: 68 },
];

const fallbackFeedback = [
  { title: "Strong Technical Foundation", text: "You demonstrated solid understanding of core concepts.", type: "strength" as const },
  { title: "Improve Communication Clarity", text: "Try structuring answers using the STAR method for better clarity.", type: "improvement" as const },
  { title: "Good Problem Solving", text: "Your analytical approach is methodical and effective.", type: "strength" as const },
  { title: "Build Confidence", text: "Practice speaking about your projects with more conviction.", type: "improvement" as const },
];

const feedbackIcons: Record<string, typeof TrendingUp> = {
  strength: Star,
  improvement: Lightbulb,
};

const skillColors = ["bg-primary", "bg-secondary", "bg-accent", "bg-primary", "bg-secondary", "bg-accent"];

export default function ResultsPage() {
  const location = useLocation();
  const evaluation = location.state?.evaluation;

  const overallScore = evaluation?.overallScore ?? 75;
  const performanceLabel = evaluation?.performanceLabel ?? "Good Effort";
  const skills = (evaluation?.skills ?? fallbackSkills).map((s: { name: string; score: number }, i: number) => ({
    ...s,
    color: skillColors[i % skillColors.length],
  }));
  const feedback = evaluation?.feedback ?? fallbackFeedback;

  const radarData = skills.map((s: { name: string; score: number }) => ({
    subject: s.name.split(" ")[0],
    score: s.score,
    fullMark: 100,
  }));

  const handleExportPDF = () => {
    generateInterviewPDF({
      overall_score: overallScore,
      performance_label: performanceLabel,
      role: "Interview",
      skills,
      feedback,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-12 px-4 max-w-4xl pt-24">
        <div className="flex justify-end gap-3 mb-6">
          <Link to="/setup">
            <Button variant="heroOutline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" /> Retake
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" /> Export PDF
          </Button>
        </div>
        {/* Overall Score */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-12">
          <p className="text-muted-foreground text-sm font-medium mb-4 uppercase tracking-wider">Overall Performance</p>
          <div className="relative inline-flex items-center justify-center">
            <svg className="h-40 w-40" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted" />
              <circle
                cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                strokeDasharray={`${(overallScore / 100) * 339.3} 339.3`}
                strokeLinecap="round"
                className="stroke-primary"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div className="absolute">
              <span className="font-display text-4xl font-bold text-foreground">{overallScore}</span>
              <span className="text-muted-foreground text-sm">/100</span>
            </div>
          </div>
          <p className="text-accent font-semibold mt-4">{performanceLabel}</p>
          {!evaluation && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Sample results shown (AI evaluation unavailable)
            </p>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Radar Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Skill Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Score Bars */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-6">Detailed Scores</h3>
            <div className="space-y-5">
              {skills.map((s: { name: string; score: number; color: string }, i: number) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.score}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${s.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Feedback */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="font-display text-xl font-semibold text-foreground mb-6">AI Feedback & Suggestions</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {feedback.map((f: { title: string; text: string; type: string }, i: number) => {
              const Icon = feedbackIcons[f.type] || Lightbulb;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                      f.type === "strength" ? "bg-accent/10" : "bg-primary/10"
                    }`}>
                      <Icon className={`h-4 w-4 ${f.type === "strength" ? "text-accent" : "text-primary"}`} />
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{f.title}</h4>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.text}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/dashboard">
            <Button variant="hero" size="lg">
              View Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/setup">
            <Button variant="heroOutline" size="lg">New Interview</Button>
          </Link>
          <Link to="/learning">
            <Button variant="ghost" size="lg">
              <BookOpen className="h-4 w-4 mr-2" /> Continue Learning
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
