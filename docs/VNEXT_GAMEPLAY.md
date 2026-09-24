# Mangrove Ranger vNext — Coastal Economy + Realistic Mangrove Pass

## Target experience

The action game now has two complementary loops:

1. **Restoration expedition** — move through mud, tides and storms; clear debris, plant suitable mangroves, collect evidence and verify restoration.
2. **Community economy** — catch aquatic resources and gather renewable materials, return to the community workshop, craft products, sell them at the market and reinvest in field equipment.

The economy is deliberately fictionalized and simplified for gameplay. It is not fisheries management, food-safety guidance, ecological prescription or a real carbon-credit valuation model.

## Canonical gameplay contract

### Resource loop

explore → harvest/catch → cooldown → workshop crafting → market sale → equipment upgrade → explore deeper/faster

Aquatic nodes are gated by tide windows and cooldowns. Gathering nodes also have recovery cooldowns. This prevents rapid infinite harvesting at one spot and makes tide state relevant outside of planting.

### Raw materials

- crab — ปูแสม
- fish — ปลาชายเลน
- shell — หอยชายเลน
- shrimp — กุ้งน้ำกร่อย
- seaweed — สาหร่าย
- nipa — ใบจาก
- driftwood — เศษไม้ลอยน้ำ
- recycled — วัสดุรีไซเคิล
- seedpod — ฝัก/เมล็ดชายเลน

### Products

- Community Crab Basket
- Smoked Coastal Fish
- Shell Craft
- Community Restoration Kit
- Coastal Food Pack

Products are crafted only near the Community Workshop and sold only near the Coastal Market.

### Equipment progression

- **Net Kit** — increases aquatic catch yield.
- **Mud Boots** — reduces mud movement/stamina penalties.
- **Field Pack** — increases per-material carrying capacity.

Cosmetic Field Locker items remain cosmetic and do not grant gameplay stats.

## Save contract

Existing expedition key remains: mangrove-ranger-action-v1.

Serialized payload is upgraded from schema version 1 to 2. Version-1 expedition saves are accepted and receive a fresh default economy state. The wardrobe remains isolated in mangrove-ranger-outfit-v1.

## Tree visual contract

The procedural forest remains original geometry with no copied commercial assets or AI-generated imagery.

Species must read differently at gameplay distance:

### Rhizophora / โกงกาง
- dark brown bark
- strong arched prop/stilt roots
- dense glossy-looking canopy clusters
- medium-wide crown

### Avicennia / แสม
- paler grey bark
- many pneumatophores around the base
- higher and more open canopy
- lighter foliage palette

### Sonneratia / ลำพู
- broader lower trunk
- buttress-like lower roots plus breathing roots
- wider rounded canopy
- darker green foliage with broad lateral spread

Young planted trees use the same species language instead of one generic sapling silhouette.

## UI contract

- **B** opens Community Economy.
- Top HUD shows community coins.
- Economy panel shows raw inventory, recipes, product stock, equipment and current access to Workshop / Market.
- The panel may be inspected anywhere; crafting/upgrading requires proximity to Workshop, selling requires proximity to Market.
- Mobile layout keeps controls and primary actions within the viewport.

## Acceptance criteria

1. Existing restoration flow remains playable.
2. Legacy action saves load without losing restoration progress.
3. Resource nodes cannot be repeatedly harvested during cooldown.
4. Aquatic catches respect their configured tide window.
5. Crafting consumes the exact recipe and creates one product.
6. Selling consumes stock and increases community coins.
7. Upgrades spend coins once and have bounded levels.
8. Net, boots and pack upgrades each have a measurable gameplay effect.
9. Forest silhouettes visibly distinguish Rhizophora, Avicennia and Sonneratia.
10. Production build passes with no remote model/image runtime dependency.
