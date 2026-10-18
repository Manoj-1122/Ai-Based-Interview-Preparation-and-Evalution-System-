import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, Mic, MicOff, Send, Clock, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const questionsByRole: Record<string, Record<string, string[]>> = {
  "Software Developer": {
    technical: [
      "Explain the difference between REST and GraphQL APIs. When would you choose one over the other?",
      "How would you design a scalable microservices architecture for an e-commerce platform?",
      "What are the SOLID principles? Give an example of how you've applied one.",
      "Describe how you would optimize a slow database query in a production environment.",
      "What is your approach to writing unit tests and ensuring code quality?",
    ],
    hr: [
      "Tell me about yourself and your journey in software development.",
      "What is your greatest strength as a developer?",
      "Describe a time when you had a conflict with a team member. How did you resolve it?",
      "Where do you see yourself in 5 years?",
      "Why are you interested in this position?",
    ],
    behavioral: [
      "Tell me about a challenging project you worked on. What obstacles did you face?",
      "Describe a situation where you had to learn a new technology quickly.",
      "How do you handle tight deadlines and competing priorities?",
      "Give an example of when you received critical feedback. How did you respond?",
      "Describe a time you mentored or helped a junior developer.",
    ],
  },
  "Data Scientist": {
    technical: [
      "Explain the bias-variance tradeoff and how it affects model selection.",
      "How would you handle missing data in a large dataset?",
      "Compare and contrast supervised vs unsupervised learning with examples.",
      "Explain how a random forest works and when you'd use it over gradient boosting.",
      "How do you evaluate the performance of a classification model?",
    ],
    hr: [
      "Tell me about your background in data science.",
      "What motivates you to work in data science?",
      "Describe a data project you're most proud of.",
      "How do you communicate complex findings to non-technical stakeholders?",
      "What's your approach to continuous learning in this fast-evolving field?",
    ],
    behavioral: [
      "Describe a time when your data analysis led to a significant business decision.",
      "Tell me about a project where the data didn't support your initial hypothesis.",
      "How do you prioritize competing data requests from different teams?",
      "Describe a time you had to clean extremely messy data. What was your approach?",
      "Give an example of how you explained a complex model to a non-technical audience.",
    ],
  },
  "AI Engineer": {
    technical: [
      "Explain the transformer architecture and why it revolutionized NLP.",
      "How would you fine-tune a large language model for a specific domain?",
      "What are the key challenges in deploying ML models to production?",
      "Compare different approaches to handling class imbalance in training data.",
      "How do you evaluate and mitigate bias in AI systems?",
    ],
    hr: [
      "What drew you to AI engineering?",
      "How do you stay current with the rapidly evolving AI landscape?",
      "Describe your experience working with cross-functional teams.",
      "What ethical considerations do you think about when building AI systems?",
      "Where do you see the AI field heading in the next 5 years?",
    ],
    behavioral: [
      "Tell me about a time you had to optimize an ML model under strict latency constraints.",
      "Describe a situation where an AI model you deployed had unexpected behavior.",
      "How do you handle disagreements about model architecture choices within a team?",
      "Give an example of a time you had to balance model accuracy with computational cost.",
      "Describe your approach when a stakeholder requests an AI solution that isn't feasible.",
    ],
  },
  "UX/UI Designer": {
    technical: [
      "Walk me through your design process from research to final mockup.",
      "How do you approach responsive design across different device sizes?",
      "Explain the importance of accessibility in design and how you implement it.",
      "What tools do you use for prototyping and why?",
      "How do you measure the success of a design change?",
    ],
    hr: [
      "Tell me about your background in UX/UI design.",
      "What design trends excite you the most right now?",
      "How do you handle feedback that contradicts your design vision?",
      "What's your approach to collaborating with developers?",
      "Describe a design you're most proud of and why.",
    ],
    behavioral: [
      "Tell me about a time you had to advocate for the user against business requirements.",
      "Describe a project where user research changed your design direction significantly.",
      "How do you handle a situation where A/B test results surprise you?",
      "Give an example of designing under tight deadlines with limited resources.",
      "Describe a time you had to redesign a feature based on user feedback.",
    ],
  },
};

