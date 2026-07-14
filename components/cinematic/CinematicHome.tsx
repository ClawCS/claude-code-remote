import styles from "@/app/home.module.css";
import type { HomepageContent } from "@/lib/homepage-content";
import { cinematicTokenStyle } from "@/lib/cinematic/tokens";

import ActionsSection from "./ActionsSection";
import CinematicHeader from "./CinematicHeader";
import CurrentSection from "./CurrentSection";
import HeroSection from "./HeroSection";
import InstagramSection from "./InstagramSection";
import LocationFooter from "./LocationFooter";
import MotionIsland from "./MotionIsland";
import PeopleSection from "./PeopleSection";
import ServiceSection from "./ServiceSection";
import SpotlightSection from "./SpotlightSection";

type CinematicHomeProps = Readonly<{
  content: HomepageContent;
  nowIso: string;
}>;

export default function CinematicHome({
  content,
  nowIso,
}: CinematicHomeProps): React.JSX.Element {
  const hasActions = Boolean(content.event || content.archive.length);

  return (
    <div
      className={styles.home}
      data-cinematic-root
      data-motion-state="static"
      data-motion-controller-count="0"
      data-motion-trigger-count="0"
      style={cinematicTokenStyle}
    >
      <a className={styles.skipLink} href="#main-content">
        Zum Hauptinhalt
      </a>
      <CinematicHeader nowIso={nowIso} hasActions={hasActions} />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <CurrentSection content={content} />
        <PeopleSection />
        <ServiceSection />
        <SpotlightSection />
        {hasActions ? (
          <ActionsSection archive={content.archive} event={content.event} />
        ) : null}
        <InstagramSection />
      </main>
      <LocationFooter />
      <MotionIsland />
    </div>
  );
}
