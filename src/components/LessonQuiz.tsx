import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Trophy, Lightbulb } from "lucide-react";
import type { QuizQuestion } from "@/data/learningContent";

interface LessonQuizProps {
  questions: QuizQuestion[];
  lessonTitle: string;
}

export default function LessonQuiz({ questions, lessonTitle }: LessonQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));

  const q = questions[currentQ];
  const isCorrect = selected === q?.correctIndex;

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
  };

  const handleSubmit = () => {
    if (selected === null) return;
    setAnswered(true);
    const newAnswers = [...answers];
    newAnswers[currentQ] = selected;
    setAnswers(newAnswers);
    if (selected === q.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
    setAnswers(new Array(questions.length).fill(null));
  };

  const scorePct = Math.round((score / questions.length) * 100);

  if (finished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border bg-card p-6 text-center"
      >
        <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4 ${scorePct >= 70 ? 'bg-accent/20' : 'bg-destructive/10'}`}>
          <Trophy className={`h-8 w-8 ${scorePct >= 70 ? 'text-accent' : 'text-destructive'}`} />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-2">Quiz Complete!</h3>
        <p className="text-3xl font-bold text-primary mb-1">{score}/{questions.length}</p>
        <p className="text-sm text-muted-foreground mb-6">
          {scorePct >= 90 ? "Outstanding! You've mastered this lesson." :
           scorePct >= 70 ? "Great job! You have a solid understanding." :
           scorePct >= 50 ? "Good effort! Review the lesson to improve." :
           "Keep practicing! Re-read the lesson and try again."}
        </p>

        {/* Answer summary */}
        <div className="grid gap-2 mb-6 text-left">
          {questions.map((question, i) => {
            const userAnswer = answers[i];
            const correct = userAnswer === question.correctIndex;
            return (
              <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${correct ? 'bg-accent/10' : 'bg-destructive/5'}`}>
                {correct ? <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" /> : <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium text-foreground">{question.question}</p>
                  {!correct && (
                    <p className="text-muted-foreground mt-0.5">
                      Correct: {question.options[question.correctIndex]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Button variant="heroOutline" size="sm" onClick={handleRetry}>
          <RotateCcw className="h-4 w-4 mr-1" /> Retry Quiz
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Practice Quiz</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="px-5 pt-4 flex gap-1.5">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < currentQ ? (answers[i] === questions[i].correctIndex ? 'bg-accent' : 'bg-destructive/50') :
              i === currentQ ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-medium text-foreground mb-4">{q.question}</p>

            <div className="space-y-2 mb-5">
              {q.options.map((option, i) => {
                let optionStyle = "border-border hover:border-primary/50 hover:bg-primary/5";
                if (answered) {
                  if (i === q.correctIndex) optionStyle = "border-accent bg-accent/10";
                  else if (i === selected) optionStyle = "border-destructive bg-destructive/5";
                  else optionStyle = "border-border opacity-50";
                } else if (i === selected) {
                  optionStyle = "border-primary bg-primary/5 ring-1 ring-primary/20";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${optionStyle}`}
                  >
                    <span className={`h-6 w-6 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 ${
                      answered && i === q.correctIndex ? 'bg-accent text-accent-foreground border-accent' :
                      answered && i === selected ? 'bg-destructive text-destructive-foreground border-destructive' :
                      i === selected ? 'bg-primary text-primary-foreground border-primary' :
                      'border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      {answered && i === q.correctIndex ? <Check className="h-3.5 w-3.5" /> :
                       answered && i === selected ? <X className="h-3.5 w-3.5" /> :
                       String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-foreground">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg mb-4 text-xs ${isCorrect ? 'bg-accent/10 border border-accent/20' : 'bg-destructive/5 border border-destructive/10'}`}
              >
                <p className={`font-medium mb-1 ${isCorrect ? 'text-accent' : 'text-destructive'}`}>
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                <p className="text-foreground/80">{q.explanation}</p>
              </motion.div>
            )}

            <div className="flex justify-end gap-2">
              {!answered ? (
                <Button variant="hero" size="sm" disabled={selected === null} onClick={handleSubmit}>
                  Check Answer
                </Button>
              ) : (
                <Button variant="hero" size="sm" onClick={handleNext}>
                  {currentQ < questions.length - 1 ? "Next Question" : "See Results"}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
