import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Check, ArrowLeft, BookOpen, Play } from "lucide-react";
import { learningPaths } from "@/data/learningPaths";
import { getPathContent } from "@/data/learningContent";
import { supabase } from "@/integrations/supabase/client";

export default function LearningDetailPage() {
  const { id } = useParams<{ id: string }>();
  const path = learningPaths.find((p) => p.id === id);
  const content = getPathContent(id || "");
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [totalLessons, setTotalLessons] = useState(0);

  useEffect(() => {
    if (!content) return;
    const total = content.modules.reduce((acc, m) => acc + m.topics.reduce((a, t) => a + t.lessons.length, 0), 0);
    setTotalLessons(total);

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid || !id) return;
      supabase
        .from("learning_progress")
        .select("topic_id")
        .eq("user_id", uid)
        .eq("path_id", id)
        .eq("completed", true)
        .then(({ data: progress }) => {
          if (progress) setCompletedTopics(new Set(progress.map((r) => r.topic_id)));
        });
    });
  }, [id, content]);

  const progressPct = totalLessons > 0 ? Math.round((completedTopics.size / totalLessons) * 100) : 0;

  if (!path) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Path not found.</p>
      </div>
    );
  }

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
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
            {" / "}
            <Link to="/learning" className="hover:text-foreground">Learning to Earning</Link>
            {" / "}
            <span className="text-foreground font-medium">{path.title}</span>
          </p>
        </motion.div>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-8 md:p-12 mb-10 flex flex-col md:flex-row items-center gap-8"
        >
          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">{path.description}</h1>
            <p className="text-muted-foreground text-sm mb-5">{path.detailedDescription}</p>
            <div className="flex items-center gap-4 text-sm text-foreground font-medium">
              <span>Coding Labs: 0</span>
              <span className="h-5 w-px bg-border" />
              <span>Total Courses: {path.courses}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {totalLessons > 0 && (
              <div className="w-40">
                <div className="flex justify-between text-xs text-foreground mb-1">
                  <span>Progress</span>
                  <span>{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
            )}
            <Link to={`/learning/${id}/content`}>
              <Button variant="hero" size="lg"><Play className="h-4 w-4 mr-2" />Start Learning</Button>
            </Link>
          </div>
        </motion.div>

        {/* Description + Outcomes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid md:grid-cols-2 gap-8 mb-10"
        >
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed">{path.detailedDescription}</p>
          </div>
          <div className="space-y-3">
            {path.outcomes.map((o) => (
              <div key={o} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                <span className="text-sm text-foreground">{o}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Course Modules */}
        {content && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-10"
          >
            <h2 className="font-display text-xl font-bold text-foreground mb-6">Course Curriculum</h2>
            <div className="space-y-4">
              {content.modules.map((mod, mi) => {
                const modLessons = mod.topics.flatMap((t) => t.lessons);
                const modCompleted = modLessons.filter((l) => {
                  const topic = mod.topics.find((t) => t.lessons.includes(l));
                  return topic && completedTopics.has(`${topic.id}/${l.id}`);
                }).length;
                return (
                  <div key={mod.id} className="glass-card rounded-xl overflow-hidden">
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {mi + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">{mod.title}</h3>
                          <p className="text-xs text-muted-foreground">{mod.topics.length} topics · {modLessons.length} lessons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{modCompleted}/{modLessons.length}</span>
                        <Progress value={modLessons.length > 0 ? (modCompleted / modLessons.length) * 100 : 0} className="w-20 h-2" />
                      </div>
                    </div>
                    <div className="border-t px-5 py-3 space-y-1">
                      {mod.topics.map((topic) => (
                        <div key={topic.id}>
                          {topic.lessons.map((lesson) => {
                            const isDone = completedTopics.has(`${topic.id}/${lesson.id}`);
                            return (
                              <Link
                                key={lesson.id}
                                to={`/learning/${id}/content?lesson=${lesson.id}`}
                                className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted transition-colors"
                              >
                                {isDone ? (
                                  <Check className="h-4 w-4 text-accent shrink-0" />
                                ) : (
                                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className={`text-xs ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                  {lesson.title}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Skills Covered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-8 md:p-12 mb-10"
          style={{ background: "var(--gradient-primary)" }}
        >
          <h2 className="font-display text-xl font-bold text-primary-foreground mb-8">Skills Covered</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-5">
            {path.skills.map((skill) => (
              <div key={skill} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary-foreground/80 shrink-0" />
                <span className="text-sm text-primary-foreground">{skill}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="text-center">
          <Link to="/learning">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to all paths
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
