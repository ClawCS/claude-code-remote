import { getFlyerIndex } from "@/lib/flyer-index";
import FlyerIndexView from "@/components/FlyerIndexView";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
export const dynamic = "force-dynamic";
export default async function AngebotePage() { return <FlyerIndexView index={await getFlyerIndex(resolveHomepageNow())}/>; }
