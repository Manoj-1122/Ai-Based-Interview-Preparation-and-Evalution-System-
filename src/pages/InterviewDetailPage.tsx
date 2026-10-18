import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft, Download, Star, Lightbulb, Loader2 } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { generateInterviewPDF } from "@/lib/pdf-export";

interface Interview {
  id: string;
  role: string;
  type: string;
  difficulty: string;
  overall_score: number;
  performance_label: string;
  skills: { name: string; score: number }[];
  feedback: { title: string; text: string; type: string }[];
  duration_seconds: number;
  created_at: string;
}

const skillColors = ["bg-primary", "bg-secondary", "bg-accent", "bg-primary", "bg-secondary", "bg-accent"];

export default function InterviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", id!)
        .single();
      setInterview(data as unknown as Interview | null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Interview not found.</p>
      </div>
    );
  }

  const skills = (interview.skills || []).map((s, i) => ({ ...s, color: skillColors[i % skillColors.length] }));
  const feedback = interview.feedback || [];
  const radarData = skills.map((s) => ({ subject: s.name.split(" ")[0], score: s.score, fullMark: 100 }));

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">Prepzo</span>
          </Link>
          <div className="flex gap-3">
            <Link to="/dashboard">
              <Button variant="heroOutline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Dashboard</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => generateInterviewPDF(interview)}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {interview.type} · {interview.difficulty} · {new Date(interview.created_at).toLocaleDateString()}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground">{interview.role}</h1>
        </motion.div>

        {/* Overall Score */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-12 mt-8">
          <p className="text-muted-foreground text-sm font-medium mb-4 uppercase tracking-wider">Overall Performance</p>
          <div className="relative inline-flex items-center justify-center">
            <svg className="h-40 w-40" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted" />
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                strokeDasharray={`${(interview.overall_score / 100) * 339.3} 339.3`}
                strokeLinecap="round" className="stroke-primary" transform="rotate(-90 60 60)" />
            </svg>
            <div className="absolute">
              <span className="font-display text-4xl font-bold text-foreground">{interview.overall_score}</span>
              <span className="text-muted-foreground text-sm">/100</span>
            </div>
          </div>
          <p className="text-accent font-semibold mt-4">{interview.performance_label}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Radar */}
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
              {skills.map((s, i) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${s.color}`} />
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
            {feedback.map((f, i) => {
              const Icon = f.type === "strength" ? Star : Lightbulb;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }} className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${f.type === "strength" ? "bg-accent/10" : "bg-primary/10"}`}>
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
      </div>
    </div>
  );
}
