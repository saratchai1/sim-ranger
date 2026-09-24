import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'

const base = process.env.QA_URL || 'http://127.0.0.1:4173'
const out = 'vnext-artifacts'
await fs.mkdir(out,{recursive:true})

async function run(name, viewport, mobile=false) {
  const browser = await chromium.launch({headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader']})
  const context = await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1})
  const page = await context.newPage(), errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text())})
  await page.goto(base,{waitUntil:'networkidle'})
  await page.locator('#start').click()
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.ready==='true',{timeout:30000})
  await page.waitForTimeout(1200)
  assert.equal(errors.length,0,`runtime errors: ${errors.join(' | ')}`)
  await page.screenshot({path:`${out}/${name}-world.png`})
  await page.locator('#economy-open').click()
  await page.locator('#economy-screen:not([hidden])').waitFor({timeout:5000})
  const box=await page.locator('.economy-card').boundingBox()
  assert.ok(box && box.x>=-1 && box.y>=-1 && box.x+box.width<=viewport.width+1,'economy panel must fit viewport width')
  await page.screenshot({path:`${out}/${name}-economy.png`})
  await browser.close()
  return {name,errors,economyBox:box}
}
const report=[]
report.push(await run('desktop',{width:1440,height:900}))
report.push(await run('phone',{width:390,height:844},true))
await fs.writeFile(`${out}/report.json`,JSON.stringify({passed:true,report},null,2))
