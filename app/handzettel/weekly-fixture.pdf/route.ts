import { PDFDocument, StandardFonts } from "pdf-lib";
import { fixtureEnabled } from "@/lib/cinematic/weekly-offer-fixture";
export async function GET() {
  if(!fixtureEnabled()) return new Response(null,{status:404});
  const pdf=await PDFDocument.create();const page=pdf.addPage([320,180]);const font=await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("Synthetic weekly fixture - no real offer",{x:10,y:90,size:12,font});
  return new Response(new Uint8Array(await pdf.save()),{headers:{"Content-Type":"application/pdf","Cache-Control":"no-store"}});
}
