(function(){
const COVER="assets/couverture-ebook.jpg";
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile=matchMedia('(max-width:760px)').matches;
const sections=[...document.querySelectorAll('.station')];
const panels=sections.map(s=>s.querySelector('.panel'));
const dots=[...document.querySelectorAll('.dots a')];
const SECTORS=['Nébuleuse de départ','Orbite du pilote','Ceinture des trois lunes','Cristal du vibe','Archive dorée','Anneau des chapitres','Horizon des événements'];
const sectorEl=document.getElementById('sector'),distEl=document.getElementById('dist'),barEl=document.getElementById('bar'),flash=document.getElementById('flash');

let scrollTarget=0,scrollNow=0,lastScroll=0,velocity=0,current=-1;
let centers=[];
function measure(){centers=sections.map(s=>s.offsetTop+s.offsetHeight/2-innerHeight/2);readScroll()}
function readScroll(){if(!centers.length)return;const y=scrollY;let f;
  if(y<=centers[0])f=0;else if(y>=centers[centers.length-1])f=centers.length-1;
  else{for(let i=0;i<centers.length-1;i++){if(y<centers[i+1]){f=i+(y-centers[i])/(centers[i+1]-centers[i]);break}}}
  scrollTarget=f/(centers.length-1)}
addEventListener('scroll',readScroll,{passive:true});addEventListener('resize',measure);measure();addEventListener('load',measure);if(document.fonts)document.fonts.ready.then(measure);

function updatePanels(){
  const vh=innerHeight;
  sections.forEach((s,i)=>{
    const r=s.getBoundingClientRect();const c=(r.top+r.height/2-vh/2)/vh; // 0 = centré
    const p=Math.max(-1.4,Math.min(1.4,c));
    const a=Math.abs(p);
    const el=panels[i];
    if(reduce){el.style.opacity='1';return}
    el.style.transform=`perspective(1100px) translate3d(0,${p*40}px,${-a*260}px) rotateX(${p*14}deg) rotateY(${(i%2?-1:1)*p*8}deg)`;
    el.style.opacity=String(Math.max(0.3,1-a*a*0.6));
  });
  const idx=Math.round(scrollNow*(sections.length-1));
  if(idx!==current){current=idx;dots.forEach((d,i)=>d.classList.toggle('on',i===idx));sectorEl.textContent=SECTORS[idx];
    if(!reduce&&lastFlash!==idx){flash.style.opacity='1';setTimeout(()=>flash.style.opacity='0',220);lastFlash=idx}}
  distEl.textContent=Math.round(scrollNow*42000).toLocaleString('fr-FR');
  barEl.style.width=(scrollNow*100)+'%';
}
let lastFlash=0;

/* ---------- THREE ---------- */
let ok=!!window.THREE;
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:document.getElementById('space'),antialias:!mobile,alpha:false,powerPreference:'high-performance'})}catch(e){ok=false}
if(!ok){document.getElementById('space').style.display='none';const loop=()=>{scrollNow+=(scrollTarget-scrollNow)*.12;updatePanels();requestAnimationFrame(loop)};loop();return}

renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));
renderer.setSize(innerWidth,innerHeight);
renderer.setClearColor(0x070A1A,1);
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x070A1A,0.006);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,0.1,900);

// Trajectoire du vaisseau
const N=sections.length, GAP=70;
const pts=[];
for(let i=0;i<=N+1;i++){pts.push(new THREE.Vector3(Math.sin(i*1.3)*9,Math.cos(i*0.9)*4,-i*GAP))}
const curve=new THREE.CatmullRomCurve3(pts,false,'catmullrom',0.5);
const T_END=N/(N+1)*0.93; // portion utilisée par la caméra
const stationT=i=>i/(N-1)*T_END;

// Textures procédurales
function glowTex(c1,c2){const s=256,cv=document.createElement('canvas');cv.width=cv.height=s;const g=cv.getContext('2d');
  const gr=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);gr.addColorStop(0,c1);gr.addColorStop(.35,c2);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,s,s);return new THREE.CanvasTexture(cv)}
