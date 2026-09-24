import { MATERIALS, PRODUCTS, UPGRADES, WORKSHOP, MARKET, canCraft, craftProduct, sellProduct, buyUpgrade, materialCap } from './economy.js'

const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z)
const recipeLine = (product) => Object.entries(product.recipe).map(([id,n]) => `${MATERIALS[id].icon} ${MATERIALS[id].name} x${n}`).join(' · ')

export class EconomyPanel {
  constructor({ onClose, onChanged }) {
    this.onClose = onClose
    this.onChanged = onChanged
    this.screen = document.querySelector('#economy-screen')
    this.materials = document.querySelector('#economy-materials')
    this.recipes = document.querySelector('#economy-recipes')
    this.products = document.querySelector('#economy-products')
    this.upgrades = document.querySelector('#economy-upgrades')
    this.coins = document.querySelector('#economy-coins')
    this.workshopStatus = document.querySelector('#workshop-status')
    this.marketStatus = document.querySelector('#market-status')
    this.game = null
    this.handleClick = this.handleClick.bind(this)
    this.screen.addEventListener('click', this.handleClick)
    document.querySelector('#economy-close').addEventListener('click', () => this.close())
  }
  open(game) {
    this.game = game
    this.screen.hidden = false
    this.render(game)
  }
  close(notify = true) {
    this.screen.hidden = true
    if (notify) this.onClose?.()
  }
  atWorkshop(game) { return distance(game.player, WORKSHOP) < 4.2 }
  atMarket(game) { return distance(game.player, MARKET) < 4.2 }
  render(game = this.game) {
    if (!game) return
    this.game = game
    const economy = game.economy
    const cap = materialCap(economy)
    const atWorkshop = this.atWorkshop(game), atMarket = this.atMarket(game)
    this.coins.textContent = economy.coins
    this.workshopStatus.className = atWorkshop ? 'ready' : ''
    this.marketStatus.className = atMarket ? 'ready' : ''
    this.workshopStatus.innerHTML = `🏭 <b>โรงแปรรูปชุมชน</b><br><small>${atWorkshop?'อยู่ในระยะ · คราฟต์/อัปเกรดได้':'เดินไปที่ฐานฝั่งซ้ายเพื่อใช้งาน'}</small>`
    this.marketStatus.innerHTML = `🏪 <b>ตลาดชุมชน</b><br><small>${atMarket?'อยู่ในระยะ · ขายสินค้าได้':'เดินไปแผงตลาดฝั่งขวาของฐาน'}</small>`
    this.materials.innerHTML = Object.entries(MATERIALS).map(([id,item]) => `
      <div class="material-card"><span class="icon">${item.icon}</span><div><b>${item.name}</b><small>${economy.materials[id]||0}/${cap}</small></div><strong>${economy.materials[id]||0}</strong></div>
    `).join('')
    this.recipes.innerHTML = Object.entries(PRODUCTS).map(([id,item]) => {
      const ready = canCraft(economy,id)
      return `<article class="recipe-card"><span class="icon">${item.icon}</span><div><b>${item.name}</b><small>${item.description}</small><div class="economy-recipe-line">${recipeLine(item)}</div></div>
        <button data-craft="${id}" ${!atWorkshop||!ready?'disabled':''}>ทำสินค้า${atWorkshop?'':' · ต้องอยู่โรงชุมชน'}</button></article>`
    }).join('')
    this.products.innerHTML = Object.entries(PRODUCTS).map(([id,item]) => {
      const stock=economy.products[id]||0
      return `<article class="product-card"><span class="icon">${item.icon}</span><div><b>${item.name} × ${stock}</b><small>ราคาขาย ${item.price} เหรียญ / ชิ้น</small></div>
        <button data-sell="${id}" ${!atMarket||!stock?'disabled':''}>ขายทั้งหมด${atMarket?'':' · ต้องอยู่ตลาด'}</button></article>`
    }).join('')
    this.upgrades.innerHTML = Object.entries(UPGRADES).map(([id,item]) => {
      const level=economy.upgrades[id]||0, maxed=level>=item.max, cost=maxed?0:item.costs[level]
      return `<article class="upgrade-card"><span class="icon">${item.icon}</span><div><b>${item.name} · Lv.${level}/${item.max}</b><small>${item.description}</small></div>
        <button data-upgrade="${id}" ${!atWorkshop||maxed||economy.coins<cost?'disabled':''}>${maxed?'ระดับสูงสุด':`อัปเกรด · ${cost} เหรียญ`}</button></article>`
    }).join('')
  }
  handleClick(event) {
    const button = event.target.closest('button[data-craft],button[data-sell],button[data-upgrade]')
    if (!button || !this.game) return
    const game = this.game
    let result
    if (button.dataset.craft) {
      if (!this.atWorkshop(game)) result={ok:false,message:'ต้องกลับไปที่โรงแปรรูปชุมชนก่อน'}
      else result=craftProduct(game.economy,button.dataset.craft)
    }
    if (button.dataset.sell) {
      if (!this.atMarket(game)) result={ok:false,message:'ต้องไปที่ตลาดชุมชนก่อน'}
      else result=sellProduct(game.economy,button.dataset.sell,'all')
    }
    if (button.dataset.upgrade) {
      if (!this.atWorkshop(game)) result={ok:false,message:'ต้องอยู่ที่โรงแปรรูปชุมชนเพื่ออัปเกรด'}
      else result=buyUpgrade(game.economy,button.dataset.upgrade)
    }
    if (!result) return
    this.onChanged?.(result)
    this.render(game)
  }
  dispose() {
    this.screen.removeEventListener('click', this.handleClick)
  }
}
