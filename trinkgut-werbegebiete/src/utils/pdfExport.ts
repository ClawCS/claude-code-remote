import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportNodeAsPdf(
  node: HTMLElement,
  filename = "werbegebiete.pdf",
) {
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f4f2ec",
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const today = new Date().toLocaleDateString("de-DE");
  pdf.setFontSize(10);
  pdf.setTextColor(106, 100, 88);
  pdf.text(
    `Trinkgut Jammers · Werbegebiete-Analyse · ${today}`,
    10,
    8,
  );

  let heightLeft = imgHeight;
  let position = 12;
  pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - position;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