function planetTex(stops,bands){const w=512,h=256,cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
  const gr=g.createLinearGradient(0,0,0,h);stops.forEach((c,i)=>gr.addColorStop(i/(stops.length-1),c));g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<bands;i++){g.globalAlpha=Math.random()*.25;g.fillStyle=Math.random()>.5?'#fff':'#000';const y=Math.random()*h;g.fillRect(0,y,w,2+Math.random()*12)}
  g.globalAlpha=1;return new THREE.CanvasTexture(cv)}
const dotTex=glowTex('rgba(255,255,255,1)','rgba(255,255,255,.25)');

// Étoiles
const STARS=mobile?3000:7000;
const sg=new THREE.BufferGeometry();const sp=new Float32Array(STARS*3),sc=new Float32Array(STARS*3);
const palette=[new THREE.Color('#ffffff'),new THREE.Color('#F3E3C8'),new THREE.Color('#D6CCF2'),new THREE.Color('#C9DBF2'),new THREE.Color('#ffffff')];
for(let i=0;i<STARS;i++){sp[i*3]=(Math.random()-.5)*260;sp[i*3+1]=(Math.random()-.5)*180;sp[i*3+2]=40-Math.random()*(GAP*(N+2)+120);
  const c=palette[(Math.random()*palette.length)|0];sc[i*3]=c.r;sc[i*3+1]=c.g;sc[i*3+2]=c.b}
sg.setAttribute('position',new THREE.BufferAttribute(sp,3));sg.setAttribute('color',new THREE.BufferAttribute(sc,3));
const starMat=new THREE.PointsMaterial({size:.55,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
const stars=new THREE.Points(sg,starMat);scene.add(stars);

// Nébuleuses
const nebColors=[['rgba(150,140,220,.7)','rgba(70,70,150,.2)'],['rgba(120,160,215,.65)','rgba(40,70,130,.2)'],['rgba(230,205,170,.55)','rgba(120,100,90,.15)'],['rgba(185,165,225,.6)','rgba(80,60,130,.18)']];
const nebTex=nebColors.map(c=>glowTex(c[0],c[1]));
const nebulae=[];
for(let i=0;i<(mobile?26:44);i++){const m=new THREE.SpriteMaterial({map:nebTex[i%4],transparent:true,opacity:.14+Math.random()*.14,depthWrite:false,blending:THREE.AdditiveBlending});
  const s=new THREE.Sprite(m);const t=Math.random();const base=curve.getPointAt(Math.min(1,t));
  s.position.set(base.x+(Math.random()-.5)*120,base.y+(Math.random()-.5)*70,base.z-20-Math.random()*40);const k=40+Math.random()*90;s.scale.set(k,k,1);
  s.userData.spin=(Math.random()-.5)*.0006;scene.add(s);nebulae.push(s)}

// Lumières
scene.add(new THREE.AmbientLight(0x8890c0,.6));
const sun=new THREE.PointLight(0xf5e2c4,2,400);scene.add(sun);
const rim=new THREE.DirectionalLight(0x9db5e8,.8);rim.position.set(-1,.5,-.5);scene.add(rim);

const side=mobile?0:1;
const L=curve.getLength();
function anchor(i,dx,dy,ahead){const p=curve.getPointAt(Math.min(1,stationT(i)+(ahead||8)/L));return new THREE.Vector3(p.x+dx,p.y+dy,p.z)}
const anim=[];

// Station 0 : planète à anneaux
{const g=new THREE.Group();
 const pl=new THREE.Mesh(new THREE.SphereGeometry(9,64,64),new THREE.MeshStandardMaterial({map:planetTex(['#1E2650','#46508C','#8C86B8','#D9C3A0','#3A3F75'],40),roughness:.85,metalness:.1}));
 g.add(pl);
 const rc=document.createElement('canvas');rc.width=512;rc.height=8;const rg=rc.getContext('2d');for(let x=0;x<512;x++){rg.fillStyle=`rgba(${225+Math.random()*25|0},${210+Math.random()*30|0},${190+Math.random()*40|0},${Math.random()*.55})`;rg.fillRect(x,0,1,8)}
 const ringGeo=new THREE.RingGeometry(12,20,128);const pos=ringGeo.attributes.position,uv=ringGeo.attributes.uv,v=new THREE.Vector3();
 for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);uv.setXY(i,(v.length()-12)/8,.5)}
 const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(rc),side:THREE.DoubleSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
 ring.rotation.x=Math.PI/2.4;ring.rotation.y=.25;g.add(ring);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(190,200,240,.35)','rgba(120,120,200,.12)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.set(34,34,1);g.add(halo);
 g.position.copy(anchor(0,mobile?4:24,mobile?-15:-6,mobile?44:34));g.rotation.z=.3;scene.add(g);
 anim.push(t=>{pl.rotation.y=t*.06;ring.rotation.z=t*.02})}

