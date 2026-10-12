"use client";
import AcademyCover from "@/components/AcademyCover";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/learning.module.css";
import editorial from "@/components/editorial/editorial.module.css";

import { useParams, usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Course, QuizQuestion } from "@/data/akademie";
import { lessonHref } from "@/lib/academy-routes";
import { Suspense, useEffect, useState, type ReactNode } from "react";

export type CourseNavigation = Pick<Course, "slug" | "title" | "description" | "difficulty" | "duration" | "finalExam"> & {
  lessons: Pick<Course["lessons"][number], "title" | "quiz">[];
};

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

function QueryObserver({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString();
  useEffect(() => onChange(query), [query, onChange]);
  return null;
}

export default function CourseShell({ course, children }: { course: CourseNavigation; children: ReactNode }) {
  const [query, setQuery] = useState("");
  return <>
    {/* Only query observation may suspend during static rendering, never the lesson. */}
    <Suspense fallback={null}><QueryObserver onChange={setQuery} /></Suspense>
    <CourseBody course={course} query={query}>{children}</CourseBody>
  </>;
}

function CourseBody({ course, children, query }: { course: CourseNavigation; children: ReactNode; query: string }) {
  const params = useParams<{ lesson?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const routeKey = `${pathname}?${query}`;
  const [previousRoute, setPreviousRoute] = useState(routeKey);
  const activeLesson = params.lesson ? Number(params.lesson) - 1 : 0;
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [lessonQuizDone, setLessonQuizDone] = useState<Record<number, number>>({});
  const [examScore, setExamScore] = useState<number | null>(null);

  // The course layout persists; navigation resets only transient quiz/exam views.
  if (previousRoute !== routeKey) {
    setPreviousRoute(routeKey);
    setShowFinalExam(false);
    setExamScore(null);
  }

  const lesson = course.lessons[activeLesson];
  const completedLessons = Object.keys(lessonQuizDone).length;

  if (examScore !== null) {
    const totalFinal = course.finalExam.length;
    const percent = Math.round((examScore / totalFinal) * 100);
    const passed = examScore / totalFinal >= 0.7;
    return (
      <><PageIntro theme="learning" eyebrow="Abschlussprüfung" title={passed ? "Bestanden!" : "Nicht bestanden"} description={course.title} />
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
            <button onClick={() => {
              // Keep the result visible until navigation commits, avoiding a flash of
              // the previous lesson where a new exam could start and immediately reset.
              if (activeLesson === 0) { setExamScore(null); setShowFinalExam(false); }
              router.push(lessonHref(course.slug, 0));
            }} className={editorial.secondaryLink}>
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
      <><PageIntro theme="learning" eyebrow="Abschlussprüfung" title={`Abschlusstest: ${course.title}`} description={`${course.finalExam.length} Fragen — 70% zum Bestehen`} />
      <div data-learning="exam" className={`${styles.body} ${styles.exam}`}>
        <Quiz key={`${course.slug}:final`} questions={course.finalExam} onComplete={(s) => setExamScore(s)} />
      </div></>
    );
  }

  return (
    <>
      <PageIntro theme="learning" eyebrow="Getränkeakademie" title={course.title} description={`${course.difficulty} · ${course.duration} · ${course.lessons.length} Lektionen + Abschlusstest`} breadcrumbs={[{ label: "Start", href: "/" }, { label: "Akademie", href: "/akademie" }, { label: course.title, ...(activeLesson ? { href: lessonHref(course.slug, 0) } : {}) }, ...(activeLesson ? [{ label: lesson.title }] : [])]}>
        <a href="#course-lesson" className={editorial.secondaryLink}>Zur aktuellen Lektion</a>
      </PageIntro>
      <div data-learning="course" className={styles.body}>
        <div className={styles.courseLead}>
          <div className={styles.progress}>
            <p>{course.description}</p>
            <p>Lektion {activeLesson + 1} von {course.lessons.length} · {completedLessons} Quiz abgeschlossen</p>
            <div className={styles.progressSteps} role="group" aria-label="Lektionsfortschritt">
              {course.lessons.map((l, i) => <Link key={i} href={lessonHref(course.slug, i)} prefetch={false} aria-label={`Lektion ${i + 1}: ${l.title}`} aria-current={i === activeLesson ? "step" : undefined}>{i + 1}{lessonQuizDone[i] !== undefined && <span aria-label="abgeschlossen"> ✓</span>}</Link>)}
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
              <Link key={i} href={lessonHref(course.slug, i)} prefetch={false} aria-current={i === activeLesson ? "step" : undefined}>
                {lessonQuizDone[i] !== undefined ? <span className="text-xs mr-2" aria-label="abgeschlossen">✓</span> : <span className="text-xs mr-2">{i + 1}.</span>}
                <span>{l.title}</span>
              </Link>
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
          {children}

          {/* Lesson Quiz */}
          {lesson.quiz.length > 0 && (
            lessonQuizDone[activeLesson] !== undefined ? (
              <div role="status" className={`${editorial.notice} mt-6`}>
                Quiz abgeschlossen — {lessonQuizDone[activeLesson]}/{lesson.quiz.length} richtig
              </div>
            ) : (
              <Quiz key={routeKey} questions={lesson.quiz} onComplete={(s) => setLessonQuizDone((prev) => ({ ...prev, [activeLesson]: s }))} />
            )
          )}

          {/* Navigation */}
          <div className={styles.actions}>
            {activeLesson === 0 ? <button disabled className={editorial.secondaryLink}>Vorherige</button> : <Link href={lessonHref(course.slug, activeLesson - 1)} prefetch={false} className={editorial.secondaryLink}>Vorherige</Link>}
            {activeLesson < course.lessons.length - 1 ? (
              <Link href={lessonHref(course.slug, activeLesson + 1)} prefetch={false} className={editorial.primaryLink}>
                Nächste Lektion
              </Link>
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
