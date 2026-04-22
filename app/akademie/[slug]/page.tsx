"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { courses, type QuizQuestion } from "@/data/akademie";
import { useState } from "react";
import ShimmerParticles from "@/components/ShimmerParticles";

function Quiz({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: (score: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const q = questions[current];

  const handleSelect = (idx: number) => {
    if (showAnswer) return;
    setSelected(idx);
    setShowAnswer(true);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      onComplete(score);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setShowAnswer(false);
  };

  return (
    <div className="bg-light border border-border rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-secondary text-sm">Quiz — Frage {current + 1} von {questions.length}</h3>
        <span className="text-xs text-muted">{score}/{current + (showAnswer ? 1 : 0)} richtig</span>
      </div>

      <p className="font-medium text-secondary mb-4">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = "w-full text-left p-3 rounded-lg border-2 text-sm transition-all ";
          if (!showAnswer) {
            cls += "border-border hover:border-primary hover:bg-red-50 cursor-pointer";
          } else if (i === q.correct) {
            cls += "border-green-500 bg-green-50 text-green-800 font-medium";
          } else if (i === selected && i !== q.correct) {
            cls += "border-red-500 bg-red-50 text-red-800";
          } else {
            cls += "border-border opacity-50";
          }

          return (
            <button key={i} onClick={() => handleSelect(i)} className={cls} disabled={showAnswer}>
              <span className="font-bold mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${selected === q.correct ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
          <p className="font-medium mb-1">{selected === q.correct ? "✓ Richtig!" : "✗ Leider falsch."}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      {showAnswer && (
        <button onClick={handleNext} className="mt-4 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors text-sm">
          {current + 1 >= questions.length ? "Ergebnis anzeigen" : "Nächste Frage →"}
        </button>
      )}
    </div>
  );
}

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const course = courses.find((c) => c.slug === slug);
  const [activeLesson, setActiveLesson] = useState(0);
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [lessonQuizDone, setLessonQuizDone] = useState<Record<number, number>>({});
  const [examScore, setExamScore] = useState<number | null>(null);

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-5xl mb-4">😕</p>
        <h1 className="text-2xl font-bold text-secondary mb-2">Kurs nicht gefunden</h1>
        <Link href="/akademie" className="text-primary hover:underline">Zurück zur Akademie</Link>
      </div>
    );
  }

  const lesson = course.lessons[activeLesson];
  const totalQuizQuestions = course.lessons.reduce((sum, l) => sum + l.quiz.length, 0) + course.finalExam.length;
  const completedLessons = Object.keys(lessonQuizDone).length;

  if (examScore !== null) {
    const totalFinal = course.finalExam.length;
    const percent = Math.round((examScore / totalFinal) * 100);
    const passed = percent >= 70;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <span className="text-6xl block mb-4">{passed ? "🎓" : "📚"}</span>
        <h1 className="text-3xl font-bold text-secondary mb-2">
          {passed ? "Bestanden!" : "Nicht bestanden"}
        </h1>
        <p className="text-lg text-muted mb-2">
          {examScore} von {totalFinal} richtig ({percent}%)
        </p>
        <p className="text-sm text-muted mb-8">
          {passed
            ? `Du hast den Kurs "${course.title}" erfolgreich abgeschlossen!`
            : "Mindestens 70% richtig nötig. Schau dir die Lektionen nochmal an."}
        </p>
        <div className="flex gap-3 justify-center">
          {!passed && (
            <button onClick={() => { setExamScore(null); setShowFinalExam(false); setActiveLesson(0); }} className="px-6 py-3 border border-border text-muted hover:border-primary rounded-xl">
              Nochmal lernen
            </button>
          )}
          <Link href="/akademie" className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors">
            Zur Akademie
          </Link>
        </div>
      </div>
    );
  }

  if (showFinalExam) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className={`bg-gradient-to-br ${course.color} rounded-2xl p-8 text-white mb-8 text-center`}>
          <span className="text-5xl block mb-3">📝</span>
          <h1 className="text-2xl font-bold">Abschlusstest: {course.title}</h1>
          <p className="text-white/70 mt-1">{course.finalExam.length} Fragen — 70% zum Bestehen</p>
        </div>
        <Quiz questions={course.finalExam} onComplete={(s) => setExamScore(s)} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-sm text-muted mb-6 flex gap-2">
        <Link href="/" className="hover:text-primary">Start</Link><span>/</span>
        <Link href="/akademie" className="hover:text-primary">Akademie</Link><span>/</span>
        <span className="text-secondary">{course.title}</span>
      </nav>

      {/* Course Header */}
      <div className={`bg-gradient-to-br ${course.color} rounded-2xl p-6 text-white mb-8 relative overflow-hidden`}>
        <ShimmerParticles count={16} />
        <div className="relative flex items-center gap-4 mb-4">
          <span className="text-4xl">{course.icon}</span>
          <div>
            <h1 className="text-2xl font-extrabold">{course.title}</h1>
            <div className="flex gap-3 mt-1 text-sm text-white/60">
              <span>{course.difficulty}</span>
              <span>·</span>
              <span>{course.duration}</span>
              <span>·</span>
              <span>{course.lessons.length} Lektionen + Abschlusstest</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {course.lessons.map((_, i) => (
            <button key={i} onClick={() => setActiveLesson(i)} className={`h-2 flex-1 rounded-full transition-colors ${i === activeLesson ? "bg-white" : lessonQuizDone[i] !== undefined ? "bg-white/60" : "bg-white/20"}`} />
          ))}
          <div className={`h-2 w-8 rounded-full ${showFinalExam ? "bg-white" : "bg-white/20"}`} />
        </div>
        <p className="text-xs text-white/40 mt-2">Lektion {activeLesson + 1} von {course.lessons.length} · {completedLessons} Quiz bestanden</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-secondary text-sm mb-3">Lektionen</h3>
          <nav className="space-y-1">
            {course.lessons.map((l, i) => (
              <button key={i} onClick={() => setActiveLesson(i)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${i === activeLesson ? "bg-primary text-white font-medium" : "text-muted hover:bg-light hover:text-secondary"}`}>
                {lessonQuizDone[i] !== undefined ? <span className="text-green-500 text-xs">✓</span> : <span className="opacity-30 text-xs">{i + 1}.</span>}
                <span className="truncate">{l.title}</span>
              </button>
            ))}
            <hr className="my-2 border-border" />
            <button
              onClick={() => completedLessons >= course.lessons.length ? setShowFinalExam(true) : null}
              disabled={completedLessons < course.lessons.length}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${completedLessons >= course.lessons.length ? "text-primary hover:bg-red-50 cursor-pointer" : "text-muted/30 cursor-not-allowed"}`}
            >
              📝 Abschlusstest
              {completedLessons < course.lessons.length && <span className="block text-xs opacity-50">Erst alle Quiz bestehen</span>}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-border rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-secondary mb-6">{lesson.title}</h2>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {lesson.content.split("**").map((part, i) =>
                i % 2 === 0 ? <span key={i}>{part}</span> : <strong key={i} className="text-secondary font-semibold">{part}</strong>
              )}
            </div>
          </div>

          {/* Lesson Quiz */}
          {lesson.quiz.length > 0 && (
            lessonQuizDone[activeLesson] !== undefined ? (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                ✓ Quiz bestanden — {lessonQuizDone[activeLesson]}/{lesson.quiz.length} richtig
              </div>
            ) : (
              <Quiz questions={lesson.quiz} onComplete={(s) => setLessonQuizDone((prev) => ({ ...prev, [activeLesson]: s }))} />
            )
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setActiveLesson(Math.max(0, activeLesson - 1))}
              disabled={activeLesson === 0}
              className="px-5 py-2.5 border border-border text-muted hover:border-primary hover:text-primary rounded-xl transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Vorherige
            </button>
            {activeLesson < course.lessons.length - 1 ? (
              <button onClick={() => setActiveLesson(activeLesson + 1)} className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors text-sm">
                Nächste Lektion →
              </button>
            ) : completedLessons >= course.lessons.length ? (
              <button onClick={() => setShowFinalExam(true)} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors text-sm">
                📝 Zum Abschlusstest
              </button>
            ) : (
              <span className="px-5 py-2.5 text-sm text-muted">Bestehe erst alle Quiz</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
