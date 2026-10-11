/** Lesson one retains the established course URL. Indices are zero-based. */
export function lessonHref(courseSlug: string, index: number) {
  return index === 0 ? `/akademie/${courseSlug}` : `/akademie/${courseSlug}/lektion/${index + 1}`;
}

/** Only canonical decimal, 1-based IDs belonging to this course are accepted. */
export function parseLessonIndex(id: string, count: number): number | undefined {
  if (!/^[1-9]\d*$/.test(id)) return undefined;
  const number = Number(id);
  return Number.isSafeInteger(number) && number <= count ? number - 1 : undefined;
}