// Station 1 : planète de code (filaire)
{const g=new THREE.Group();
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(4.2,1),new THREE.MeshStandardMaterial({color:0x232a55,emissive:0x4a5aa0,emissiveIntensity:.45,flatShading:true,roughness:.4}));
 const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(6,2),new THREE.MeshBasicMaterial({color:0xe6c89c,wireframe:true,transparent:true,opacity:.3}));
 const outer=new THREE.Mesh(new THREE.IcosahedronGeometry(7.6,1),new THREE.MeshBasicMaterial({color:0xc7b6f0,wireframe:true,transparent:true,opacity:.14}));
 g.add(core,wire,outer);
 const n=500,pg=new THREE.BufferGeometry(),pp=new Float32Array(n*3);for(let i=0;i<n;i++){const r=9+Math.random()*4,a=Math.random()*Math.PI*2,y=(Math.random()-.5)*1.2;pp[i*3]=Math.cos(a)*r;pp[i*3+1]=y;pp[i*3+2]=Math.sin(a)*r}
 pg.setAttribute('position',new THREE.BufferAttribute(pp,3));const belt=new THREE.Points(pg,new THREE.PointsMaterial({size:.35,map:dotTex,color:0xf0e2cc,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));belt.rotation.x=.4;g.add(belt);
 g.scale.setScalar(1.35);g.position.copy(anchor(1,side*13,0,8));scene.add(g);
 anim.push(t=>{core.rotation.y=t*.3;core.rotation.x=t*.12;wire.rotation.y=-t*.18;outer.rotation.x=t*.08;belt.rotation.y=t*.15})}

// Station 2 : trois lunes
{const g=new THREE.Group();
 const sunM=new THREE.Mesh(new THREE.SphereGeometry(2.6,48,48),new THREE.MeshBasicMaterial({color:0xfaf3e6}));g.add(sunM);
 const sh=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(250,235,210,.9)','rgba(200,170,130,.22)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sh.scale.set(22,22,1);g.add(sh);
 const moons=[['#D9C3A0','#5A4A3A'],['#A9B9E0','#2A3560'],['#C2B4E6','#3A3060']].map((c,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1.4+i*.35,40,40),new THREE.MeshStandardMaterial({map:planetTex([c[1],c[0],c[1]],20),roughness:.7}));
   const orbit=new THREE.Mesh(new THREE.TorusGeometry(6+i*3.2,.03,8,160),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.18}));orbit.rotation.x=Math.PI/2;g.add(orbit);g.add(m);return m});
 g.rotation.x=.35;g.scale.setScalar(1.25);g.position.copy(anchor(2,-side*14,1,8));scene.add(g);
 anim.push(t=>{moons.forEach((m,i)=>{const r=6+i*3.2,a=t*(.5-i*.12)+i*2.1;m.position.set(Math.cos(a)*r,0,Math.sin(a)*r);m.rotation.y=t})})}

