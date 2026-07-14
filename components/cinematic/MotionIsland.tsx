"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { CINEMATIC_TOKENS } from "@/lib/cinematic/tokens";

gsap.registerPlugin(ScrollTrigger);

const DESKTOP_QUERY = "(min-width: 64rem)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function setMotionDiagnostics(
  root: HTMLElement,
  motionState: "enhanced" | "reduced" | "static",
  controllerCount: number,
  triggerCount: number,
): void {
  Object.assign(root.dataset, {
    motionState,
    motionControllerCount: String(controllerCount),
    motionTriggerCount: String(triggerCount),
  });
}

export default function MotionIsland(): React.JSX.Element {
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root =
      anchorRef.current?.closest<HTMLElement>("[data-cinematic-root]") ??
      null;
    if (!root) return;

    const preference = window.matchMedia(REDUCED_MOTION_QUERY);
    let cleanupActiveController: (() => void) | null = null;

    const buildController = (): void => {
      cleanupActiveController?.();
      cleanupActiveController = null;

      if (preference.matches) {
        setMotionDiagnostics(root, "reduced", 0, 0);
        return;
      }

      const ownedTriggers = new Set<ScrollTrigger>();
      const desktopMedia = gsap.matchMedia(root);
      const syncEnhancedDiagnostics = (): void => {
        setMotionDiagnostics(root, "enhanced", 1, ownedTriggers.size);
      };
      const forgetTrigger = (trigger: ScrollTrigger): void => {
        ownedTriggers.delete(trigger);
        syncEnhancedDiagnostics();
      };
      const ownTrigger = (
        animation: gsap.core.Animation,
        localTriggers?: Set<ScrollTrigger>,
      ): void => {
        const trigger = animation.scrollTrigger;
        if (!trigger) return;

        ownedTriggers.add(trigger);
        localTriggers?.add(trigger);
        syncEnhancedDiagnostics();
      };

      const motionContext = gsap.context(() => {
        const runtime = CINEMATIC_TOKENS.motion.runtime;

        gsap.utils
          .toArray<HTMLElement>("[data-motion]", root)
          .forEach((element) => {
            const reveal = gsap.from(element, {
              autoAlpha: 0,
              duration: runtime.revealDurationSeconds,
              ease: CINEMATIC_TOKENS.motion.easing.entrance,
              scrollTrigger: {
                onKill: forgetTrigger,
                once: true,
                trigger: element,
                start: "top 88%",
              },
              y: runtime.revealDistancePx,
            });
            ownTrigger(reveal);
          });

        desktopMedia.add(DESKTOP_QUERY, () => {
          const desktopTriggers = new Set<ScrollTrigger>();
          const forgetDesktopTrigger = (trigger: ScrollTrigger): void => {
            desktopTriggers.delete(trigger);
            forgetTrigger(trigger);
          };

          gsap.utils
            .toArray<HTMLElement>("[data-parallax]", root)
            .forEach((element) => {
              const parallax = gsap.fromTo(
                element,
                { yPercent: -CINEMATIC_TOKENS.motion.runtime.parallaxTravelPercent },
                {
                  ease: "none",
                  scrollTrigger: {
                    end: "bottom top",
                    onKill: forgetDesktopTrigger,
                    scrub:
                      CINEMATIC_TOKENS.motion.runtime
                        .scrollScrubSeconds,
                    start: "top bottom",
                    trigger: element,
                  },
                  yPercent:
                    CINEMATIC_TOKENS.motion.runtime.parallaxTravelPercent,
                },
              );
              ownTrigger(parallax, desktopTriggers);
            });

          const section = root.querySelector<HTMLElement>(
            '[data-signature="cinematic"]',
          );
          const rail = root.querySelector<HTMLElement>(
            '[data-rail="cinematic"]',
          );
          if (section && rail) {
            const travel = (): number =>
              Math.max(0, rail.scrollWidth - section.clientWidth);
            const spotlight = gsap.to(rail, {
              ease: "none",
              scrollTrigger: {
                end: () => `+=${travel()}`,
                invalidateOnRefresh: true,
                onKill: forgetDesktopTrigger,
                pin: section,
                scrub:
                  CINEMATIC_TOKENS.motion.runtime.scrollScrubSeconds,
                start: "top top",
                trigger: section,
              },
              x: () => -travel(),
            });
            ownTrigger(spotlight, desktopTriggers);
          }

          return () => {
            for (const trigger of [...desktopTriggers]) trigger.kill();
            desktopTriggers.clear();
            syncEnhancedDiagnostics();
          };
        });
      }, root);

      syncEnhancedDiagnostics();

      cleanupActiveController = () => {
        desktopMedia.revert();
        motionContext.revert();
        for (const trigger of ownedTriggers) trigger.kill();
        ownedTriggers.clear();
        Object.assign(root.dataset, {
          motionState: "static",
          motionControllerCount: "0",
          motionTriggerCount: "0",
        });
      };
    };

    const handlePreferenceChange = (): void => {
      buildController();
    };

    buildController();
    preference.addEventListener("change", handlePreferenceChange);

    return () => {
      preference.removeEventListener("change", handlePreferenceChange);
      cleanupActiveController?.();
      cleanupActiveController = null;
      setMotionDiagnostics(root, "static", 0, 0);
    };
  }, []);

  return <span ref={anchorRef} hidden aria-hidden="true" />;
}
