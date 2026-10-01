import { rentalDocumentHandler } from "@/lib/rental-orders/handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string; kind: string }> }) {
  const params = await context.params;
  return rentalDocumentHandler(request, params.id, params.kind, false);
}
