"use client";
import AcademyCover from "@/components/AcademyCover";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/learning.module.css";
import editorial from "@/components/editorial/editorial.module.css";

import { useParams } from "next/navigation";
import Link from "next/link";
import { courses, type Course, type QuizQuestion } from "@/data/akademie";
import { useState } from "react";

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
    <section aria-label="Wissensquiz" className={styles.quiz}>
      <div className="flex items-center justify-between mb-4">
        <h2>Quiz — Frage {current + 1} von {questions.length}</h2>
        <span className="text-xs text-muted">{score}/{current + (showAnswer ? 1 : 0)} richtig</span>
      </div>

      <p className="font-medium text-secondary mb-4">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const state = !showAnswer ? undefined : i === q.correct ? "correct" : i === selected ? "wrong" : "inactive";

          return (
            <button key={i} onClick={() => handleSelect(i)} className={styles.answer} data-state={state} disabled={showAnswer}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <div role="status" className={styles.feedback}>
          <p className="font-medium mb-1">{selected === q.correct ? "Richtig!" : "Leider falsch."}</p>
          <p>{q.explanation}</p>
        </div>
      )}

      {showAnswer && (
        <button onClick={handleNext} className={editorial.primaryLink}>
          {current + 1 >= questions.length ? "Ergebnis anzeigen" : "Nächste Frage"}
        </button>
      )}
    </section>
  );
}

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const course = courses.find((c) => c.slug === slug);
  if (!course) {
    return (
      <><PageIntro title="Kurs nicht gefunden" eyebrow="Getränkeakademie" /><div data-learning="course" className={styles.body}><Link href="/akademie" className={editorial.secondaryLink}>Zurück zur Akademie</Link></div></>
    );
  }

  return <CourseBody key={course.slug} course={course} />;
}

