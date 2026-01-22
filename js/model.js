export const landingModel = {
  hero: {
    badgeDot: "●",
    badgeText: "launch kit: dummy v1",
    title: "Make a loud, fast demo page.",
    body:
      "A playful single-file mock landing page with bold typography, soft glass panels,\n      and just enough data to feel alive.",
    actions: [
      { label: "Start the tour →", href: "#", style: "primary" },
      { label: "Download brief", href: "#", style: "secondary" }
    ],
    snapshot: {
      title: "Snapshot",
      body: "Today's readout for the mythical product dashboard.",
      stats: [
        { value: "98%", label: "stability score" },
        { value: "12k", label: "daily pings" },
        { value: "4.2s", label: "median glow" }
      ]
    }
  },
  features: {
    title: "Dummy features",
    items: [
      {
        title: "Pulse-ready",
        body: "Designed for standups, demos, and quick internal previews."
      },
      {
        title: "Color field",
        body: "Warm gradients and glowing accents keep the mood confident."
      },
      {
        title: "Single file",
        body: "Drop it anywhere and ship a vibe without a build step."
      },
      {
        title: "Responsive",
        body: "Spacing and layout adapt for phones and wide screens."
      }
    ]
  },
  timeline: {
    title: "Launch timeline",
    items: [
      {
        day: "Day 01",
        title: "Sketch the idea.",
        body: "Capture the narrative and decide the demo story arc."
      },
      {
        day: "Day 02",
        title: "Style the deck.",
        body: "Pick palette, type, and gradients that feel intentional."
      },
      {
        day: "Day 03",
        title: "Share the build.",
        body: "Send the link and gather feedback with zero friction."
      }
    ]
  },
  cta: {
    title: "Ship the demo",
    body: "Replace the copy later. The structure is already ready for a real launch.",
    actions: [
      { label: "Open docs", href: "#", style: "secondary" },
      { label: "Publish now", href: "#", style: "primary" }
    ]
  },
  footer: {
    left: "Dummy Landing · 2026",
    right: "Made for quick previews and testing loops."
  }
};