const difficultyQuestionAdditions: Record<string, string[]> = {
  Beginner: [
    "What are the basic concepts a beginner should know for this role?",
    "Describe a simple project that demonstrates your understanding of this role.",
    "What common beginner mistake should someone in this role avoid?",
    "How would you explain one important idea in this role to a non-technical person?",
    "What tools would you start with when learning this role?",
  ],
  Intermediate: [
    "Describe a production problem you would expect in this role and how you would investigate it.",
    "How would you balance quality, delivery time, and maintainability in this role?",
    "Tell me about a trade-off you would make on a project in this role.",
    "How would you measure whether your work in this role was successful?",
    "How would you improve an existing process related to this role?",
  ],
  Advanced: [
    "Design a strategy for solving a complex, ambiguous problem in this role at scale.",
    "How would you make a high-impact technical or product decision with incomplete data?",
    "Describe the risks you would review before leading a major initiative in this role.",
    "How would you mentor a team while maintaining high standards in this role?",
    "How would you evaluate competing architectures or approaches for a critical project?",
  ],
};

const shuffle = (items: string[]) => [...items].sort(() => Math.random() - 0.5);

const selectInterviewQuestions = (pool: string[], role: string, type: string, difficulty: string) => {
  const historyKey = `prepzo-question-history:${role}:${type}:${difficulty}`;
  const previous = JSON.parse(localStorage.getItem(historyKey) || "[]") as string[];
  const fresh = pool.filter((question) => !previous.includes(question));
  const source = fresh.length >= Math.min(5, pool.length) ? fresh : pool;
  const selected = shuffle(source).slice(0, Math.min(5, source.length));
  localStorage.setItem(historyKey, JSON.stringify(selected));
  return selected;
};

