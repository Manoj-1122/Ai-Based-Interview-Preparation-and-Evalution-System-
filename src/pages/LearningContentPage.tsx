import { useParams, Link, useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Brain, ArrowLeft, ArrowRight, ChevronLeft, BookOpen, Check, Menu, X } from "lucide-react";
import { learningPaths } from "@/data/learningPaths";
import { getPathContent, type Lesson } from "@/data/learningContent";
import { supabase } from "@/integrations/supabase/client";
import LessonQuiz from "@/components/LessonQuiz";

export default function LearningContentPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const path = learningPaths.find((p) => p.id === id);
  const content = getPathContent(id || "");
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Build flat lesson list for navigation
  const allLessons = useMemo(() => {
    if (!content) return [];
    return content.modules.flatMap((m) =>
      m.topics.flatMap((t) =>
        t.lessons.map((l) => ({ ...l, topicId: t.id, topicTitle: t.title, moduleTitle: m.title }))
      )
    );
  }, [content]);

  const currentLessonId = searchParams.get("lesson") || allLessons[0]?.id;
  const currentIndex = allLessons.findIndex((l) => l.id === currentLessonId);
  const currentLesson = allLessons[currentIndex];

  // Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  // Load progress
  useEffect(() => {
    if (!userId || !id) return;
    supabase
      .from("learning_progress")
      .select("topic_id")
      .eq("user_id", userId)
      .eq("path_id", id)
      .eq("completed", true)
      .then(({ data }) => {
        if (data) setCompletedTopics(new Set(data.map((r) => r.topic_id)));
      });
  }, [userId, id]);

  const toggleComplete = async (topicId: string) => {
    if (!userId || !id) return;
    const isCompleted = completedTopics.has(topicId);
    const next = new Set(completedTopics);

    if (isCompleted) {
      next.delete(topicId);
      setCompletedTopics(next);
      await supabase
        .from("learning_progress")
        .delete()
        .eq("user_id", userId)
        .eq("path_id", id)
        .eq("topic_id", topicId);
    } else {
      next.add(topicId);
      setCompletedTopics(next);
      await supabase.from("learning_progress").upsert(
        { user_id: userId, path_id: id, topic_id: topicId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: "user_id,path_id,topic_id" }
      );
    }
  };

  const totalLessons = allLessons.length;
  const completedCount = completedTopics.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const navigateTo = (lessonId: string) => {
    setSearchParams({ lesson: lessonId });
  };

  if (!path || !content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Content not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <nav className="border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg gradient-bg flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-sm text-foreground hidden sm:inline">Prepzo</span>
            </Link>
            <span className="text-muted-foreground text-xs">/</span>
            <Link to={`/learning/${id}`} className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[150px]">
              {path.title}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>{progressPct}% complete</span>
              <Progress value={progressPct} className="w-24 h-2" />
            </div>
            <Link to={`/learning/${id}`}>
              <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4 mr-1" />Back</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72 min-w-[280px]' : 'w-0 min-w-0'} transition-all duration-200 border-r bg-card overflow-y-auto flex-shrink-0`}>
          {sidebarOpen && (
            <div className="p-4">
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Progress</p>
                <Progress value={progressPct} className="h-2 mb-1" />
                <p className="text-xs text-muted-foreground">{completedCount}/{totalLessons} lessons</p>
              </div>

              <Accordion type="multiple" defaultValue={content.modules.map((m) => m.id)}>
                {content.modules.map((mod) => (
                  <AccordionItem key={mod.id} value={mod.id} className="border-b-0">
                    <AccordionTrigger className="py-2 text-xs font-semibold text-foreground hover:no-underline">
                      {mod.title}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      {mod.topics.map((topic) => (
                        <div key={topic.id} className="mb-2">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">{topic.title}</p>
                          {topic.lessons.map((lesson) => {
                            const lessonKey = `${topic.id}/${lesson.id}`;
                            const isActive = lesson.id === currentLessonId;
                            const isDone = completedTopics.has(lessonKey);
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => navigateTo(lesson.id)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                                  isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-foreground hover:bg-muted"
                                }`}
                              >
                                {isDone ? (
                                  <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                                ) : (
                                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                <span className="truncate">{lesson.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <motion.div
              key={currentLesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto px-6 py-8"
            >
              {/* Breadcrumb */}
              <p className="text-xs text-muted-foreground mb-4">
                {currentLesson.moduleTitle} / {currentLesson.topicTitle}
              </p>

              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
                {currentLesson.title}
              </h1>

              {/* Content */}
              <div className="prose prose-sm max-w-none mb-8">
                {currentLesson.content.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm text-foreground/90 leading-relaxed mb-4">
                    {para.split("**").map((segment, j) =>
                      j % 2 === 1 ? <strong key={j}>{segment}</strong> : segment
                    )}
                  </p>
                ))}
              </div>

              {/* Code Example */}
              {currentLesson.codeExample && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center text-primary text-xs">{"</>"}</span>
                    Code Example
                  </h3>
                  <div className="rounded-xl bg-muted/50 border overflow-hidden">
                    <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
                      <code className="text-foreground/80">{currentLesson.codeExample}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Key Points */}
              {currentLesson.keyPoints && currentLesson.keyPoints.length > 0 && (
                <div className="mb-8 rounded-xl p-6" style={{ background: "var(--gradient-primary)" }}>
                  <h3 className="text-sm font-semibold text-primary-foreground mb-4">Key Takeaways</h3>
                  <ul className="space-y-2">
                    {currentLesson.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary-foreground/70" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quiz Section */}
              {currentLesson.quiz && currentLesson.quiz.length > 0 && (
                <div className="mb-8">
                  <LessonQuiz questions={currentLesson.quiz} lessonTitle={currentLesson.title} />
                </div>
              )}

              {/* Mark Complete + Navigation */}
              <div className="border-t pt-6 mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <Checkbox
                    checked={completedTopics.has(`${currentLesson.topicId}/${currentLesson.id}`)}
                    onCheckedChange={() => toggleComplete(`${currentLesson.topicId}/${currentLesson.id}`)}
                    id="mark-complete"
                  />
                  <label htmlFor="mark-complete" className="text-sm font-medium text-foreground cursor-pointer">
                    Mark as completed
                  </label>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentIndex <= 0}
                    onClick={() => currentIndex > 0 && navigateTo(allLessons[currentIndex - 1].id)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button
                    variant="hero"
                    size="sm"
                    disabled={currentIndex >= allLessons.length - 1}
                    onClick={() => {
                      // Auto-mark current as complete
                      const key = `${currentLesson.topicId}/${currentLesson.id}`;
                      if (!completedTopics.has(key)) toggleComplete(key);
                      if (currentIndex < allLessons.length - 1) navigateTo(allLessons[currentIndex + 1].id);
                    }}
                  >
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a lesson from the sidebar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
