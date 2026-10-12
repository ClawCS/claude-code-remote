import { getContentReview } from "@/lib/content-reviews";
import styles from "@/components/editorial/learning.module.css";

export default function ContentSources({ id }: { id: string }) {
  const review = getContentReview(id);
  if (!review) return null;
  return <aside className={styles.sources} data-content-review={id} aria-label="Quellen und Stand">
    <details>
      <summary>Quellen &amp; Stand</summary>
      <p>Quellenabgleich: <time dateTime={review.reviewedAt}>{review.reviewedAt.split("-").reverse().join(".")}</time></p>
      <p>{review.scope}</p>
      <ul>{review.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher} · {source.title}</a></li>)}</ul>
    </details>
  </aside>;
}