type Message = { role: "ai" | "user"; content: string };
type AnswerEvaluation = {
  matchScore: number;
  isCorrect: boolean;
  feedback: string;
};
type InterviewEvaluation = {
  overallScore?: number;
  performanceLabel?: string;
  skills?: unknown[];
  feedback?: unknown[];
};
type SpeechRecognitionResultEvent = Event & {
  results: {
    length: number;
    [index: number]: {
      length?: number;
      [index: number]: { transcript: string; confidence?: number };
    };
  };
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export default function InterviewPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const role = searchParams.get("role") || "Software Developer";
  const difficulty = searchParams.get("difficulty") || "Intermediate";
  const type = searchParams.get("type") || "technical";
  const interviewMode = searchParams.get("mode") || "chat";
  const isConversational = interviewMode === "conversational";

  const customQuestions = (location.state as { customQuestions?: unknown } | null)?.customQuestions;
  const questionPool = Array.isArray(customQuestions) && customQuestions.every((question): question is string => typeof question === "string")
    ? customQuestions
    : [
        ...(questionsByRole[role]?.[type] || questionsByRole["Software Developer"].technical),
        ...(difficultyQuestionAdditions[difficulty] || difficultyQuestionAdditions.Intermediate),
      ];
  const [questions] = useState<string[]>(() => selectInterviewQuestions(questionPool, role, type, difficulty));

  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: questions[0] },
  ]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [showSilencePrompt, setShowSilencePrompt] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const silenceTimerRef = useRef<number | null>(null);
  const submitAfterRecognitionEndRef = useRef(false);
  const startListeningRef = useRef<() => void>(() => undefined);
  const sendAnswerRef = useRef<(answer: string) => void>(() => undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => {
      clearInterval(interval);
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!isConversational || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
  }, [isConversational]);

  useEffect(() => {
    if (!isConversational) return;
    navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
      stream.getTracks().forEach((track) => track.stop());
      setMicReady(true);
    }).catch(() => toast.error("Microphone permission is required for conversational interviews."));
    return () => window.speechSynthesis?.cancel();
  }, [isConversational]);

  useEffect(() => {
    if (isConversational && micReady) speak(questions[0], () => startListeningRef.current());
  }, [isConversational, micReady, questions, speak]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const saveInterview = async (evaluation: InterviewEvaluation, allAnswers: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("interviews").insert({
        user_id: user.id,
        role,
        type,
        difficulty,
        overall_score: evaluation.overallScore ?? 0,
        performance_label: evaluation.performanceLabel ?? "N/A",
        skills: evaluation.skills ?? [],
        feedback: evaluation.feedback ?? [],
        questions,
        answers: allAnswers,
        duration_seconds: timer,
      });
    } catch (e) {
      console.error("Failed to save interview:", e);
    }
  };

  const handleEvaluate = async (allAnswers: string[]) => {
    setIsEvaluating(true);
    setMessages((prev) => [
      ...prev,
      { role: "ai", content: "Thank you! Evaluating your responses with AI..." },
    ]);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-interview", {
        body: {
          role,
          difficulty,
          type,
          questions,
          answers: allAnswers,
          totalTimeSeconds: timer,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await saveInterview(data, allAnswers);
      navigate("/results", { state: { evaluation: data } });
    } catch (e) {
      console.error("Evaluation error:", e);
      toast.error("Failed to evaluate. Showing sample results.");
      navigate("/results");
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluateAnswer = async (question: string, answer: string): Promise<AnswerEvaluation> => {
    const { data, error } = await supabase.functions.invoke("evaluate-interview", {
      body: { mode: "singleAnswer", role, difficulty, type, question, answer },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data as AnswerEvaluation;
  };

  const moveToNextQuestion = (nextIdx: number) => {
    setShowSilencePrompt(false);
    setMessages((prev) => [...prev, { role: "ai", content: questions[nextIdx] }]);
    setQuestionIndex(nextIdx);
    speak(questions[nextIdx], () => startListeningRef.current());
  };

  const handleSend = async (answerOverride?: string) => {
    const answer = (answerOverride ?? input).trim();
    if (!answer || isEvaluating) return;
    const userMsg: Message = { role: "user", content: answer };
    const newAnswers = [...answers, answer];
    const currentQuestion = questions[questionIndex];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsEvaluating(true);

    try {
      const evaluation = await evaluateAnswer(currentQuestion, answer);
      setAnswers(newAnswers);
      const matchLabel = evaluation.isCorrect ? "Good match" : "Needs improvement";
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `${matchLabel} (${Math.round(evaluation.matchScore)}%). ${evaluation.feedback}`,
        },
      ]);

      const nextIdx = questionIndex + 1;
      if (nextIdx < questions.length) {
        setTimeout(() => {
          moveToNextQuestion(nextIdx);
          setIsEvaluating(false);
        }, 800);
      } else {
        await handleEvaluate(newAnswers);
      }
    } catch (e) {
      console.error("Answer evaluation error:", e);
      setMessages((prev) => prev.slice(0, -1));
      setInput(answer);
      setIsEvaluating(false);
      toast.error("Could not evaluate this answer. Please try again; the next question will stay locked until feedback is available.");
    }
  };

  sendAnswerRef.current = (answer: string) => { void handleSend(answer); };

  const startListening = () => {
    if (!isConversational || isEvaluating || showSilencePrompt || isRecording) return;
    const SpeechRecognition = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Conversational interviews require Chrome or Edge speech recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    transcriptRef.current = "";
    submitAfterRecognitionEndRef.current = false;
    const scheduleSilencePrompt = () => {
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = window.setTimeout(() => {
        submitAfterRecognitionEndRef.current = true;
        recognition.stop();
        setIsRecording(false);
      }, 7000);
    };
    recognition.onresult = (event) => {
      transcriptRef.current = Array.from({ length: event.results.length }, (_, index) => {
        const result = event.results[index];
        const alternatives = Array.from({ length: result.length || 1 }, (_, alternativeIndex) => result[alternativeIndex]);
        return alternatives.reduce((best, alternative) => (
          (alternative?.confidence || 0) > (best?.confidence || 0) ? alternative : best
        ), alternatives[0])?.transcript || "";
      }).join(" ");
      scheduleSilencePrompt();
    };
    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Microphone input was not available. Please try again.");
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (!submitAfterRecognitionEndRef.current) return;
      submitAfterRecognitionEndRef.current = false;
      const answer = transcriptRef.current.trim();
      if (answer) {
        transcriptRef.current = "";
        sendAnswerRef.current(answer);
      } else {
        setShowSilencePrompt(true);
        speak("Are you still there? You can continue answering or choose to move to the next question.");
      }
    };
    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
    scheduleSilencePrompt();
  };

  startListeningRef.current = startListening;

  const handleVoiceToggle = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    startListening();
  };

  const handleSilenceNext = () => {
    const nextIdx = questionIndex + 1;
    if (nextIdx >= questions.length) {
      void handleEvaluate([...answers, ""]);
      return;
    }
    setAnswers((previous) => [...previous, ""]);
    moveToNextQuestion(nextIdx);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isConversational ? "bg-black text-white" : "bg-background"}`}>
      {/* Header */}
      <div className={`border-b ${isConversational ? "border-white/10 bg-black" : ""}`}>
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Exit
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg gradient-bg flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className={`font-display font-bold ${isConversational ? "text-white" : "text-foreground"}`}>Prepzo</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> {formatTime(timer)}
            </div>
            <div className="text-sm font-medium text-foreground">
              Question {Math.min(questionIndex + 1, questions.length)}/{questions.length}
            </div>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-bg rounded-full transition-all duration-500"
                style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 overflow-y-auto py-6 px-4 ${isConversational ? "bg-black" : ""}`}>
        <div className="container mx-auto max-w-2xl space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "gradient-bg text-primary-foreground"
                      : isConversational ? "border border-white/10 bg-white/5 text-white" : "glass-card text-foreground"
                  }`}
                >
                  {msg.role === "ai" && (
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Interviewer</span>
                    </div>
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isEvaluating && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm">AI is evaluating your responses...</span>
              </div>
            </motion.div>
          )}
          {isConversational && !isEvaluating && (
            <div className="min-h-[45vh] flex flex-col items-center justify-center text-center gap-5">
              <div className={`h-24 w-24 rounded-full border-2 flex items-center justify-center ${isRecording ? "border-primary shadow-[0_0_45px_rgba(99,102,241,0.7)]" : "border-white/20"}`}>
                <Mic className={`h-10 w-10 ${isRecording ? "text-primary animate-pulse" : "text-white/60"}`} />
              </div>
              <p className="text-white/60 text-sm">{isRecording ? "Listening to your answer..." : micReady ? "Your answer will be heard when you speak." : "Waiting for microphone permission..."}</p>
              {showSilencePrompt && (
                <div className="flex flex-wrap justify-center gap-3">
                  <Button variant="outline" onClick={() => { setShowSilencePrompt(false); speak("Please continue your answer.", () => startListeningRef.current()); }}>
                    Continue answering
                  </Button>
                  <Button variant="hero" onClick={handleSilenceNext}>
                    Next question
                  </Button>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className={`border-t ${isConversational ? "border-white/10 bg-black" : "bg-background"}`}>
        <div className="container mx-auto max-w-2xl py-4 px-4">
          <div className="flex items-end gap-3">
            {isConversational && (
              <button
                onClick={handleVoiceToggle}
                disabled={isEvaluating}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-destructive text-destructive-foreground animate-pulse-glow"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            {!isConversational && <div className="flex-1 glass-card rounded-xl overflow-hidden">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
                }
                placeholder={isEvaluating ? "Evaluating..." : isConversational ? "Speak or type your answer..." : "Type your answer..."}
                rows={2}
                disabled={isEvaluating}
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              />
            </div>}
            {!isConversational && <Button
              variant="hero"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleSend}
              disabled={!input.trim() || isEvaluating}
            >
              <Send className="h-4 w-4" />
            </Button>}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Interview?</DialogTitle>
            <DialogDescription>
              Your progress will be lost. Are you sure you want to go back to the dashboard?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              Continue Interview
            </Button>
            <Button variant="destructive" onClick={() => navigate("/dashboard")}>
              Exit to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
