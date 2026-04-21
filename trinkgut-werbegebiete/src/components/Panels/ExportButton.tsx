import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Props {
  /** IDs der HTML-Elemente, die ins PDF sollen (in Reihenfolge) */
  targetIds: string[];
}

export function ExportButton({ targetIds }: Props): JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;

      let firstPage = true;
      for (const id of targetIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const canvas = await html2canvas(el, {
          backgroundColor: "#f4f2ec",
          scale: 2,
          useCORS: true,
          logging: false,
          ignoreElements: (node) => node.classList?.contains("no-export") ?? false,
        });
        const imgData = canvas.toDataURL("image/png");
        const ratio = canvas.width / canvas.height;
        let imgW = pageW - margin * 2;
        let imgH = imgW / ratio;
        if (imgH > pageH - margin * 2) {
          imgH = pageH - margin * 2;
          imgW = imgH * ratio;
        }
        if (!firstPage) pdf.addPage();
        firstPage = false;

        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
          `Trinkgut Jammers Goch · Werbegebiete-Report · ${new Date().toLocaleDateString("de-DE")}`,
          margin,
          margin - 2,
        );
        pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH, undefined, "FAST");
      }
      pdf.save(`trinkgut-werbegebiete-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={handleExport} disabled={busy} className="btn-ghost text-sm">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
        PDF-Export
      </button>
      {error && <span className="text-[11px] text-trinkgut">{error}</span>}
    </div>
  );
}
