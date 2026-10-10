"use client";
import styles from "@/components/editorial/tools.module.css";

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.search}>
      Aktuelle Angebote durchsuchen
      <input
        type="text"
        placeholder="Produkt suchen..."
        aria-label="Aktuelle Angebote durchsuchen"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
