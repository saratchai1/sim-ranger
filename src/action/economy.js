// Sustainable gathering, crafting and community-market rules.
// Values are gameplay abstractions, not real fisheries, pricing or ecological guidance.
export const MATERIALS = {
  crab: { name: 'ปูแสม', icon: '🦀', color: '#d98455' },
  fish: { name: 'ปลาชายเลน', icon: '🐟', color: '#6fb8c9' },
  shell: { name: 'หอยชายเลน', icon: '🐚', color: '#d9c39a' },
  shrimp: { name: 'กุ้งน้ำกร่อย', icon: '🦐', color: '#e49c86' },
  seaweed: { name: 'สาหร่าย', icon: '🌿', color: '#6f9f66' },
  nipa: { name: 'ใบจาก', icon: '🍃', color: '#87a85c' },
  driftwood: { name: 'เศษไม้ลอยน้ำ', icon: '🪵', color: '#8f6d4c' },
  recycled: { name: 'วัสดุรีไซเคิล', icon: '♻️', color: '#7c9e91' },
  seedpod: { name: 'ฝัก/เมล็ดชายเลน', icon: '🌱', color: '#a3b468' },
}

export const PRODUCTS = {
  crabBasket: {
    name: 'ตะกร้าปูชุมชน', icon: '🧺', price: 96,
    recipe: { crab: 2, nipa: 1 }, description: 'ปูแสม + ใบจาก บรรจุเป็นสินค้าชุมชน',
  },
  smokedFish: {
    name: 'ปลารมควันชายฝั่ง', icon: '🔥', price: 78,
    recipe: { fish: 2, driftwood: 1 }, description: 'ปลา + เศษไม้แห้งสำหรับรมควัน',
  },
  shellCraft: {
    name: 'งานคราฟต์เปลือกหอย', icon: '🪸', price: 86,
    recipe: { shell: 3, recycled: 1 }, description: 'ของที่ระลึกจากวัสดุเก็บได้และรีไซเคิล',
  },
  restorationKit: {
    name: 'ชุดปลูกป่าชุมชน', icon: '🌱', price: 118,
    recipe: { seedpod: 2, nipa: 1, recycled: 1 }, description: 'ชุดสาธิตฟื้นฟูชายฝั่งสำหรับกิจกรรมชุมชน',
  },
  coastalPack: {
    name: 'แพ็กอาหารชายฝั่ง', icon: '🍱', price: 112,
    recipe: { shrimp: 2, seaweed: 2 }, description: 'ผลผลิตน้ำกร่อยและสาหร่ายในเกม',
  },
}

export const RESOURCE_NODES = [
  { id:'crab-creek', kind:'catch', material:'crab', x:-13.8, z:-6.8, name:'แนวปูแสม', action:'วางลอบปูแสม', duration:1.2, cooldown:20, tide:[0.2,0.62] },
  { id:'fish-channel', kind:'catch', material:'fish', x:-5.2, z:-16.2, name:'ร่องน้ำปลา', action:'ช้อนปลาชายเลน', duration:1.25, cooldown:18, tide:[0.36,0.8] },
  { id:'shell-flat', kind:'catch', material:'shell', x:9.8, z:-5.5, name:'สันเลนหอย', action:'เก็บหอยชายเลน', duration:1.0, cooldown:22, tide:[0.15,0.48] },
  { id:'shrimp-inlet', kind:'catch', material:'shrimp', x:7.4, z:-30.5, name:'แอ่งกุ้งน้ำกร่อย', action:'วางสวิงกุ้ง', duration:1.3, cooldown:22, tide:[0.42,0.82] },
  { id:'seaweed-edge', kind:'gather', material:'seaweed', x:11.8, z:-12.2, name:'แนวสาหร่าย', action:'เก็บสาหร่าย', duration:0.9, cooldown:16 },
  { id:'nipa-grove', kind:'gather', material:'nipa', x:-17.2, z:4.2, name:'กอจาก', action:'เก็บใบจากที่ร่วง', duration:0.85, cooldown:18 },
  { id:'driftwood-beach', kind:'gather', material:'driftwood', x:11.2, z:-35.2, name:'แนวเศษไม้', action:'เก็บเศษไม้ลอยน้ำ', duration:0.9, cooldown:18 },
  { id:'recycle-point', kind:'gather', material:'recycled', x:-1.2, z:-4.1, name:'จุดวัสดุใช้ซ้ำ', action:'คัดวัสดุรีไซเคิล', duration:0.85, cooldown:14 },
  { id:'seedpod-grove', kind:'gather', material:'seedpod', x:-15.5, z:-32.2, name:'แนวเมล็ดธรรมชาติ', action:'เก็บฝักที่ร่วงตามธรรมชาติ', duration:0.9, cooldown:20 },
]

