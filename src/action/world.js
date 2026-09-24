import * as THREE from 'three'
import { RangerAvatar } from './character.js'
import { CAMP, CACHES, FOREST, LOGS, MUD, SITES, SPECIES, STATION, TRASH, terrainHeight, floorHeight, tide, isStorm, random } from './simulation.js'
import { MATERIALS, RESOURCE_NODES, WORKSHOP, MARKET } from './economy.js'

// Original procedural scene. No downloaded images, models or runtime CDN calls.
export class RangerWorld {
  constructor(host, appearance) {
    this.appearance = appearance; this.avatar = null
    this.host = host; this.resources = new Set(); this.plants = []; this.debris = []; this.economyMarkers = []
    this.cameraObstacles = []; this.cameraRay = new THREE.Raycaster(); this.shadowTime = -1
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#b9cabb')
    this.scene.fog = new THREE.FogExp2('#b9cabb', 0.021)
    this.camera = new THREE.PerspectiveCamera(53, 1, 0.08, 130)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.25 : 1.6))
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.autoUpdate = false; this.renderer.shadowMap.needsUpdate = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.domElement.setAttribute('aria-label', 'ฉากแอ็กชันป่าชายเลนสามมิติ')
    host.append(this.renderer.domElement)
    this.scene.add(new THREE.HemisphereLight('#dce7cd', '#283d2b', 1.65))
    this.sun = new THREE.DirectionalLight('#ffe6ac', 3.2)
    this.sun.position.set(-22, 37, -29); this.sun.castShadow = true
    Object.assign(this.sun.shadow.camera, { left: -38, right: 38, top: 45, bottom: -45, near: 1, far: 100 })
    this.sun.shadow.mapSize.set(1536, 1536); this.sun.shadow.bias = -0.0003; this.sun.shadow.normalBias = 0.055
    this.sun.target.position.set(0, 0, -12); this.scene.add(this.sun, this.sun.target)
    this.scene.add(new THREE.AmbientLight('#b8c6a1', 0.2))
    this.g = {
      sphere: this.keep(new THREE.SphereGeometry(1, 12, 9)),
      trunk: this.keep(new THREE.CylinderGeometry(0.73, 1, 1, 9)),
      box: this.keep(new THREE.BoxGeometry(1, 1, 1)),
      leaf: this.keep(new THREE.SphereGeometry(1, 8, 6)),
      blade: this.keep(new THREE.ConeGeometry(1, 1, 3)),
    }
    this.m = {
      bark: this.mat('#63503a'), leaves: this.mat('#426345'), wood: this.mat('#92744a'),
      dark: this.mat('#273d37'), metal: this.mat('#9da9a2', { metalness: 0.45, roughness: 0.43 }),
      soil: this.mat('#503a27'), gold: this.mat('#dca952'), teal: this.mat('#86d9bc'),
    }
    this.buildTerrain(); this.buildForest(); this.buildCamp(); this.buildEconomy(); this.buildCourse(); this.buildCharacter(); this.buildAtmosphere()
    this.scene.updateMatrixWorld(true)
    this.camera.position.set(0, 3.5, 16); this.lookTarget = new THREE.Vector3(0, 2, 11)
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(host); this.resize()
  }
  keep(obj) { this.resources.add(obj); return obj }
  mat(color, rest = {}) { return this.keep(new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...rest })) }
  mesh(geo, mat, pos, scale = [1,1,1], parent = this.scene) {
    const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m
  }
  box(pos, size, mat = this.m.wood, parent) { return this.mesh(this.g.box, mat, pos, size, parent) }
  beam(a, b, radius, mat, parent = this.scene) {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), direction = to.clone().sub(from)
    const m = this.mesh(this.g.trunk, mat, from.clone().add(to).multiplyScalar(0.5).toArray(), [radius, direction.length(), radius], parent)
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize()); return m
  }
  instances(geo, entries, material) {
    if (!entries.length) return
    const mesh = new THREE.InstancedMesh(geo, material, entries.length), temp = new THREE.Object3D()
    entries.forEach((e,i) => {
      temp.position.set(...e.p); temp.scale.set(...e.s); temp.rotation.set(...(e.r || [0,0,0])); temp.updateMatrix()
      mesh.setMatrixAt(i, temp.matrix); if (e.c) mesh.setColorAt(i, new THREE.Color(e.c))
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere(); this.scene.add(mesh); return mesh
  }
  buildTerrain() {
    const geo = this.keep(new THREE.PlaneGeometry(74, 84, 148, 168)); geo.rotateX(-Math.PI / 2); geo.translate(0,0,-10)
    const p = geo.attributes.position, colors = [], color = new THREE.Color(), rng = random(993)
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = terrainHeight(x,z); p.setY(i, y)
      const path = Math.abs(x - Math.sin(z * 0.15) * 0.8) < 3.2
      color.set(y < 0.2 ? '#564d39' : x > 12 ? '#afa27d' : path ? '#9b8255' : '#536346')
      color.multiplyScalar(0.86 + rng() * 0.26); colors.push(color.r, color.g, color.b)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3)); geo.computeVertexNormals()
    this.mesh(geo, this.mat('#ffffff', { vertexColors: true }), [0,0,0]).castShadow = false
    this.water = this.mesh(this.keep(new THREE.PlaneGeometry(150,150)), this.mat('#5f9f98', { transparent: true, opacity: 0.88, roughness: 0.28, metalness: 0.12 }), [0,0,0])
    this.water.rotation.x = -Math.PI / 2; this.water.castShadow = false
    const mud = this.mesh(this.keep(new THREE.CircleGeometry(MUD.radius,48)), this.mat('#534c38', { transparent:true, opacity:0.82, depthWrite:false }), [MUD.x, terrainHeight(MUD.x,MUD.z)+0.04, MUD.z], [1,0.8,1])
    mud.rotation.x = -Math.PI / 2
    const stoneEntries = [], grassEntries = [], leafEntries = []
    for (let i = 0; i < 2000; i++) {
      const x = -30 + rng()*44, z = -45+rng()*69, y = terrainHeight(x,z)
      if (y < 0.3 || Math.abs(x) < 3.3 || [...SITES, ...CACHES, CAMP].some(t => Math.hypot(t.x-x,t.z-z)<2.2)) continue
      if (Math.abs(x+10)<1.7 && Math.abs(z+18)<7) continue
      const h = 0.18+rng()*0.52
      grassEntries.push({p:[x,y+h/2,z],s:[0.08,h,0.08],r:[0,rng()*6.28,0.1-rng()*0.2],c:['#6c7950','#7a8858','#456c45'][i%3]})
      if (i % 10 === 0) {
        for(let j=0;j<6;j++) {const a=j*Math.PI/3; leafEntries.push({p:[x+Math.cos(a)*.28,y+.23,z+Math.sin(a)*.28],s:[.12,.07,.55],r:[.25,a,.22],c:'#577d50'})}
      }
      if (i % 26 === 0) stoneEntries.push({p:[x,y-.03,z],s:[.28+rng()*.5,.3+rng()*.6,.4+rng()*.5],r:[rng(),rng(),0]})
    }
    this.instances(this.g.blade,grassEntries,this.mat('#ffffff'))
    this.instances(this.g.leaf,leafEntries,this.mat('#ffffff'))
    this.instances(this.keep(new THREE.DodecahedronGeometry(1,1)),stoneEntries,this.mat('#7c8270'))
  }
  buildForest() {
    const trunks=[], upperTrunks=[], roots=[], pneumatophores=[], branches=[], crowns=[]
    const barkPalette=['#66503b','#979487','#705744']
    const leafPalettes=[
      ['#315f3c','#477846','#5d8b52'],
      ['#6f8d5c','#829b68','#a2ad78'],
      ['#396b4c','#4d7c55','#668d5d'],
    ]
    for (const t of FOREST) {
      const kind=t.kind%3, y=terrainHeight(t.x,t.z), h=(kind===1?6.5:kind===2?5.6:6.1)*t.scale, a=t.phase
      const bark=barkPalette[kind], leaves=leafPalettes[kind]
      trunks.push({p:[t.x,y+h*.34,t.z],s:[(kind===2?.31:.24)*t.scale,h*.68,(kind===2?.31:.24)*t.scale],r:[.018*Math.sin(a),a,.02],c:bark})
      upperTrunks.push({p:[t.x+.05*Math.sin(a),y+h*.72,t.z+.05*Math.cos(a)],s:[.15*t.scale,h*.34,.15*t.scale],r:[.025*Math.cos(a),a+.12,.02],c:bark})

      if(kind===0) {
        // Rhizophora: arching stilt roots from trunk into the intertidal mud.
        for(let i=0;i<9;i++) {
          const angle=a+i*Math.PI*2/9, radius=(.72+(i%3)*.13)*t.scale
          const start=new THREE.Vector3(t.x+Math.cos(angle)*radius,y+.02,t.z+Math.sin(angle)*radius)
          const end=new THREE.Vector3(t.x+Math.cos(angle)*.08,y+(1.05+(i%2)*.32)*t.scale,t.z+Math.sin(angle)*.08)
          const v=end.clone().sub(start), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize())
          roots.push({p:start.add(end).multiplyScalar(.5).toArray(),s:[.048*t.scale,v.length(),.048*t.scale],r:new THREE.Euler().setFromQuaternion(q).toArray().slice(0,3),c:'#594330'})
        }
      } else {
        // Avicennia / Sonneratia: breathing roots around the crown footprint.
        const count=kind===1?18:12
        for(let i=0;i<count;i++) {
          const angle=a+i*2.399, radius=(.55+(i%5)*.24)*t.scale
          const height=(kind===1?.22:.31)*t.scale*(.75+(i%4)*.08)
          pneumatophores.push({p:[t.x+Math.cos(angle)*radius,y+height*.5,t.z+Math.sin(angle)*radius],s:[.025*t.scale,height,.025*t.scale],r:[0,angle,0],c:kind===1?'#8d897b':'#6b5442'})
        }
        if(kind===2) {
          for(let i=0;i<5;i++) {
            const angle=a+i*Math.PI*2/5, radius=.62*t.scale
            const start=new THREE.Vector3(t.x+Math.cos(angle)*radius,y+.03,t.z+Math.sin(angle)*radius)
            const end=new THREE.Vector3(t.x,y+.72*t.scale,t.z), v=end.clone().sub(start)
            const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize())
            roots.push({p:start.add(end).multiplyScalar(.5).toArray(),s:[.07*t.scale,v.length(),.045*t.scale],r:new THREE.Euler().setFromQuaternion(q).toArray().slice(0,3),c:bark})
          }
        }
      }

      const branchCount=kind===2?8:kind===1?7:6
      for(let i=0;i<branchCount;i++) {
        const angle=a+i*Math.PI*2/branchCount, reach=(kind===2?1.75:kind===1?1.4:1.55)*t.scale*(.83+(i%3)*.1)
        const start=new THREE.Vector3(t.x,y+h*(.58+(i%2)*.045),t.z)
        const end=new THREE.Vector3(t.x+Math.cos(angle)*reach,y+h*(.83+(i%3)*.035),t.z+Math.sin(angle)*reach)
        const v=end.clone().sub(start), q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),v.clone().normalize())
        branches.push({p:start.add(end).multiplyScalar(.5).toArray(),s:[.065*t.scale,v.length(),.065*t.scale],r:new THREE.Euler().setFromQuaternion(q).toArray().slice(0,3),c:bark})

        const clusters=kind===1?1:2
        for(let j=0;j<clusters;j++) {
          const offset=(j-.35)*.42*t.scale
          crowns.push({
            p:[end.x+Math.cos(angle+1.45)*offset,end.y+.18*(j%2)*t.scale,end.z+Math.sin(angle+1.45)*offset],
            s:[(kind===2?1.02:.82)*t.scale,(kind===1?.46:.56)*t.scale,(kind===2?.82:.7)*t.scale],
            r:[.08*Math.sin(i),angle,.05*Math.cos(i)],c:leaves[(i+j)%leaves.length]
          })
        }
      }
      // Smaller top clusters break the spherical silhouette and read more like real foliage.
      for(let i=0;i<4;i++) {
        const angle=a+i*Math.PI*.5
        crowns.push({p:[t.x+Math.cos(angle)*.55*t.scale,y+h+.1*t.scale,t.z+Math.sin(angle)*.55*t.scale],
          s:[.72*t.scale,.48*t.scale,.62*t.scale],r:[0,angle,.08],c:leaves[(i+1)%leaves.length]})
      }
    }
    const white=this.mat('#ffffff')
    this.instances(this.g.trunk,trunks,white); this.instances(this.g.trunk,upperTrunks,white)
    this.instances(this.g.trunk,roots,white); this.instances(this.g.blade,pneumatophores,white)
    this.instances(this.g.trunk,branches,white); this.instances(this.g.leaf,crowns,white)
  }
  text(text, position, width=3, parent=this.scene) {
    const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=128
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#152b25'; ctx.fillRect(0,0,512,128)
    ctx.strokeStyle='#cdb47b'; ctx.lineWidth=5; ctx.strokeRect(4,4,504,120)
    ctx.fillStyle='#f6eac7'; ctx.font='bold 34px sans-serif'; ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64)
    const texture=this.keep(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace
    const m=this.keep(new THREE.SpriteMaterial({map:texture})); const sprite=new THREE.Sprite(m);sprite.position.set(...position);sprite.scale.set(width,width/4,1);parent.add(sprite)
  }
  buildCamp() {
    const tentMat=this.mat('#526951', {side:THREE.DoubleSide})
    for(const [cx,cz] of [[0,16],[-10,-26.8]]) {
      for(const x of [-2.4,2.4]) for(const z of [-1.5,1.5]) this.beam([cx+x,terrainHeight(cx+x,cz+z),cz+z],[cx+x,3.8,cz+z],.07,this.m.wood)
      const roof=this.box([cx,4,cz],[5.7,.14,4],tentMat);roof.rotation.z=.06
      this.cameraObstacles.push(roof)
      this.box([cx,1,cz],[5.4,.22,3.5],this.m.wood)
    }
    for(const cache of CACHES) {
      const y=floorHeight(cache.x,cache.z), g=new THREE.Group();g.position.set(cache.x,y,cache.z);this.scene.add(g)
      this.box([0,.38,0],[1.1,.75,.85],this.m.gold,g)
      this.box([0,.8,0],[1.2,.09,.93],this.m.wood,g)
      this.box([0,.42,.44],[.14,.5,.05],this.m.metal,g)
      for(let i=0;i<3;i++) {this.beam([-.35+i*.35,.84,0],[-.35+i*.35,1.3,0],.015,this.m.bark,g);this.mesh(this.g.leaf,this.m.leaves,[-.35+i*.35,1.3,0],[.16,.06,.1],g)}
      this.text('SEEDLINGS',[0,1.8,0],1.9,g)
    }
    const y=terrainHeight(STATION.x,STATION.z)
    this.box([STATION.x,y+.75,STATION.z],[1.6,.12,1.05],this.m.wood)
    for(const dx of [-.65,.65]) this.box([STATION.x+dx,y+.36,STATION.z],[.1,.75,.7])
    this.box([STATION.x,y+1.13,STATION.z],[.65,.58,.06],this.m.dark)
    this.box([STATION.x,y+1.14,STATION.z+.045],[.53,.4,.02],this.mat('#70c5ad',{emissive:'#56b6a0',emissiveIntensity:.4}))
    this.text('MRV • BASE CAMP',[STATION.x,2.9,STATION.z],2.6)
  }
  buildEconomy() {
    const makeStall=(center,label,roofColor)=>{
      const y=floorHeight(center.x,center.z), g=new THREE.Group();g.position.set(center.x,y,center.z);this.scene.add(g)
      this.box([0,.5,0],[3,.16,1.7],this.m.wood,g)
      for(const x of [-1.25,1.25]) for(const z of [-.65,.65]) this.beam([x,.05,z],[x,2.35,z],.055,this.m.wood,g)
      const roof=this.box([0,2.45,0],[3.45,.18,2.1],this.mat(roofColor)); roof.parent?.remove(roof); g.add(roof); roof.position.set(0,2.45,0)
      this.text(label,[0,3.05,0],2.7,g)
      return g
    }
    const workshop=makeStall(WORKSHOP,'COMMUNITY WORKSHOP','#6f8060')
    for(let i=0;i<4;i++) this.box([-1.05+i*.7,.75,.2],[.5,.35,.65],i%2?this.m.gold:this.m.wood,workshop)
    const market=makeStall(MARKET,'COASTAL MARKET','#a56d48')
    for(let i=0;i<5;i++) this.mesh(this.g.sphere,this.mat(['#d38c57','#d2b96f','#708e61'][i%3]),[-1.1+i*.55,.78,.05],[.18,.12,.18],market)

    for(const node of RESOURCE_NODES) {
      const y=floorHeight(node.x,node.z), g=new THREE.Group();g.position.set(node.x,y+.04,node.z);this.scene.add(g)
      const color=this.mat(MATERIALS[node.material].color)
      const ring=this.mesh(this.keep(new THREE.RingGeometry(.62,.7,32)),this.mat(MATERIALS[node.material].color,{side:THREE.DoubleSide,transparent:true,opacity:.42}),[0,.02,0],[1,1,1],g)
      ring.rotation.x=-Math.PI/2; ring.castShadow=false
      if(node.kind==='catch') {
        this.box([0,.24,0],[.8,.42,.62],this.m.wood,g)
        for(const x of [-.35,.35]) this.beam([x,.04,-.25],[x,.72,.25],.025,this.m.dark,g)
        this.mesh(this.g.sphere,color,[0,.72,0],[.18,.1,.25],g)
      } else {
        for(let i=0;i<5;i++) {
          const a=i*1.256
          this.mesh(node.material==='driftwood'?this.g.trunk:this.g.leaf,color,[Math.sin(a)*.34,.18+(i%2)*.08,Math.cos(a)*.3],
            node.material==='driftwood'?[.08,.55,.08]:[.24,.09,.34],g).rotation.y=a
        }
      }
      this.economyMarkers.push({node,group:g,ring})
    }
  }
  youngTree(kind) {
    const g=new THREE.Group(), leafMat=this.mat(SPECIES[kind].color)
    const bark=kind===1?this.mat('#8f8d82'):kind===2?this.mat('#705744'):this.m.bark
    this.beam([0,0,0],[0,1.95,0],kind===2?.11:.085,bark,g)
    const count=kind===2?7:6
    for(let i=0;i<count;i++) {
      const a=i*Math.PI*2/count, reach=(kind===2?.75:kind===1?.55:.65)
      this.beam([0,1.15+(i%2)*.14,0],[Math.sin(a)*reach,1.62+(i%3)*.12,Math.cos(a)*reach],.035,bark,g)
      this.mesh(this.g.leaf,leafMat,[Math.sin(a)*reach,1.72+(i%3)*.12,Math.cos(a)*reach],
        [kind===2?.58:.45,kind===1?.22:.29,kind===2?.48:.38],g).rotation.y=a
    }
    if(kind===0) {
      for(let i=0;i<7;i++){const a=i*Math.PI*2/7;this.beam([Math.sin(a)*.52,.02,Math.cos(a)*.52],[0,.72+(i%2)*.14,0],.027,bark,g)}
    } else {
      const roots=kind===1?11:7
      for(let i=0;i<roots;i++){const a=i*2.399,r=.35+(i%3)*.13;this.mesh(this.g.blade,bark,[Math.sin(a)*r,.1,Math.cos(a)*r],[.018,.2+(i%2)*.05,.018],g)}
    }
    return g
  }
  buildCourse() {
    for(const log of LOGS) {
      const y=terrainHeight(log.x,log.z)+log.radius
      this.beam([log.x-log.half,y,log.z],[log.x+log.half,y,log.z],log.radius,this.m.bark)
      for(let i=0;i<3;i++) this.beam([log.x+i-1,y+.2,log.z],[log.x+i-1.2,y+.55,log.z-.55],.06,this.m.bark)
    }
    // Physical bridge surface matches floorHeight, including accessible ramps.
    for(let i=0;i<21;i++) {
      const z=-23.8+i*.57, y=floorHeight(-10,z)
      this.box([-10,y-.08,z],[2.48,.15,.51],i%2?this.m.wood:this.m.bark)
      if(i%4===0) for(const x of [-11.12,-8.88]) this.beam([x,y-.5,z],[x,y+1,z],.055,this.m.wood)
    }
    for(const x of [-11.12,-8.88]) this.beam([x,2.25,-22],[x,2.25,-14],.038,this.m.wood)
    this.text('HIGH ROUTE',[-10,2.5,-12],2.2)
    for(const site of SITES) {
      const y=floorHeight(site.x,site.z), group=new THREE.Group();group.position.set(site.x,y+.03,site.z);this.scene.add(group)
      const ring=this.mesh(this.keep(new THREE.RingGeometry(.65,.72,40)),this.mat(SPECIES[site.species].color,{side:THREE.DoubleSide,transparent:true,opacity:.65}),[0,.015,0],[1,1,1],group);ring.rotation.x=-Math.PI/2;ring.castShadow=false
      const marker=this.youngTree(site.species);marker.scale.setScalar(.18);group.add(marker)
      const plant=this.youngTree(site.species);plant.visible=false;group.add(plant)
      const orb=this.mesh(this.keep(new THREE.OctahedronGeometry(.11)),this.mat('#eac781',{emissive:'#ba8537',emissiveIntensity:.9}),[0,2.7,0],[1,1,1],group);orb.visible=false
      this.plants.push({group,ring,marker,plant,orb})
    }
    const plastic=this.mat('#c27944'), net=this.mat('#415150')
    for(const t of TRASH) {
      const group=new THREE.Group();group.position.set(t.x,terrainHeight(t.x,t.z)+.06,t.z);this.scene.add(group)
      for(let i=0;i<5;i++) this.box([Math.sin(i*3)*.4,.15+(i%2)*.12,Math.cos(i*4)*.28],[.26,.16,.34],i%2?plastic:net,group).rotation.y=i
      this.debris.push({id:t.id,group})
    }
  }
  buildCharacter() { this.setAppearance(this.appearance) }
  setAppearance(value) {
    const next = new RangerAvatar(value)
    if (this.avatar?.signature === next.signature) { next.dispose(); return }
    if (this.character) {
      next.root.position.copy(this.character.position)
      next.root.rotation.copy(this.character.rotation)
    }
    this.avatar?.dispose()
    this.avatar = next; this.character = next.root
    this.renderer.domElement.dataset.outfit = next.signature
    this.scene.add(this.character); this.renderer.shadowMap.needsUpdate = true
  }
  buildAtmosphere() {
    const rng=random(12), geo=this.keep(new THREE.BufferGeometry()), positions=new Float32Array(900)
    for(let i=0;i<positions.length;i+=3) {positions[i]=(rng()-.5)*28;positions[i+1]=rng()*15;positions[i+2]=(rng()-.5)*28}
    geo.setAttribute('position',new THREE.BufferAttribute(positions,3))
    this.rain=new THREE.Points(geo,this.keep(new THREE.PointsMaterial({color:'#d0dfde',size:.055,transparent:true,opacity:.7})));this.scene.add(this.rain)
    const motesGeo=this.keep(new THREE.BufferGeometry()), motes=new Float32Array(180)
    for(let i=0;i<motes.length;i+=3) {motes[i]=(rng()-.5)*40;motes[i+1]=1+rng()*7;motes[i+2]=-35+rng()*60}
    motesGeo.setAttribute('position',new THREE.BufferAttribute(motes,3));this.motes=new THREE.Points(motesGeo,this.keep(new THREE.PointsMaterial({color:'#ffdf91',size:.048,transparent:true,opacity:.75})));this.scene.add(this.motes)
    // Distant sky disc, not an overlay over the playable world.
    const sun=this.mesh(this.g.sphere,this.keep(new THREE.MeshBasicMaterial({color:'#ffedbf'})),[-30,32,-55],[2.8,2.8,2.8]);sun.castShadow=false
  }
  resize() {
    const {width,height}=this.host.getBoundingClientRect();this.camera.aspect=Math.max(1,width)/Math.max(1,height);this.camera.updateProjectionMatrix();this.renderer.setSize(width,height,false)
  }
  update(s, camera, dt) {
    const p=s.player,time=s.time;this.character.position.set(p.x,p.y,p.z)
    const turn=Math.atan2(Math.sin(p.heading-this.character.rotation.y),Math.cos(p.heading-this.character.rotation.y))
    this.character.rotation.y+=turn*Math.min(1,dt*14)
    this.avatar.update(dt,time,p,s.progress)
    this.water.position.y=tide(time)
    const storm=isStorm(time);this.rain.visible=storm;this.rain.position.set(p.x,0,p.z)
    if(storm) {const a=this.rain.geometry.attributes.position;for(let i=0;i<a.count;i++) a.setY(i,(a.getY(i)-dt*18+15)%15);a.needsUpdate=true}
    this.scene.fog.color.lerp(new THREE.Color(storm?'#718c83':'#b9cabb'),Math.min(1,dt*.5));this.scene.background.copy(this.scene.fog.color)
    this.sun.intensity=THREE.MathUtils.damp(this.sun.intensity,storm?1.2:3.2,2,dt)
    this.motes.position.x=Math.sin(time*.08)*.5
    this.debris.forEach(t=>{t.group.visible=!s.cleaned.includes(t.id)})
    this.economyMarkers.forEach((entry,i)=>{
      const last=s.economy?.harvests?.[entry.node.id], cooling=Number.isFinite(last)&&time-last<entry.node.cooldown
      entry.ring.material.opacity=cooling?.09:(.28+Math.sin(time*1.8+i)*.08)
      entry.group.scale.setScalar(cooling?.82:1)
    })
    this.plants.forEach((entry,i)=>{
      const site=s.sites[i],planted=site.plantedAt!==null
      entry.marker.visible=!planted;entry.plant.visible=planted
      entry.ring.material.opacity=Math.hypot(p.x-SITES[i].x,p.z-SITES[i].z)<5?.75:.22
      if(planted) {
        const age=time-site.plantedAt,goal=.23+Math.min(1,age/35)*.95
        const scale=THREE.MathUtils.damp(entry.plant.scale.x,goal,4,dt);entry.plant.scale.setScalar(scale)
        entry.plant.rotation.z=Math.sin(time*1.4+i)*.024
        entry.orb.visible=age>=22&&!site.sampled;entry.orb.position.y=2.65+Math.sin(time*2+i)*.1;entry.orb.rotation.y=time
      }
    })
    const look=new THREE.Vector3(p.x+Math.sin(camera.yaw)*.5,p.y+1.48,p.z-Math.cos(camera.yaw)*.5)
    const length=camera.distance*Math.cos(camera.pitch)
    const goal=new THREE.Vector3(p.x-Math.sin(camera.yaw)*length,p.y+1.4+Math.sin(camera.pitch)*camera.distance,p.z+Math.cos(camera.yaw)*length)
    // Pull in before the actual shelter geometry; open sides alone do not prevent roof occlusion.
    const rayDirection=goal.clone().sub(look), rayLength=rayDirection.length()
    this.cameraRay.set(look,rayDirection.normalize());this.cameraRay.far=rayLength
    const shelterHit=this.cameraRay.intersectObjects(this.cameraObstacles,false)[0]
    if(shelterHit) goal.copy(look).addScaledVector(rayDirection,Math.max(.6,shelterHit.distance-.45))
    for(let f=.2;f<1;f+=.1) {
      const q=look.clone().lerp(goal,f)
      if(FOREST.some(t=>Math.hypot(q.x-t.x,q.z-t.z)<.6&&q.y<terrainHeight(t.x,t.z)+5*t.scale)) {goal.copy(look.clone().lerp(goal,Math.max(.25,f-.12)));break}
    }
    goal.y=Math.max(goal.y,floorHeight(goal.x,goal.z)+.45)
    this.camera.position.lerp(goal,1-Math.exp(-dt*9));this.lookTarget.lerp(look,1-Math.exp(-dt*11));this.camera.lookAt(this.lookTarget)
    if(time-this.shadowTime>.2||time<this.shadowTime) {this.renderer.shadowMap.needsUpdate=true;this.shadowTime=time}
    this.renderer.render(this.scene,this.camera);this.renderer.domElement.dataset.ready='true'
  }
  dispose() {
    this.avatar?.dispose();this.resizeObserver.disconnect();this.scene.traverse(o=>{if(o.isInstancedMesh)o.dispose()});this.resources.forEach(o=>o.dispose?.());this.renderer.dispose();this.renderer.domElement.remove()
  }
}
