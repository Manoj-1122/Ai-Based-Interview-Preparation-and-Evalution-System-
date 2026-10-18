import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, ChevronRight, Upload, FileText, X, Loader2, MessageSquare, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createResumeFallbackQuestions } from "@/lib/resumeFallbackQuestions";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MAX_RESUME_TEXT_LENGTH = 100_000;

async function extractResumeText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  let text: string;

  if (fileName.endsWith(".txt")) {
    text = await file.text();
  } else if (fileName.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser.js");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    text = result.value;
  } else {
    const [pdfjs, pdfWorker] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker.default;
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    }

    text = pages.join("\n");
  }

  const normalizedText = text.split(String.fromCharCode(0)).join("").replace(/[ \t]+\n/g, "\n").trim();
  if (normalizedText.length < 30) {
    throw new Error("No readable text was found. For scanned PDFs, run OCR and upload a searchable PDF.");
  }
  if (normalizedText.length > MAX_RESUME_TEXT_LENGTH) {
    throw new Error("This resume contains too much text. Please upload a shorter resume (under 100,000 characters).");
  }

  return normalizedText;
}

function isQuestionList(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.length === 5 &&
    value.every((question) => typeof question === "string" && question.trim().length > 0);
}

const roles = [
  { id: "swe", label: "Software Developer" },
  { id: "ds", label: "Data Scientist" },
  { id: "ai", label: "AI Engineer" },
  { id: "ux", label: "UX/UI Designer" },
  { id: "pm", label: "Product Manager" },
  { id: "devops", label: "DevOps Engineer" },
  { id: "qa", label: "QA Engineer" },
];

const difficulties = ["Beginner", "Intermediate", "Advanced"];
const types = [
  { id: "technical", label: "Technical", desc: "Code & system design questions" },
  { id: "hr", label: "HR", desc: "General HR & workplace questions" },
  { id: "resume", label: "Resume", desc: "Upload your resume to get tailored questions" },
  { id: "behavioral", label: "Behavioral", desc: "Situational & mock interview" },
];

