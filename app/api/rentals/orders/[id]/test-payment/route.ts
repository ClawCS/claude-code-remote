import { rentalTestPayHandler } from "@/lib/rental-orders/handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return rentalTestPayHandler(request, params.id);
}
