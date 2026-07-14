"use client";

import { useEffect, useState } from "react";

import { getMarketStatus } from "@/lib/cinematic/site";

import styles from "./chrome.module.css";

export default function LiveMarketStatus({
  initialNowIso,
}: {
  initialNowIso: string;
}): React.JSX.Element {
  const [status, setStatus] = useState(() =>
    getMarketStatus(new Date(initialNowIso)),
  );

  useEffect(() => {
    const refresh = () => setStatus(getMarketStatus(new Date()));
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span
      className={styles.status}
      aria-live="polite"
      aria-atomic="true"
      data-market-open={String(status.isOpen)}
    >
      {status.label}
    </span>
  );
}