// Station 3 : cristal du vibe
{const g=new THREE.Group();
 const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(4,1.1,220,24,2,3),new THREE.MeshStandardMaterial({color:0x1c2246,emissive:0x6a6fb8,emissiveIntensity:.3,metalness:.85,roughness:.2}));
 const kw=new THREE.Mesh(new THREE.TorusKnotGeometry(4,1.15,110,12,2,3),new THREE.MeshBasicMaterial({color:0xe6c89c,wireframe:true,transparent:true,opacity:.16}));
 const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(180,170,235,.4)','rgba(110,120,200,.14)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));gl.scale.set(26,26,1);
 const kl=new THREE.PointLight(0xc7b6f0,1.8,40);g.add(knot,kw,gl,kl);
 g.scale.setScalar(1.3);g.position.copy(anchor(3,side*13,-1,8));scene.add(g);
 anim.push(t=>{knot.rotation.x=t*.25;knot.rotation.y=t*.35;kw.rotation.copy(knot.rotation)})}

// Station 4 : le livre
{const g=new THREE.Group();
 const tex=new THREE.TextureLoader().load(COVER);if('encoding' in tex)tex.encoding=THREE.sRGBEncoding;
 const spine=new THREE.MeshStandardMaterial({color:0x2a2160,roughness:.5});
 const pages=new THREE.MeshStandardMaterial({color:0xf3eee6,roughness:.9});
 const front=new THREE.MeshStandardMaterial({map:tex,roughness:.45,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.25});
 const back=new THREE.MeshStandardMaterial({color:0x1a0b3d,roughness:.5});
 const book=new THREE.Mesh(new THREE.BoxGeometry(5.1,7.2,.7),[pages,spine,pages,pages,front,back]);
 g.add(book);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(230,205,165,.35)','rgba(150,140,210,.12)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.set(24,24,1);halo.position.z=-2;g.add(halo);
 const n=300,pg=new THREE.BufferGeometry(),pp=new Float32Array(n*3);for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=6+Math.random()*3;pp[i*3]=Math.cos(a)*r;pp[i*3+1]=(Math.random()-.5)*9;pp[i*3+2]=Math.sin(a)*r}
 pg.setAttribute('position',new THREE.BufferAttribute(pp,3));const dust=new THREE.Points(pg,new THREE.PointsMaterial({size:.3,map:dotTex,color:0xe6c89c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));g.add(dust);
 const bl=new THREE.PointLight(0xf5e8d4,1.6,30);bl.position.set(0,2,8);g.add(bl);
 g.scale.setScalar(mobile?1.6:2.3);g.position.copy(anchor(4,-side*18,0,8));scene.add(g);
 anim.push((t,mx,my)=>{book.rotation.y=Math.sin(t*.5)*.45+mx*.3+.35*side;book.rotation.x=Math.sin(t*.7)*.08+my*.15;book.position.y=Math.sin(t*1.1)*.4;dust.rotation.y=t*.1})}

// Station 5 : anneau de pages (les chapitres)
{const g=new THREE.Group();const cards=[];
 for(let i=0;i<13;i++){const cv=document.createElement('canvas');cv.width=256;cv.height=340;const c=cv.getContext('2d');
   const gr=c.createLinearGradient(0,0,0,340);gr.addColorStop(0,'rgba(40,48,95,.92)');gr.addColorStop(1,'rgba(20,24,55,.92)');c.fillStyle=gr;c.fillRect(0,0,256,340);
   c.strokeStyle='rgba(230,200,156,.6)';c.lineWidth=3;c.strokeRect(6,6,244,328);
   c.fillStyle='#E6C89C';c.font='600 84px Syne, Arial Black, sans-serif';c.fillText(String(i+1).padStart(2,'0'),24,110);
   c.fillStyle='rgba(242,239,248,.5)';for(let k=0;k<7;k++)c.fillRect(24,150+k*24,150+Math.random()*60,6);
   const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6,3.45),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
   g.add(m);cards.push(m)}
 const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(240,225,200,.5)','rgba(140,150,220,.12)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));core.scale.set(14,14,1);g.add(core);
 g.rotation.x=.25;g.position.copy(anchor(5,side*13,0,0));scene.add(g);
 anim.push(t=>{cards.forEach((m,i)=>{const a=i/13*Math.PI*2+t*.18;m.position.set(Math.cos(a)*8,Math.sin(a*2+t)*.5,Math.sin(a)*8);m.rotation.y=Math.PI/2-a})})}

