# Backpack Bayern

Ein Backpack-Battles-Klon mit deutscher Themenwelt (Bayern, Schwarzwald) als mobile-first Web-Game, gehostet auf GitHub Pages.

**Live:** https://vanSerius.github.io/Backpack/ *(nach erstem erfolgreichen Deploy verfügbar)*

## Stack
- Phaser 3 (WebGL Game Engine)
- TypeScript (strict)
- Vite (Build)
- Vitest (Unit-Tests)

## Setup

```bash
npm install
npm run dev        # Dev-Server auf http://localhost:5173/Backpack/
npm run dev -- --host   # Im LAN, für echtes Handy-Testing
npm run build      # Produktiv-Build nach dist/
npm run preview    # Build lokal testen
npm test           # Unit-Tests
npm run typecheck  # TypeScript-Check
```

## Mobile-Testing

`npm run dev -- --host`, dann auf dem Handy im gleichen WLAN die angezeigte Netzwerk-URL öffnen (z.B. `http://192.168.x.x:5173/Backpack/`).

In Chrome DevTools: Device-Mode (Strg+Shift+M), Portrait, iPhone SE / Pixel 7 / iPad.

## Roadmap

- **Phase 1 (aktuell):** Spielbarer Vertical Slice — 1 Held, 10 Items, 3 Gegner, Backpack-Drag&Drop, Auto-Battle, GH-Pages-Deploy
- **Phase 2:** Shop + Map (Slay-the-Spire-Stil), Gold-Economy, weitere Helden
- **Phase 3:** Item-Fusion/Crafting mit Rezepten
- **Phase 4:** Multi-Region (Schwarzwald), Multi-Phase-Bosse, Edelstein-Currency, Unlock-Shop
- **Phase 5:** Achievements, Audio, Tutorial, Polish

## Deployment

Push auf `main` → GitHub Actions baut und deployt automatisch auf GitHub Pages.
Repo-Settings → Pages → Source: **GitHub Actions** (einmalig setzen).
