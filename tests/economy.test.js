import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createEconomy, RESOURCE_NODES, PRODUCTS, materialCap, resourceBlock, harvestResource,
  craftProduct, sellProduct, buyUpgrade, mudSpeedMultiplier, normalizeEconomy,
} from '../src/action/economy.js'
import { createState, restore, serialize } from '../src/action/simulation.js'

test('resource nodes respect tide, cooldown and capacity', () => {
  const e=createEconomy(), crab=RESOURCE_NODES.find(n=>n.material==='crab')
  assert.match(resourceBlock(e,crab,0,.9),/ระดับน้ำ/)
  assert.equal(resourceBlock(e,crab,0,.4),null)
  const caught=harvestResource(e,crab,0,.4)
  assert.equal(caught.ok,true)
  assert.equal(e.materials.crab,2)
  assert.match(resourceBlock(e,crab,1,.4),/ฟื้นตัว/)
})

test('net and pack upgrades alter gathering without changing ecology rules', () => {
  const e=createEconomy(), crab=RESOURCE_NODES.find(n=>n.material==='crab')
  e.coins=1000
  assert.equal(buyUpgrade(e,'net').ok,true)
  assert.equal(buyUpgrade(e,'pack').ok,true)
  assert.equal(materialCap(e),14)
  const result=harvestResource(e,crab,0,.4)
  assert.equal(result.amount,3)
})

test('crafting consumes exact ingredients and selling creates community coins', () => {
  const e=createEconomy()
  e.materials.crab=2;e.materials.nipa=1
  const result=craftProduct(e,'crabBasket')
  assert.equal(result.ok,true)
  assert.equal(e.materials.crab,0)
  assert.equal(e.products.crabBasket,1)
  const before=e.coins
  const sale=sellProduct(e,'crabBasket','all')
  assert.equal(sale.ok,true)
  assert.equal(e.products.crabBasket,0)
  assert.equal(e.coins,before+PRODUCTS.crabBasket.price)
})

test('boots progressively reduce the mud penalty', () => {
  const e=createEconomy(), base=mudSpeedMultiplier(e)
  e.coins=1000;buyUpgrade(e,'boots')
  assert.ok(mudSpeedMultiplier(e)>base)
})

test('economy normalizer rejects unknown or malformed stock', () => {
  const e=normalizeEconomy({coins:-5,materials:{crab:Infinity,hack:900},products:{crabBasket:2},upgrades:{net:99}})
  assert.equal(e.coins,0)
  assert.equal(e.materials.crab,0)
  assert.equal(e.products.crabBasket,2)
  assert.equal(e.upgrades.net,2)
  assert.equal('hack' in e.materials,false)
})

test('action save round trip persists economy and legacy saves migrate', () => {
  const state=createState()
  state.economy.coins=777
  state.economy.materials.seaweed=4
  const restored=restore(serialize(state))
  assert.equal(restored.economy.coins,777)
  assert.equal(restored.economy.materials.seaweed,4)

  const legacy=JSON.parse(serialize(state))
  legacy.version=1
  delete legacy.economy
  const migrated=restore(JSON.stringify(legacy))
  assert.equal(migrated.economy.coins,120)
  assert.equal(migrated.economy.materials.seaweed,0)
})
