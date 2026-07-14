import CinematicHome from "@/components/cinematic/CinematicHome";
import { HOMEPAGE_METADATA } from "@/lib/cinematic/metadata";
import { resolveHomepageNow } from "@/lib/cinematic/server-clock";
import { getHomepageContent } from "@/lib/homepage-content";

export const metadata = HOMEPAGE_METADATA;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const now = resolveHomepageNow();
  const content = await getHomepageContent(now);
  return <CinematicHome content={content} nowIso={now.toISOString()} />;
}
