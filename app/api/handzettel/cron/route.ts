import { isAuthorizedBearer } from "@/lib/cron-auth";
async function handler(request:Request) {
  const headers={"Cache-Control":"no-store"};
  if(request.method!=="GET"&&request.method!=="POST") return new Response(null,{status:405,headers:{...headers,Allow:"GET, POST"}});
  if(!process.env.CRON_SECRET) return Response.json({error:"Cron-Endpoint nicht konfiguriert (CRON_SECRET fehlt)."},{status:503,headers});
  if(!isAuthorizedBearer(request)) return Response.json({error:"Unauthorized"},{status:401,headers});
  return Response.json({error:"weekly-publication-required",message:"Automatische Einzeldatei-Aktualisierung ist gesperrt; ein geprüftes lokales Wochenpaket ist erforderlich."},{status:409,headers});
}

export const GET = handler;
export const POST = handler;
