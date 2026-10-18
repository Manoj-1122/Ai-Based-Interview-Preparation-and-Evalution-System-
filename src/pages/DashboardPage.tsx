import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Target, Clock, Award, BarChart3, Loader2, Eye, Download, BookOpen } from "lucide-react";
import type { InterviewData } from "@/lib/pdf-export";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";

interface Interview extends InterviewData {
  id: string;
  type: string;
  difficulty: string;
  duration_seconds: number;
  created_at: string;
}

export default function DashboardPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("interviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setInterviews((data as unknown as Interview[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalInterviews = interviews.length;
  const avgScore = totalInterviews
    ? Math.round(interviews.reduce((sum, i) => sum + i.overall_score, 0) / totalInterviews)
    : 0;
  const totalHours = (interviews.reduce((sum, i) => sum + (i.duration_seconds || 0), 0) / 3600).toFixed(1);
  const improvement = totalInterviews >= 2
    ? `${interviews[0].overall_score - interviews[interviews.length - 1].overall_score >= 0 ? "+" : ""}${interviews[0].overall_score - interviews[interviews.length - 1].overall_score}%`
    : "N/A";

  const stats = [
    { label: "Interviews", value: String(totalInterviews), icon: Target, change: totalInterviews > 0 ? "Total taken" : "None yet" },
    { label: "Avg Score", value: String(avgScore), icon: Award, change: `Out of 100` },
    { label: "Practice Hours", value: totalHours, icon: Clock, change: "Total time" },
    { label: "Improvement", value: improvement, icon: TrendingUp, change: "First → Latest" },
  ];

  // Trend data from actual interviews (oldest first)
  const trendData = [...interviews].reverse().map((i, idx) => ({
    date: `#${idx + 1}`,
    score: i.overall_score,
  }));

  // Aggregate skill data from most recent interview
  const latestSkills = interviews[0]?.skills || [];
  const skillData = latestSkills.map((s: { name: string; score: number }) => ({
    subject: s.name.split(" ")[0],
    score: s.score,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-8 px-4 max-w-6xl pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Track your interview preparation progress.</p>
        </motion.div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/setup">
            <Button variant="hero" size="sm"><Plus className="h-4 w-4 mr-1" /> Start New Practice</Button>
          </Link>
          <Link to="/learning">
            <Button variant="heroOutline" size="sm"><BookOpen className="h-4 w-4 mr-1" /> Continue Learning</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-accent font-medium">{s.change}</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {totalInterviews > 0 ? (
          <>
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Trend chart */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-semibold text-foreground">Performance Trend</h3>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Skills radar */}
              {skillData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
                  <h3 className="font-display font-semibold text-foreground mb-4">Latest Skills</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={skillData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </div>

            {/* Recent interviews */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Recent Interviews</h3>
              <div className="space-y-3">
                {interviews.slice(0, 10).map((interview) => (
                  <div key={interview.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{interview.role}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {interview.type} · {interview.difficulty} · {formatDistanceToNow(new Date(interview.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${interview.overall_score >= 80 ? "text-accent" : "text-primary"}`}>
                        {interview.overall_score}/100
                      </span>
                      <Link to={`/interview/${interview.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const { generateInterviewPDF } = await import("@/lib/pdf-export");
                          generateInterviewPDF(interview);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">No interviews yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Complete your first AI interview to see your results here.</p>
            <Link to="/setup">
              <Button variant="hero">Start Your First Interview</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