export default function SetupPage() {
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileReadId = useRef(0);
  const navigate = useNavigate();

  const canStart = role && difficulty && type && (type !== "resume" || resumeText) && !isExtracting;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const readId = ++fileReadId.current;
    setIsExtracting(false);
    setResumeFile(null);
    setResumeText("");
    const fileName = file.name.toLowerCase();
    const hasValidExtension = [".pdf", ".txt", ".docx"].some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      toast.error("Please upload a PDF, DOCX, or TXT file. Legacy DOC files are not supported.");
      e.target.value = "";
      return;
    }
    if (file.size === 0 || file.size > MAX_RESUME_SIZE) {
      toast.error("File must be non-empty and under 5MB");
      e.target.value = "";
      return;
    }

    setIsExtracting(true);
    try {
      const extractedText = await extractResumeText(file);
      if (fileReadId.current !== readId) return;
      setResumeFile(file);
      setResumeText(extractedText);
    } catch (error) {
      if (fileReadId.current !== readId) return;
      console.error("Resume text extraction error:", error);
      toast.error(error instanceof Error ? error.message : "Could not read this resume.");
      e.target.value = "";
    } finally {
      if (fileReadId.current === readId) setIsExtracting(false);
    }
  };

  const removeFile = () => {
    fileReadId.current += 1;
    setResumeFile(null);
    setResumeText("");
    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startInterview = async (interviewMode: "chat" | "conversational") => {
    setShowModeDialog(false);
    const roleLabel = roles.find((r) => r.id === role)?.label || role;
    const modeParam = `&mode=${interviewMode}`;

    if (type === "resume" && resumeText) {
      setIsGenerating(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-resume-questions", {
          body: { resumeText, role: roleLabel, difficulty },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const questions: unknown = data?.questions;
        if (!isQuestionList(questions)) {
          throw new Error("The AI did not return five usable resume-based questions. Please try again.");
        }

        navigate(`/interview?role=${encodeURIComponent(roleLabel)}&difficulty=${encodeURIComponent(difficulty)}&type=${encodeURIComponent(type)}${modeParam}`, {
          state: { customQuestions: questions },
        });
      } catch (e) {
        console.error("Resume question generation error:", e);
        toast.info("Could not reach the resume AI service. Starting with questions tailored from your resume instead.");
        navigate(`/interview?role=${encodeURIComponent(roleLabel)}&difficulty=${encodeURIComponent(difficulty)}&type=${encodeURIComponent(type)}${modeParam}`, {
          state: { customQuestions: createResumeFallbackQuestions(resumeText, roleLabel) },
        });
      } finally {
        setIsGenerating(false);
      }
    } else {
      navigate(`/interview?role=${encodeURIComponent(roleLabel)}&difficulty=${encodeURIComponent(difficulty)}&type=${encodeURIComponent(type)}${modeParam}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-12 px-4 max-w-3xl pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-2">
          <p className="text-sm text-muted-foreground">
            <Link to="/learning" className="hover:text-primary">Resources</Link> / <span className="text-foreground font-medium">Practice Setup</span>
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Set Up Your Interview</h1>
          <p className="text-muted-foreground">Configure your interview session to get the most relevant questions.</p>
        </motion.div>

        {/* Role */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <h2 className="font-display font-semibold text-lg text-foreground mb-2 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" /> Job Role
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Select the role you're preparing to interview for.</p>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full glass-card rounded-xl h-12 text-sm">
              <SelectValue placeholder="Select a job role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Difficulty */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
          <h2 className="font-display font-semibold text-lg text-foreground mb-2">Difficulty Level</h2>
          <p className="text-xs text-muted-foreground mb-4">Beginner for freshers, Intermediate for 1-3 years, Advanced for seniors.</p>
          <div className="flex gap-3">
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`flex-1 glass-card rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 ${
                  difficulty === d ? "ring-2 ring-primary text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Type */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <h2 className="font-display font-semibold text-lg text-foreground mb-2">Interview Type</h2>
          <p className="text-xs text-muted-foreground mb-4">Choose the type of questions you want to practice.</p>
          <div className="grid gap-3">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  if (t.id !== "resume") {
                    removeFile();
                  }
                }}
                className={`glass-card rounded-xl p-4 text-left transition-all duration-200 ${
                  type === t.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                }`}
              >
                <p className="font-medium text-sm text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Resume Upload */}
        <AnimatePresence>
          {type === "resume" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Upload Your Resume
              </h2>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {isExtracting ? (
                <div className="w-full glass-card rounded-xl p-8 border-2 border-dashed border-primary/50 flex items-center justify-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-foreground">Reading resume and extracting text...</p>
                </div>
              ) : !resumeFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full glass-card rounded-xl p-8 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center gap-3"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to upload your resume</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT, max 5MB. Resume text is sent to AI for tailored questions.</p>
                  </div>
                </button>
              ) : (
                <div className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{resumeFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {type !== "resume" && <div className="mb-6" />}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button
            variant="hero"
            size="lg"
            className="w-full py-6 text-base"
            disabled={!canStart || isGenerating}
            onClick={() => setShowModeDialog(true)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Questions from Resume...
              </>
            ) : (
              <>
                Start Interview <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose interview mode</DialogTitle>
            <DialogDescription>Select how you want to practice this interview.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 pt-2">
            <button onClick={() => startInterview("chat")} className="glass-card rounded-xl p-4 text-left hover:ring-2 hover:ring-primary transition-all">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div><p className="font-medium">Chat-based interview</p><p className="text-sm text-muted-foreground">Type each answer and receive feedback.</p></div>
              </div>
            </button>
            <button onClick={() => startInterview("conversational")} className="glass-card rounded-xl p-4 text-left hover:ring-2 hover:ring-primary transition-all">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-primary" />
                <div><p className="font-medium">Conversational AI interview</p><p className="text-sm text-muted-foreground">Speak your answers and hear the interviewer.</p></div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