// Station 6 : trou noir + disque d'accrétion
let disk;
{const g=new THREE.Group();
 const bh=new THREE.Mesh(new THREE.SphereGeometry(4,48,48),new THREE.MeshBasicMaterial({color:0x000000}));g.add(bh);
 const n=mobile?5000:11000,dg=new THREE.BufferGeometry(),dp=new Float32Array(n*3),dc=new Float32Array(n*3);const c1=new THREE.Color('#FBF3E4'),c2=new THREE.Color('#D9C3A0'),c3=new THREE.Color('#5A6AB0'),tmp=new THREE.Color();
 for(let i=0;i<n;i++){const r=5+Math.pow(Math.random(),1.6)*20,a=Math.random()*Math.PI*2;dp[i*3]=Math.cos(a)*r;dp[i*3+1]=(Math.random()-.5)*(.4+r*.04);dp[i*3+2]=Math.sin(a)*r;
   const k=(r-5)/20;tmp.copy(c1).lerp(c2,Math.min(1,k*2));if(k>.5)tmp.lerp(c3,(k-.5)*2);dc[i*3]=tmp.r;dc[i*3+1]=tmp.g;dc[i*3+2]=tmp.b}
 dg.setAttribute('position',new THREE.BufferAttribute(dp,3));dg.setAttribute('color',new THREE.BufferAttribute(dc,3));
 disk=new THREE.Points(dg,new THREE.PointsMaterial({size:.32,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));disk.rotation.x=Math.PI/2.25;g.add(disk);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(245,228,200,.5)','rgba(120,130,200,.15)'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.set(30,30,1);glow.position.z=-1;g.add(glow);g.add(bh);
 g.position.copy(anchor(6,side*11,mobile?-16:-2,mobile?40:30));scene.add(g);
 anim.push(t=>{disk.rotation.z=-t*.18})}

// Interaction souris
let mx=0,my=0,tmx=0,tmy=0;
addEventListener('pointermove',e=>{tmx=(e.clientX/innerWidth-.5)*2;tmy=(e.clientY/innerHeight-.5)*2},{passive:true});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

const clock=new THREE.Clock();const look=new THREE.Vector3();
function frame(){
  const t=clock.getElapsedTime();
  scrollNow+=(scrollTarget-scrollNow)*(reduce?.25:.075);
  const v=scrollNow-lastScroll;lastScroll=scrollNow;velocity+=(Math.abs(v)*60-velocity)*.1;
  mx+=(tmx-mx)*.05;my+=(tmy-my)*.05;
  const ct=Math.min(.999,scrollNow*T_END);
  const p=curve.getPointAt(ct);
  camera.position.set(p.x+mx*1.6,p.y-my*1.1+(reduce?0:Math.sin(t*.6)*.25),p.z+14);
  curve.getPointAt(Math.min(1,ct+.03),look);camera.lookAt(look.x+mx*2,look.y-my*1.5,look.z);
  if(!reduce){camera.rotation.z+=Math.sin(t*.25)*.01+(look.x-p.x)*-.004;
    const warp=Math.min(1,velocity*6);camera.fov=62+warp*24;camera.updateProjectionMatrix();starMat.size=.55+warp*1.4}
  sun.position.set(p.x+10,p.y+12,p.z-6);
  const tt=reduce?0:t;anim.forEach(f=>f(tt,mx,my));
  nebulae.forEach(n=>n.material.rotation+=n.userData.spin);
  stars.rotation.z=reduce?0:t*.004;
  updatePanels();
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
frame();
})();