function CourseBody({ course }: { course: Course }) {
  const [activeLesson, setActiveLesson] = useState(0);
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [lessonQuizDone, setLessonQuizDone] = useState<Record<number, number>>({});
  const [examScore, setExamScore] = useState<number | null>(null);

  const lesson = course.lessons[activeLesson];
  const completedLessons = Object.keys(lessonQuizDone).length;

  if (examScore !== null) {
    const totalFinal = course.finalExam.length;
    const percent = Math.round((examScore / totalFinal) * 100);
    const passed = examScore / totalFinal >= 0.7;
    return (
      <><PageIntro eyebrow="Abschlussprüfung" title={passed ? "Bestanden!" : "Nicht bestanden"} description={course.title} />
      <div data-learning="result" className={`${styles.body} ${styles.exam}`}>
        <div role="status" className={styles.result}>
        <p>
          {examScore} von {totalFinal} richtig ({percent}%)
        </p>
        <p className="text-sm text-muted mb-8">
          {passed
            ? `Du hast den Kurs "${course.title}" erfolgreich abgeschlossen!`
            : "Mindestens 70% richtig nötig. Schau dir die Lektionen nochmal an."}
        </p>
        </div>
        <div className={styles.actions}>
          {!passed && (
            <button onClick={() => { setExamScore(null); setShowFinalExam(false); setActiveLesson(0); }} className={editorial.secondaryLink}>
              Nochmal lernen
            </button>
          )}
          <Link href="/akademie" className={editorial.primaryLink}>
            Zur Akademie
          </Link>
        </div>
      </div></>
    );
  }

  if (showFinalExam) {
    return (
      <><PageIntro eyebrow="Abschlussprüfung" title={`Abschlusstest: ${course.title}`} description={`${course.finalExam.length} Fragen — 70% zum Bestehen`} />
      <div data-learning="exam" className={`${styles.body} ${styles.exam}`}>
        <Quiz key={`${course.slug}:final`} questions={course.finalExam} onComplete={(s) => setExamScore(s)} />
      </div></>
    );
  }

  return (
    <>
      <PageIntro eyebrow="Getränkeakademie" title={course.title} description={`${course.difficulty} · ${course.duration} · ${course.lessons.length} Lektionen + Abschlusstest`} breadcrumbs={[{ label: "Start", href: "/" }, { label: "Akademie", href: "/akademie" }, { label: course.title }]}>
        <a href="#course-lesson" className={editorial.secondaryLink}>Zur aktuellen Lektion</a>
      </PageIntro>
      <div data-learning="course" className={styles.body}>
        <div className={styles.courseLead}>
          <div className={styles.progress}>
            <p>{course.description}</p>
            <p>Lektion {activeLesson + 1} von {course.lessons.length} · {completedLessons} Quiz abgeschlossen</p>
            <div className={styles.progressSteps} aria-label="Lektionsfortschritt">
              {course.lessons.map((l, i) => <button key={i} onClick={() => setActiveLesson(i)} aria-label={`Lektion ${i + 1}: ${l.title}`} aria-current={i === activeLesson ? "step" : undefined}>{i + 1}{lessonQuizDone[i] !== undefined && <span aria-label="abgeschlossen"> ✓</span>}</button>)}
            </div>
          </div>
          <figure><AcademyCover slug={course.slug} /></figure>
        </div>
      <div className={styles.course}>
        {/* Sidebar */}
        <aside>
          <h2 className="font-semibold text-sm mb-3">Lektionen</h2>
          <nav aria-label="Kurslektionen" className={styles.navigation}>
            {course.lessons.map((l, i) => (
              <button key={i} onClick={() => setActiveLesson(i)} aria-current={i === activeLesson ? "step" : undefined}>
                {lessonQuizDone[i] !== undefined ? <span className="text-xs mr-2" aria-label="abgeschlossen">✓</span> : <span className="text-xs mr-2">{i + 1}.</span>}
                <span>{l.title}</span>
              </button>
            ))}
            <hr className="my-2 border-border" />
            <button
              onClick={() => completedLessons >= course.lessons.length ? setShowFinalExam(true) : null}
              disabled={completedLessons < course.lessons.length}
              className={styles.examButton}
            >
              Abschlusstest
              {completedLessons < course.lessons.length && <span className="block text-xs mt-1">Erst alle Quiz abschließen</span>}
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div>
          <section id="course-lesson" tabIndex={-1} className={styles.lesson} aria-label="Lektion">
            <h2 className="text-xl font-bold text-secondary mb-6">{lesson.title}</h2>
            <div className={styles.lessonText}>
              {lesson.content.split(/\n\n+/).map((block, index) => {
                const heading = block.match(/^(#{2,3}) (.+)$/);
                const text = heading ? heading[2] : block;
                const content = text.split("**").map((part, i) => i % 2 === 0
                  ? <span key={i}>{part}</span>
                  : <strong key={i} className="text-secondary font-semibold">{part}</strong>);
                if (heading?.[1] === "##") return <h3 key={index}>{text}</h3>;
                if (heading?.[1] === "###") return <h4 key={index}>{text}</h4>;
                return <p key={index}>{content}</p>;
              })}
            </div>
          </section>

          {/* Lesson Quiz */}
          {lesson.quiz.length > 0 && (
            lessonQuizDone[activeLesson] !== undefined ? (
              <div role="status" className={`${editorial.notice} mt-6`}>
                Quiz abgeschlossen — {lessonQuizDone[activeLesson]}/{lesson.quiz.length} richtig
              </div>
            ) : (
              <Quiz key={`${course.slug}:${activeLesson}`} questions={lesson.quiz} onComplete={(s) => setLessonQuizDone((prev) => ({ ...prev, [activeLesson]: s }))} />
            )
          )}

          {/* Navigation */}
          <div className={styles.actions}>
            <button
              onClick={() => setActiveLesson(Math.max(0, activeLesson - 1))}
              disabled={activeLesson === 0}
              className={editorial.secondaryLink}
            >
              Vorherige
            </button>
            {activeLesson < course.lessons.length - 1 ? (
              <button onClick={() => setActiveLesson(activeLesson + 1)} className={editorial.primaryLink}>
                Nächste Lektion
              </button>
            ) : completedLessons >= course.lessons.length ? (
              <button onClick={() => setShowFinalExam(true)} className={editorial.primaryLink}>
                Zum Abschlusstest
              </button>
            ) : (
              <span className="px-5 py-2.5 text-sm text-muted">Schließe erst alle Quiz ab</span>
            )}
          </div>
        </div>
      </div>
    </div></>
  );
}
