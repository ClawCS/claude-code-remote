import { rentalOutboxHandler } from "@/lib/rental-orders/handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = rentalOutboxHandler;