export const WORKSHOP = { id:'workshop', x:-5.7, z:15.2, name:'โรงแปรรูปชุมชน' }
export const MARKET = { id:'market', x:7.3, z:15.0, name:'ตลาดชุมชน' }

export const UPGRADES = {
  net: { name:'ชุดจับสัตว์น้ำ', icon:'🥅', max:2, costs:[140,260], description:'เพิ่มผลผลิตจากจุดจับสัตว์น้ำ +1 ต่อระดับ' },
  boots: { name:'รองเท้าลุยเลน', icon:'🥾', max:2, costs:[120,220], description:'ลดโทษความเร็วและ stamina ในโคลน' },
  pack: { name:'กระเป๋าวัตถุดิบ', icon:'🎒', max:2, costs:[110,210], description:'เพิ่มความจุวัตถุดิบแต่ละชนิด' },
}

const zeroMap = (source) => Object.fromEntries(Object.keys(source).map(id => [id, 0]))
export function createEconomy() {
  return {
    coins: 120,
    materials: zeroMap(MATERIALS),
    products: zeroMap(PRODUCTS),
    harvests: {},
    upgrades: { net:0, boots:0, pack:0 },
    stats: { gathered:0, caught:0, crafted:0, sold:0, revenue:0 },
  }
}
export function materialCap(economy) { return 8 + (economy?.upgrades?.pack || 0) * 6 }
export function resourceBlock(economy, node, time, tideLevel) {
  const last = Number(economy?.harvests?.[node.id])
  if (Number.isFinite(last)) {
    const remaining = node.cooldown - (time - last)
    if (remaining > 0) return `ทรัพยากรกำลังฟื้นตัว · อีก ${Math.ceil(remaining)} วินาที`
  }
  if (node.tide && (tideLevel < node.tide[0] || tideLevel > node.tide[1])) {
    return node.kind === 'catch' ? 'ระดับน้ำยังไม่เหมาะกับการจับอย่างยั่งยืน' : 'ระดับน้ำยังไม่เหมาะ'
  }
  const cap = materialCap(economy)
  if ((economy?.materials?.[node.material] || 0) >= cap) return `กระเป๋า ${MATERIALS[node.material].name} เต็ม (${cap})`
  return null
}
export function harvestResource(economy, node, time, tideLevel) {
  const blocked = resourceBlock(economy, node, time, tideLevel)
  if (blocked) return { ok:false, message:blocked, amount:0 }
  const current = economy.materials[node.material] || 0
  const cap = materialCap(economy)
  const ideal = node.tide ? tideLevel >= node.tide[0] + .08 && tideLevel <= node.tide[1] - .08 : true
  const base = node.kind === 'catch' ? (ideal ? 2 : 1) : 1
  const toolBonus = node.kind === 'catch' ? (economy.upgrades.net || 0) : 0
  const amount = Math.max(0, Math.min(base + toolBonus, cap - current))
  if (!amount) return { ok:false, message:'กระเป๋าวัตถุดิบเต็ม', amount:0 }
  economy.materials[node.material] = current + amount
  economy.harvests[node.id] = time
  economy.stats[node.kind === 'catch' ? 'caught' : 'gathered'] += amount
  return { ok:true, amount, message:`${node.action}สำเร็จ · +${amount} ${MATERIALS[node.material].name}` }
}
export function canCraft(economy, productId) {
  const product = PRODUCTS[productId]
  if (!product) return false
  return Object.entries(product.recipe).every(([material, amount]) => (economy.materials[material] || 0) >= amount)
}
export function craftProduct(economy, productId) {
  const product = PRODUCTS[productId]
  if (!product) return { ok:false, message:'ไม่พบสูตรผลิตภัณฑ์' }
  if (!canCraft(economy, productId)) return { ok:false, message:`วัตถุดิบไม่พอสำหรับ ${product.name}` }
  for (const [material, amount] of Object.entries(product.recipe)) economy.materials[material] -= amount
  economy.products[productId] = (economy.products[productId] || 0) + 1
  economy.stats.crafted += 1
  return { ok:true, message:`ทำ ${product.name} สำเร็จ` }
}
export function sellProduct(economy, productId, quantity = 1) {
  const product = PRODUCTS[productId]
  if (!product) return { ok:false, message:'ไม่พบสินค้า' }
  const stock = economy.products[productId] || 0
  const count = quantity === 'all' ? stock : Math.min(stock, Math.max(1, Math.floor(quantity)))
  if (!count) return { ok:false, message:`ยังไม่มี ${product.name} สำหรับขาย` }
  const revenue = product.price * count
  economy.products[productId] -= count
  economy.coins += revenue
  economy.stats.sold += count
  economy.stats.revenue += revenue
  return { ok:true, revenue, message:`ขาย ${product.name} x${count} · +${revenue} เหรียญ` }
}
export function buyUpgrade(economy, upgradeId) {
  const item = UPGRADES[upgradeId], level = economy?.upgrades?.[upgradeId] || 0
  if (!item) return { ok:false, message:'ไม่พบอุปกรณ์' }
  if (level >= item.max) return { ok:false, message:`${item.name} ระดับสูงสุดแล้ว` }
  const cost = item.costs[level]
  if (economy.coins < cost) return { ok:false, message:`ต้องใช้ ${cost} เหรียญสำหรับ ${item.name}` }
  economy.coins -= cost
  economy.upgrades[upgradeId] = level + 1
  return { ok:true, message:`${item.name} อัปเกรดเป็น Lv.${level + 1}` }
}
export function mudSpeedMultiplier(economy) {
  return [0.42, 0.56, 0.68][Math.min(2, economy?.upgrades?.boots || 0)]
}
export function mudStaminaDrain(economy) {
  return [7, 4.5, 2.5][Math.min(2, economy?.upgrades?.boots || 0)]
}
export function normalizeEconomy(raw) {
  const fresh = createEconomy()
  if (!raw || typeof raw !== 'object') return fresh
  const finiteInt = (value, fallback=0, max=99999) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : fallback
  fresh.coins = finiteInt(raw.coins, 120, 999999)
  for (const id of Object.keys(MATERIALS)) fresh.materials[id] = finiteInt(raw.materials?.[id], 0, 99)
  for (const id of Object.keys(PRODUCTS)) fresh.products[id] = finiteInt(raw.products?.[id], 0, 99)
  for (const node of RESOURCE_NODES) {
    const value = raw.harvests?.[node.id]
    if (Number.isFinite(value) && value >= 0) fresh.harvests[node.id] = value
  }
  for (const id of Object.keys(UPGRADES)) fresh.upgrades[id] = Math.min(UPGRADES[id].max, finiteInt(raw.upgrades?.[id], 0, UPGRADES[id].max))
  for (const id of Object.keys(fresh.stats)) fresh.stats[id] = finiteInt(raw.stats?.[id], 0, 999999)
  return fresh
}
