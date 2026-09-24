# Mangrove Ranger

Dedicated Vercel-ready repository for the latest **Mangrove Ranger** third-person mangrove restoration game.

## Features
- Third-person 3D exploration, sprinting and jumping
- Mud, tides, storms, debris and environmental obstacles
- Mangrove planting, field evidence and MRV mission loop
- Detailed procedural ranger character
- **Field Locker** with 8 equipment slots, 27 cosmetic options, presets, skin tones, hairstyles and saved looks
- Desktop and touch controls
- Local browser save for expedition progress and appearance

## Run locally

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

This repository is a dedicated deployment copy derived from `saratchai1/game-sim` branch `feat/mangrove-ranger-action` at verified source revision `0e9f28690822aa5f29b80c5b92f1638c0021137b`.


## vNext branch

Branch `feat/gameplay-economy-and-realistic-trees` adds a replayable community-economy loop:

- tide-aware crab/fish/shellfish/shrimp catching
- renewable gathering nodes and cooldowns
- Community Workshop with 5 craftable products
- Coastal Market and Community Coins
- catch-kit, mud-boot and field-pack upgrades
- species-specific Rhizophora / Avicennia / Sonneratia procedural tree forms

Open the Community Economy panel with **B** while playing. See `docs/VNEXT_GAMEPLAY.md` for contracts and acceptance criteria.
