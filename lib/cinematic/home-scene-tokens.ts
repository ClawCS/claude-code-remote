/** Additive art-direction tokens. Shared header, film and page tokens stay stable. */
export const HOME_SCENE_TOKENS = {
  color: {
    ink: "#202326", line: "#dce0e2", muted: "#595e62", red: "#c92330",
    entryShadow: "#2023261c", focus: "#2059b8", haze: "#ffffff26", fade: "#ffffffe3",
    quiet: "#687078", fineprint: "#626a70", offerStart: "#bd182a", offerMid: "#dc3341",
    offerEnd: "#e45158", offerShadow: "#6e0c211a", validity: "#60676d", notice: "#f0f3f5",
    strongFocus: "#142b55", silver: "#f0f3f4", forest: "#273d37", petrol: "#174861",
    wine: "#713848", slate: "#343b55", photoBase: "#dce2e5", brandBase: "#241a20",
    sceneVeil: "#21182061", sceneClear: "#21182033", sceneDark: "#211820e6",
    name: "#ffffffa6", bottleShadow: "#090607aa", flavor: "#f2eaf0", sceneTop: "#21182055",
    sceneBottom: "#211820d9", sceneSolid: "#211820", mobileName: "#ffffff73",
    brandIntro: "#251a20", brandIntroEnd: "#422430", brandEyebrow: "#edd7dc",
    blush: "#e99199", brandStory: "#f3e6eb", brandQuiet: "#e1cfd6", brandLine: "#ddbdc7",
    actionMuted: "#626970", socialSurface: "#e7edef",
  },
  typography: {
    size: {
      micro: ".7rem", meta: ".72rem", compact: ".8rem", action: ".85rem", link: ".9rem",
      supporting: "1.1rem", edition: "2.75rem", entryMobile: "2.35rem", visit: "2rem",
      entry: "clamp(2.1rem, 3.2vw, 3.2rem)", entryDesktop: "clamp(2rem, 3.05vw, 3.1rem)",
      service: "clamp(3rem, 6.8vw, 7rem)", serviceLead: "clamp(1.6rem, 2.5vw, 2.6rem)",
      serviceMobile: "clamp(2.6rem, 10vw, 4rem)", offers: "clamp(3.1rem, 6.4vw, 6.7rem)",
      flyer: "clamp(1.35rem, 2vw, 1.9rem)", assortment: "clamp(2.8rem, 5.6vw, 5.5rem)",
      category: "clamp(1.4rem, 2.2vw, 2.4rem)", categoryFeatured: "clamp(2rem, 3vw, 3.4rem)",
      categorySmall: "clamp(1.35rem, 2vw, 2rem)", stage: "clamp(4rem, 11vw, 11rem)",
      flavor: "clamp(1.1rem, 1.6vw, 1.55rem)", stageMobile: "3.7rem",
      brands: "clamp(3.2rem, 7vw, 7rem)", brandStory: "clamp(1rem, 1.5vw, 1.3rem)",
      actions: "clamp(2.8rem, 5.4vw, 5.5rem)", instagram: "clamp(2.1rem, 3.7vw, 3.8rem)",
    },
    lineHeight: { entry: ".98", compact: "1.45", edition: ".9", display: ".97", supporting: "1.1", flyer: "1.15", category: "1.05", stage: ".95", flavor: "1.4", brands: ".94", solid: "1" },
    tracking: { label: ".055em", display: "-.065em", eyebrow: ".1em", supporting: "-.04em", offers: ".09em", compact: "-.035em", validity: ".015em", stage: "-.075em", brand: ".12em", social: "-.055em" },
  },
  spacing: {
    mini: ".35rem", detail: ".6rem", discover: ".65rem", compact: ".8rem", entryGap: ".85rem",
    buttonY: ".9rem", panelX: "1.2rem", buttonX: "1.25rem", stagger: "1.6rem", entryX: "1.7rem",
    entryY: "2.4rem", chapterGap: "2.5rem", mobileTitle: "3.25rem", mobileChapter: "3.5rem", broad: "5rem",
  },
} as const;
