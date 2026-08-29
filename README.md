# Language Hub — Hub of Language Excellence

A premium, scroll-driven one-page brand experience for **Language Hub** — an
English-language learning institute founded by **Ms. Javeria Malik**. The page
opens with a kinetic intro ("LANGUAGE → EXPRESSION → LANGUAGE HUB REAL"), then
moves through pinned, cinematic sections: the floating-word hero, the light-to-dark
transformation story, the four-stage learning journey, the About path, the
horizontal course gallery, the rotating 3D bookshelf reading room, the
expression/voice dark scenes, the Why-Hub concept wall, the founder section,
live opening hours, and the closing brand reveal.

## Stack

- Next.js 16 (webpack) + React 19 + TypeScript
- Tailwind CSS 4 (all tokens in `app/globals.css`)
- GSAP 3 + ScrollTrigger (pinned scenes, intro choreography)
- Framer Motion (scroll-linked scene progress, reveals, modals, cursor)
- Lenis (smooth scroll, synced to the GSAP ticker)
- Lucide React (icons)
- Fonts via `next/font`: Manrope (display), Inter (body), Playfair Display (accents)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

```bash
npm run build     # production build (webpack + typecheck)
npm run start     # serve the production build
npm run lint      # eslint
npm run typecheck # tsc --noEmit
npm test          # vitest unit suite (tests/)
```

## Notes

- Turbopack is disabled (dev/build use `--webpack`) because Turbopack's bundler
  cannot load the `lightningcss` native binary on this machine.
- `public/logo-transparent.png` is the official logo with its white background
  auto-removed (edge-feathered); `public/logo.jpg` is the untouched original.
- The intro respects `prefers-reduced-motion` and is skippable (click / key / wheel).
- Horizontal galleries (course gallery, bookshelf) measure their real track width
  so the last panel always lands flush — see `useHorizontalTrackX` in `lib/hooks.ts`.
- All content uses only real Language Hub facts — no fabricated stats, reviews,
  contact details, or pricing.