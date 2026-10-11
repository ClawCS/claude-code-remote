/** Decorative line icon: unlike a Unicode arrow, never becomes an emoji on iOS. */
export default function ArrowUpRight({ className }: { className?: string }) {
  return <svg aria-hidden="true" focusable="false" data-arrow-icon="up-right" className={className} width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", flexShrink: 0, verticalAlign: "-.12em" }}><path d="M5 19 19 5M5 5h14v14" /></svg>;
}
