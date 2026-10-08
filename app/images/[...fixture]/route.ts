import sharp from "sharp";
import { fixtureEnabled } from "@/lib/cinematic/weekly-offer-fixture";
export async function GET(_request:Request,{params}:{params:Promise<{fixture:string[]}>}) {
  const {fixture}=await params;
  if(!fixtureEnabled()||!["content/weekly-fixture.webp","offers/weekly-fixture.webp"].includes(fixture.join("/"))) return new Response(null,{status:404});
  const bytes=await sharp({create:{width:320,height:180,channels:3,background:"#ed7b21"}}).webp().toBuffer();
  return new Response(new Uint8Array(bytes),{headers:{"Content-Type":"image/webp","Cache-Control":"no-store"}});
}
