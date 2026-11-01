const $=id=>document.getElementById(id);
let S={gold:0,rec:0,prec:0,planeRec:0,planeLevel:1,up:{basket:0,magnet:0,fever:0},own:['skin:gold','bg:night','blk:clay'],skin:'gold',bg:'night',blk:'clay'};
try{Object.assign(S,JSON.parse(localStorage.getItem('zv')||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem('zv',JSON.stringify(S))}catch(e){}};
let snd=S.sound!==false,ac,paused=false;
function toggleSound(){snd=!snd;S.sound=snd;save();$('sound-toggle').textContent=snd?'Звук: включён':'Звук: выключен'}
function beep(f,d=.08,t='sine'){if(!snd)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.value=f;g.gain.value=.06;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.stop(ac.currentTime+d)}catch(e){}}
const SKINS={gold:['Золото',0,'#ffd54a'],neon:['Неон',60,'#4ff'],lava:['Лава',120,'#ff5a2a'],gal:['Галактика',200,'#b38cff'],rain:['Радуга',350,'#f5a'],ice:['Лёд',80,'#9cf'],moss:['Мох',140,'#5e8'],sak:['Сакура',210,'#f9b'],shadow:['Тень',300,'#889'],sun:['Солнце',450,'#fc0']};
const BGS={night:['Ночь',0,['#0b1236','#1a2a6c']],purple:['Космос',90,['#240b3a','#5a2a8c']],sea:['Океан',120,['#04293a','#0a6c8c']],dawn:['Рассвет',180,['#3a1230','#c0504a']]};
const BLKS={clay:['Глина',0,['#e8b86d','#e48a5e','#e49a9a','#9ab0c8']],mint:['Мята и снег',150,['#7fe0c0','#dff','#9ce','#bde']],candy:['Конфета',250,['#ff6b9d','#ffd93d','#6bcbff','#b388ff']]};
const UPS={basket:['Широкая корзина','Ловить проще',3,[30,60,100]],magnet:['Мощный магнит','Работает дольше',2,[40,90]],fever:['Золотая лихорадка','Монеты дают больше',1,[120]]};
const hex=c=>{c=c.replace('#','');if(c.length<6)c=c.split('').map(x=>x+x).join('');return[parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)]};
const shade=(c,a)=>{const[r,g,b]=hex(c),t=a<0?0:255,k=Math.abs(a);return`rgb(${Math.round(r+(t-r)*k)},${Math.round(g+(t-g)*k)},${Math.round(b+(t-b)*k)})`};
const rgba=(c,a)=>{const[r,g,b]=hex(c);return`rgba(${r},${g},${b},${a})`};
const rnd=(a,b)=>a+Math.random()*(b-a);
const cv=$('cv'),cx=cv.getContext('2d');let W,H,mode,run,raf,last;
function size(){const r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2.5);W=r.width;H=r.height;cv.width=Math.round(W*d);cv.height=Math.round(H*d);cx.setTransform(d,0,0,d,0,0)}
function show(id){document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id==id))}
function toMenu(){cancelAnimationFrame(raf);run=0;paused=false;$('over').classList.remove('on');$('pause-screen').classList.remove('on');$('stage-screen').classList.remove('on');$('mr').textContent=S.rec;$('pr').textContent=S.planeRec;$('mg').textContent=S.gold;$('sound-toggle').textContent=snd?'Звук: включён':'Звук: выключен';$('story-progress').textContent=`Открыт уровень ${Math.min(30,S.planeLevel||1)} из 30 · боссы на 10, 20 и 30`;show('menu')}
toMenu();
function again(){mode=='a'?startArc():mode=='plane'?startPlane(PL.type):startPuz()}
function pauseGame(){if(!run||paused)return;paused=true;if(mode=='plane'&&PL)PL.keys={};cancelAnimationFrame(raf);$('pause-screen').classList.add('on')}
function resumeGame(){if(!paused)return;paused=false;$('pause-screen').classList.remove('on');last=performance.now();raf=requestAnimationFrame(mode=='a'?loopA:mode=='plane'?loopPlane:loopP)}
function end(score,rec,gold,key){const nr=score>S[key];if(nr)S[key]=score;S.gold+=gold;save();run=0;paused=false;cancelAnimationFrame(raf);$('pause-screen').classList.remove('on');$('stage-screen').classList.remove('on');$('ot').textContent=nr?'Новый рекорд!':'Игра окончена';$('os').innerHTML=`Счёт: ${score} (рекорд ${S[key]})<br>Золото: +${gold}`;$('over').classList.add('on');beep(200,.4,'sawtooth')}
/* ---------- ARCADE ---------- */
let A;
function startArc(){mode='a';paused=false;show('game');$('over').classList.remove('on');$('pause-screen').classList.remove('on');$('stage-screen').classList.remove('on');$('ban').style.display='';$('hud').style.display='flex';$('ban').textContent='Лови звёзды и драгоценности · не дай им упасть!';size();const bg=BGS[S.bg][2];
A={x:W/2,tx:W/2,txt:[],sq:0,shake:0,items:[],parts:[],score:0,lives:3,coins:0,lvl:1,combo:0,mag:0,fev:0,t:0,sp:0,bw:70+S.up.basket*18,bg,stars:[...Array(70)].map(()=>[Math.random()*W,Math.random()*H,Math.random()*1.5+.5]),flash:0};
run=1;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loopA)}
function spawn(){const r=Math.random(),x=20+Math.random()*(W-40);let t='star';if(r>.82)t='bomb';else if(r>.74)t='coin';else if(r>.68)t='gem';else if(r>.65)t='magnet';else if(r>.63&&A.lives<3)t='heart';A.items.push({x,y:-20,t,v:110+A.lvl*14+Math.random()*40,vr:rnd(-2.5,2.5),ph:rnd(0,6.28)})}
function pop(x,y,c,n=14){for(let i=0;i<n;i++){const a=rnd(0,6.283),v=rnd(40,230);A.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,l:rnd(.4,.9),m:.9,s:rnd(1.5,4.5),c})}A.parts.push({x,y,vx:0,vy:0,l:.35,m:.35,s:0,c,ring:1})}
function ftxt(x,y,t,c){A.txt.push({x,y,s:t,c,l:.9})}
function loopA(n){if(!run)return;const dt=Math.min(.04,(n-last)/1000);last=n;A.t+=dt;A.sp-=dt;
if(A.sp<=0){spawn();A.sp=Math.max(.35,.9-A.lvl*.05)}
A.mag=Math.max(0,A.mag-dt);A.fev=Math.max(0,A.fev-dt);const by=H-70;A.x+=(A.tx-A.x)*Math.min(1,dt*20);
for(const it of A.items){if(A.mag>0&&(it.t=='star'||it.t=='coin'||it.t=='gem')){it.x+=(A.x-it.x)*dt*3;}it.v+=35*dt;it.y+=it.v*dt;
if(!it.d&&it.y>by-10&&it.y<by+20&&Math.abs(it.x-A.x)<A.bw/2){it.d=1;
if(it.t=='bomb'){A.lives--;A.combo=0;A.flash=.3;beep(120,.3,'square');pop(it.x,it.y,'#ff6a55',28);A.shake=.3}
else if(it.t=='heart'){A.lives=Math.min(3,A.lives+1);beep(700)}
else if(it.t=='magnet'){A.mag=5+S.up.magnet*3;beep(600)}
else if(it.t=='coin'){A.coins+=S.up.fever?2:1;beep(900);pop(it.x,it.y,'#fc0')}
else{A.combo++;const m=1+Math.floor(A.combo/5);A.score+=(it.t=='gem'?5:1)*m;beep(520+Math.min(A.combo,12)*30);pop(it.x,it.y,it.t=='gem'?'#b58cff':'#ffe27a');A.sq=1;ftxt(it.x,by-24,'+'+(it.t=='gem'?5:1)*m,'#fff3b0');
const nl=1+Math.floor(A.score/25);if(nl>A.lvl&&nl<=10){A.lvl=nl;A.msg=1.5}}}
else if(it.y>H+20&&!it.d){it.d=1;if(it.t=='star'){A.combo=0}}}
A.items=A.items.filter(i=>!i.d&&i.y<H+30);A.msg=Math.max(0,(A.msg||0)-dt);A.flash=Math.max(0,A.flash-dt);
A.parts.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.ring){p.vy+=360*dt;p.vx*=1-1.5*dt}p.l-=dt});A.txt.forEach(t=>{t.y-=45*dt;t.l-=dt});A.txt=A.txt.filter(t=>t.l>0);A.sq=Math.max(0,A.sq-dt*4);A.shake=Math.max(0,A.shake-dt);A.parts=A.parts.filter(p=>p.l>0);
drawA();const m=1+Math.floor(A.combo/5);
$('hl').innerHTML=`<div style="font-size:28px">${A.score}</div><div style="font-size:13px">Уровень ${A.lvl}/10</div>${m>1?`<div style="color:var(--gold);font-size:13px">Серия ×${m}</div>`:''}`;
$('hr').innerHTML=`<div style="color:#f44;font-size:18px">${'♥'.repeat(A.lives)}</div><div style="color:var(--gold);font-size:13px">● ${A.coins}</div>`;
if(A.lives<=0){end(A.score,0,A.coins,'rec');return}raf=requestAnimationFrame(loopA)}
function starPath(r,ri,n=5){cx.beginPath();for(let k=0;k<n*2;k++){const a=-Math.PI/2+k*Math.PI/n,q=k%2?ri:r;k?cx.lineTo(Math.cos(a)*q,Math.sin(a)*q):cx.moveTo(Math.cos(a)*q,Math.sin(a)*q)}cx.closePath()}
function drawItem(i){const s=i.t;cx.save();cx.translate(i.x,i.y);
if(s=='star'||s=='gem'){const tg=cx.createLinearGradient(0,-70,0,0);tg.addColorStop(0,'rgba(255,255,255,0)');tg.addColorStop(1,s=='gem'?'rgba(181,140,255,.45)':'rgba(255,226,122,.45)');cx.fillStyle=tg;cx.beginPath();cx.moveTo(-7,0);cx.lineTo(7,0);cx.lineTo(0,-70);cx.fill()}
if(s=='star'){cx.rotate(Math.sin(A.t*3+i.ph)*.3);cx.shadowColor='#ffd54a';cx.shadowBlur=20;starPath(18,8);const g=cx.createRadialGradient(-4,-5,1,0,0,19);g.addColorStop(0,'#fffbe0');g.addColorStop(.5,'#ffd23f');g.addColorStop(1,'#f08a1c');cx.fillStyle=g;cx.fill();cx.shadowBlur=0;cx.strokeStyle='rgba(255,255,255,.7)';cx.lineWidth=1.5;cx.lineJoin='round';cx.stroke();cx.fillStyle='rgba(255,255,255,.8)';cx.beginPath();cx.arc(-4,-5,2,0,6.3);cx.fill()}
else if(s=='gem'){cx.rotate(Math.sin(A.t*2+i.ph)*.2);cx.shadowColor='#b58cff';cx.shadowBlur=18;const g=cx.createLinearGradient(-14,-14,14,16);g.addColorStop(0,'#e6fbff');g.addColorStop(.45,'#6fb7ff');g.addColorStop(1,'#8b4dff');cx.beginPath();cx.moveTo(-9,-13);cx.lineTo(9,-13);cx.lineTo(15,-4);cx.lineTo(0,16);cx.lineTo(-15,-4);cx.closePath();cx.fillStyle=g;cx.fill();cx.shadowBlur=0;cx.strokeStyle='rgba(255,255,255,.8)';cx.lineWidth=1.3;cx.stroke();cx.beginPath();cx.moveTo(-15,-4);cx.lineTo(15,-4);cx.moveTo(-5,-4);cx.lineTo(0,-13);cx.lineTo(5,-4);cx.lineTo(0,16);cx.lineTo(-5,-4);cx.stroke()}
else if(s=='coin'){const w=Math.abs(Math.cos(A.t*4+i.ph));cx.scale(.25+w*.75,1);cx.shadowColor='#ffd76a';cx.shadowBlur=14;const g=cx.createRadialGradient(-4,-4,1,0,0,14);g.addColorStop(0,'#fff6b0');g.addColorStop(.6,'#ffc933');g.addColorStop(1,'#c98a0a');cx.beginPath();cx.arc(0,0,13,0,6.3);cx.fillStyle=g;cx.fill();cx.shadowBlur=0;cx.strokeStyle='#fff3b0';cx.lineWidth=2;cx.stroke();cx.strokeStyle='rgba(160,100,0,.55)';cx.lineWidth=1.5;cx.beginPath();cx.arc(0,0,8,0,6.3);cx.stroke()}
else if(s=='bomb'){cx.rotate(Math.sin(A.t*6+i.ph)*.25);cx.shadowColor='#ff3b4f';cx.shadowBlur=18+Math.sin(A.t*12)*6;const g=cx.createRadialGradient(-5,-3,2,0,3,17);g.addColorStop(0,'#6b7390');g.addColorStop(.5,'#232842');g.addColorStop(1,'#07091a');cx.beginPath();cx.arc(0,3,15,0,6.3);cx.fillStyle=g;cx.fill();cx.shadowBlur=0;cx.strokeStyle='#ff5a6a';cx.lineWidth=2;cx.beginPath();cx.moveTo(3,-11);cx.quadraticCurveTo(10,-18,13,-13);cx.stroke();const f=.6+Math.random()*.4;cx.fillStyle='#ffd54a';cx.beginPath();cx.arc(13,-13,4*f+1,0,6.3);cx.fill();cx.fillStyle='rgba(255,255,255,.35)';cx.beginPath();cx.ellipse(-6,-1,4,6,.5,0,6.3);cx.fill();cx.fillStyle='#ff4d5e';cx.font='bold 11px system-ui';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('!',0,5)}
else if(s=='magnet'){cx.rotate(Math.sin(A.t*3+i.ph)*.3);cx.shadowColor='#ff6b6b';cx.shadowBlur=16;cx.lineWidth=9;cx.strokeStyle='#ee3b4a';cx.beginPath();cx.moveTo(-11,-10);cx.lineTo(-11,2);cx.arc(0,2,11,Math.PI,0,true);cx.lineTo(11,-10);cx.stroke();cx.shadowBlur=0;cx.strokeStyle='#e8eefc';cx.beginPath();cx.moveTo(-11,-10);cx.lineTo(-11,-5);cx.moveTo(11,-10);cx.lineTo(11,-5);cx.stroke()}
else{const p=1+Math.sin(A.t*6)*.08;cx.scale(p,p);cx.shadowColor='#ff5d8f';cx.shadowBlur=16;const g=cx.createLinearGradient(0,-12,0,12);g.addColorStop(0,'#ff9ab8');g.addColorStop(1,'#e0215f');cx.beginPath();cx.moveTo(0,11);cx.bezierCurveTo(-19,-2,-12,-16,0,-7);cx.bezierCurveTo(12,-16,19,-2,0,11);cx.fillStyle=g;cx.fill();cx.shadowBlur=0;cx.fillStyle='rgba(255,255,255,.5)';cx.beginPath();cx.ellipse(-6,-6,3,2,-.5,0,6.3);cx.fill()}
cx.restore()}
function drawA(){cx.save();if(A.shake>0)cx.translate(rnd(-1,1)*A.shake*14,rnd(-1,1)*A.shake*14);
const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,A.bg[0]);g.addColorStop(1,A.bg[1]);cx.fillStyle=g;cx.fillRect(-20,-20,W+40,H+40);
[[.2,.25,'rgba(255,255,255,.07)'],[.8,.62,'rgba(120,200,255,.09)']].forEach(([a,b,c],k)=>{const x=W*a+Math.sin(A.t*.2+k)*20,y=H*b,rg=cx.createRadialGradient(x,y,0,x,y,W*.7);rg.addColorStop(0,c);rg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=rg;cx.fillRect(0,0,W,H)});
A.stars.forEach(s=>{s[1]=(s[1]+s[2]*.45)%H;cx.globalAlpha=.3+Math.sin(A.t*2+s[0])*.25;cx.fillStyle=s[2]>1.6?'#cfe8ff':'#fff';cx.fillRect(s[0],s[1],s[2],s[2])});cx.globalAlpha=1;
if(A.flash>0){cx.fillStyle=`rgba(255,40,60,${A.flash})`;cx.fillRect(-20,-20,W+40,H+40)}
const by=H-70,c=SKINS[S.skin][2];
const gg=cx.createRadialGradient(A.x,by+44,4,A.x,by+44,A.bw);gg.addColorStop(0,rgba(c,.4));gg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gg;cx.fillRect(A.x-A.bw,by-30,A.bw*2,120);
A.items.forEach(drawItem);
cx.save();cx.globalCompositeOperation='lighter';A.parts.forEach(p=>{const k=Math.max(0,p.l/p.m);cx.globalAlpha=k;if(p.ring){cx.strokeStyle=p.c;cx.lineWidth=3*k+1;cx.beginPath();cx.arc(p.x,p.y,(1-k)*46+6,0,6.3);cx.stroke()}else{cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.s*(.4+k*.6),0,6.3);cx.fill()}});cx.restore();cx.globalAlpha=1;
cx.textAlign='center';cx.textBaseline='middle';cx.font='bold 20px system-ui';cx.lineWidth=4;cx.strokeStyle='rgba(0,0,0,.45)';A.txt.forEach(t=>{cx.globalAlpha=Math.min(1,t.l/.5);cx.strokeText(t.s,t.x,t.y);cx.fillStyle=t.c;cx.fillText(t.s,t.x,t.y)});cx.globalAlpha=1;
const tilt=Math.max(-.25,Math.min(.25,(A.tx-A.x)/120)),sq=A.sq;
cx.save();cx.translate(A.x,by);cx.rotate(tilt);cx.scale(1+sq*.1,1-sq*.12);const bw=A.bw;
cx.shadowColor=c;cx.shadowBlur=20;cx.beginPath();cx.ellipse(0,0,bw/2,8,0,0,6.3);cx.fillStyle=shade(c,-.7);cx.fill();cx.shadowBlur=0;
let fill;if(S.skin=='rain'){fill=cx.createLinearGradient(-bw/2,0,bw/2,0);['#f55','#fc0','#5e8','#5cf','#b6f'].forEach((k,i)=>fill.addColorStop(i/4,k))}else{fill=cx.createLinearGradient(0,0,0,40);fill.addColorStop(0,shade(c,.4));fill.addColorStop(.5,c);fill.addColorStop(1,shade(c,-.5))}
cx.beginPath();cx.moveTo(-bw/2,0);cx.quadraticCurveTo(-bw*.42,34,0,40);cx.quadraticCurveTo(bw*.42,34,bw/2,0);cx.ellipse(0,0,bw/2,8,0,0,Math.PI,false);cx.closePath();cx.fillStyle=fill;cx.fill();cx.strokeStyle='rgba(255,255,255,.55)';cx.lineWidth=2;cx.stroke();
cx.strokeStyle='rgba(255,255,255,.18)';cx.lineWidth=1.5;for(let k=-2;k<=2;k++){cx.beginPath();cx.moveTo(k*bw*.16,6);cx.quadraticCurveTo(k*bw*.1,24,k*bw*.04,37);cx.stroke()}
cx.strokeStyle='rgba(255,255,255,.75)';cx.lineWidth=3;cx.lineCap='round';cx.beginPath();cx.ellipse(0,0,bw/2,8,0,Math.PI*1.08,Math.PI*1.9);cx.stroke();
cx.fillStyle='rgba(255,255,255,.35)';cx.beginPath();cx.ellipse(-bw*.28,14,bw*.05,9,.5,0,6.3);cx.fill();
cx.restore();
if(A.mag>0){cx.save();cx.globalAlpha=.55+Math.sin(A.t*10)*.25;cx.strokeStyle='#ff8a8a';cx.shadowColor='#f55';cx.shadowBlur=12;cx.lineWidth=3;cx.setLineDash([8,6]);cx.lineDashOffset=-A.t*40;cx.beginPath();cx.arc(A.x,by+10,A.bw/2+16,Math.PI,0);cx.stroke();cx.restore()}
if(A.msg>0){cx.save();cx.globalAlpha=Math.min(1,A.msg);cx.shadowColor='#ffd76a';cx.shadowBlur=24;cx.fillStyle='#fff3b0';cx.font='bold 36px system-ui';cx.textAlign='center';cx.fillText('Уровень '+A.lvl,W/2,H/2);cx.restore()}
cx.restore()}
function moveBasket(e){if(mode=='a'&&run&&!paused){A.tx=Math.max(A.bw/2,Math.min(W-A.bw/2,e.clientX-cv.getBoundingClientRect().left))}}
cv.addEventListener('pointermove',moveBasket);
cv.addEventListener('pointerdown',e=>{if(mode=='a'&&run){cv.setPointerCapture(e.pointerId);moveBasket(e)}});
function movePlane(e){if(mode=='plane'&&run&&!paused){const r=cv.getBoundingClientRect();PL.tx=Math.max(24,Math.min(W-24,e.clientX-r.left));PL.ty=Math.max(78,Math.min(H-36,e.clientY-r.top))}}
cv.addEventListener('pointermove',movePlane);
cv.addEventListener('pointerdown',e=>{if(mode=='plane'&&run){cv.setPointerCapture(e.pointerId);movePlane(e)}});
addEventListener('keydown',e=>{if(e.key=='Escape'||e.key==' '){if(paused){e.preventDefault();resumeGame()}else if(mode&&run){e.preventDefault();pauseGame()}return}
if(mode=='a'&&run&&!paused&&['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)){e.preventDefault();const step=Math.max(22,A.bw*.38);if(e.key=='ArrowLeft'||e.key=='a'||e.key=='A')A.tx=Math.max(A.bw/2,A.tx-step);else A.tx=Math.min(W-A.bw/2,A.tx+step)}
if(mode=='plane'&&PL&&!paused){const k=e.key.toLowerCase(),dir={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'}[e.key]||{a:'left',d:'right',w:'up',s:'down'}[k];if(dir){e.preventDefault();PL.keys[dir]=true}}});
addEventListener('keyup',e=>{if(mode!='plane'||!PL)return;const k=e.key.toLowerCase(),dir={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'}[e.key]||{a:'left',d:'right',w:'up',s:'down'}[k];if(dir)PL.keys[dir]=false});
/* ---------- PUZZLE ---------- */
const N=5,SH=[[[0,0]],[[0,0],[1,0]],[[0,0],[0,1]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[1,0],[0,1]],[[0,0],[1,0],[1,1]],[[1,0],[0,1],[1,1]],[[0,0],[0,1],[1,1]],[[0,0],[1,0],[2,0],[2,1]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[1,1]],[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]];
let P,drag,cs,gx,gy,tray;
function startPuz(){mode='p';paused=false;drag=null;show('game');$('over').classList.remove('on');$('pause-screen').classList.remove('on');$('stage-screen').classList.remove('on');$('ban').style.display='';$('ban').textContent='Перетащи фигуру на поле · заполни линию, чтобы освободить место';$('hud').style.display='flex';size();
P={g:Array.from({length:N},()=>Array(N).fill(0)),sc:0,pcs:[],msg:'',mt:0,fx:[],shake:0,an:{},lines:[],t:0,combo:0,bg:Array.from({length:60},()=>[Math.random(),Math.random(),Math.random()*1.6+.4])};deal();run=1;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loopP)}
function deal(){for(let tr=0;tr<40;tr++){P.pcs=[0,1,2].map(()=>({s:SH[Math.random()*SH.length|0],c:1+(Math.random()*4|0),used:0,pop:0}));if(anyFit())break}}
function can(s,x,y){return s.every(([a,b])=>{const i=x+a,j=y+b;return i>=0&&j>=0&&i<N&&j<N&&!P.g[j][i]})}
function fits(p){return P.g.some((r,y)=>r.some((_,x)=>can(p.s,x,y)))}
function anyFit(){return P.pcs.some(p=>!p.used&&fits(p))}
function layout(){cs=Math.min((W-44)/N,(H-250)/N,80);gx=(W-cs*N)/2;gy=72;tray=[0,1,2].map(i=>({x:W*(i*2+1)/6,y:gy+cs*N+Math.min(96,cs*1.3)}))}
function place(p,x,y){p.s.forEach(([a,b])=>{P.g[y+b][x+a]=p.c;P.an[(y+b)*N+x+a]=0});let pts=p.s.length;
const rs=[],cl=[];for(let i=0;i<N;i++){if(P.g[i].every(v=>v))rs.push(i);if(P.g.every(r=>r[i]))cl.push(i)}
const cleared=new Map();rs.forEach(i=>{for(let u=0;u<N;u++)cleared.set(i*N+u,P.g[i][u])});cl.forEach(i=>{for(let v=0;v<N;v++)cleared.set(v*N+i,P.g[v][i])});
rs.forEach(i=>{for(let u=0;u<N;u++)P.g[i][u]=0});cl.forEach(i=>{for(let v=0;v<N;v++)P.g[v][i]=0});const k=rs.length+cl.length;
if(k){const colors=BLKS[S.blk][2];let d=0;cleared.forEach((value,index)=>{const c0=index%N,r0=(index/N)|0,px=gx+(c0+.5)*cs,py=gy+(r0+.5)*cs,color=colors[value-1];P.fx.push({x:px,y:py,t:-d*.025,life:.45,color,ring:1});d++;for(let j=0;j<9;j++){const a=Math.random()*6.283,v=50+Math.random()*220;P.fx.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,t:-d*.02,life:.4+Math.random()*.4,color,size:2+Math.random()*4})}});
rs.forEach(i=>P.lines.push({row:i,t:0}));cl.forEach(i=>P.lines.push({col:i,t:0}));P.combo++;const gain=k*10*k+(P.combo-1)*5;pts+=gain;P.shake=.12+.06*k;
P.msg=['','Хорошо!','Отлично!','СУПЕР!','НЕВЕРОЯТНО!'][Math.min(k,4)]+'  +'+gain+(P.combo>1?'  · серия ×'+P.combo:'');P.mt=1.3;beep(600+k*100,.2);setTimeout(()=>beep(800+k*100,.15),90)}else{P.combo=0;beep(300,.06)}
P.sc+=pts;if(P.pcs.every(q=>q.used))deal();if(!anyFit()){const finished=P,score=P.sc;setTimeout(()=>{if(mode=='p'&&run&&P===finished)end(score,0,Math.floor(score/10),'prec')},700)}}
function roundPath(x,y,w,h,r){r=Math.min(r,w/2,h/2);cx.beginPath();cx.moveTo(x+r,y);cx.arcTo(x+w,y,x+w,y+h,r);cx.arcTo(x+w,y+h,x,y+h,r);cx.arcTo(x,y+h,x,y,r);cx.arcTo(x,y,x+w,y,r);cx.closePath()}
function drawBlock(x,y,s,color,alpha=1,sc=1){cx.save();cx.globalAlpha=alpha;if(sc!=1){cx.translate(x+s/2,y+s/2);cx.scale(sc,sc);cx.translate(-x-s/2,-y-s/2)}
const r=Math.max(5,s*.24);cx.shadowColor=color;cx.shadowBlur=s*.22;cx.shadowOffsetY=s*.05;roundPath(x,y,s,s,r);let g=cx.createLinearGradient(x,y,x,y+s);g.addColorStop(0,shade(color,.4));g.addColorStop(.55,color);g.addColorStop(1,shade(color,-.4));cx.fillStyle=g;cx.fill();cx.shadowBlur=0;cx.shadowOffsetY=0;
const i=s*.11;roundPath(x+i,y+i,s-2*i,s-2*i,r*.7);g=cx.createLinearGradient(x,y,x+s,y+s);g.addColorStop(0,shade(color,.22));g.addColorStop(1,shade(color,-.22));cx.fillStyle=g;cx.fill();
roundPath(x+s*.17,y+s*.1,s*.66,s*.3,r*.6);const gl=cx.createLinearGradient(0,y+s*.1,0,y+s*.4);gl.addColorStop(0,'rgba(255,255,255,.75)');gl.addColorStop(1,'rgba(255,255,255,.04)');cx.fillStyle=gl;cx.fill();
cx.fillStyle='rgba(255,255,255,.95)';cx.beginPath();cx.arc(x+s*.25,y+s*.26,Math.max(1,s*.04),0,6.3);cx.fill();
roundPath(x,y,s,s,r);cx.strokeStyle='rgba(255,255,255,.4)';cx.lineWidth=Math.max(1,s*.03);cx.stroke();cx.restore()}
function loopP(n){if(!run||paused)return;const dt=Math.min(.04,Math.max(0,(n-last)/1000));last=n;P.t+=dt;layout();cx.textBaseline='alphabetic';
const bg=cx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#3a2a74');bg.addColorStop(.6,'#1a2150');bg.addColorStop(1,'#0e1433');cx.fillStyle=bg;cx.fillRect(0,0,W,H);
const gl=cx.createRadialGradient(W/2,gy+cs*N/2,10,W/2,gy+cs*N/2,W*.85);gl.addColorStop(0,'rgba(140,110,255,.28)');gl.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gl;cx.fillRect(0,0,W,H);
P.bg.forEach(s=>{cx.globalAlpha=.2+.35*Math.abs(Math.sin(P.t*1.3+s[0]*20));cx.fillStyle='#d6dcff';cx.fillRect(s[0]*W,s[1]*H,s[2],s[2])});cx.globalAlpha=1;
let shaking=false;if(P.shake>0){P.shake=Math.max(0,P.shake-dt);cx.save();cx.translate((Math.random()-.5)*P.shake*28,(Math.random()-.5)*P.shake*28);shaking=true}
cx.textAlign='center';cx.save();cx.shadowColor='#8f7bff';cx.shadowBlur=18;cx.fillStyle='#fff';cx.font='bold 38px system-ui';cx.fillText(P.sc,W/2,48);cx.restore();cx.font='13px system-ui';cx.fillStyle='#c8d2ff';cx.textAlign='left';cx.fillText('🏆 '+S.prec,16,26);cx.textAlign='center';
cx.save();cx.shadowColor='rgba(0,0,0,.55)';cx.shadowBlur=26;cx.shadowOffsetY=8;roundPath(gx-10,gy-10,cs*N+20,cs*N+20,24);const pg=cx.createLinearGradient(0,gy,0,gy+cs*N);pg.addColorStop(0,'#2b3572');pg.addColorStop(1,'#161d49');cx.fillStyle=pg;cx.fill();cx.restore();roundPath(gx-10,gy-10,cs*N+20,cs*N+20,24);cx.strokeStyle='rgba(170,185,255,.35)';cx.lineWidth=2;cx.stroke();
const pal=BLKS[S.blk][2];
for(let y=0;y<N;y++)for(let x=0;x<N;x++){const px=gx+x*cs+2,py=gy+y*cs+2,size=cs-4,v=P.g[y][x];if(v){const idx=y*N+x;let sc=1;if(P.an[idx]!==undefined){P.an[idx]+=dt;const k=Math.min(1,P.an[idx]/.24);sc=1+Math.sin(k*Math.PI)*.16-(1-k)*.4;if(k>=1)delete P.an[idx]}drawBlock(px,py,size,pal[v-1],1,sc)}else{roundPath(px,py,size,size,Math.max(5,size*.22));const eg=cx.createLinearGradient(0,py,0,py+size);eg.addColorStop(0,'#1a2150');eg.addColorStop(1,'#26306a');cx.fillStyle=eg;cx.fill();cx.strokeStyle='rgba(255,255,255,.07)';cx.lineWidth=1;cx.stroke()}}
let hx=-1,hy=-1;if(drag){hx=Math.round((drag.px-gx)/cs-drag.w/2);hy=Math.round((drag.py-gy-cs*1.5)/cs-drag.h/2);
if(can(drag.p.s,hx,hy)){const s=drag.p.s,full=(i,j)=>P.g[j][i]||s.some(([a,b])=>hx+a==i&&hy+b==j);cx.save();cx.fillStyle='rgba(255,240,150,.22)';cx.shadowColor='#ffe27a';cx.shadowBlur=14;for(let j=0;j<N;j++){let ok=true;for(let i=0;i<N;i++)if(!full(i,j))ok=false;if(ok){roundPath(gx,gy+j*cs,cs*N,cs,10);cx.fill()}}for(let i=0;i<N;i++){let ok=true;for(let j=0;j<N;j++)if(!full(i,j))ok=false;if(ok){roundPath(gx+i*cs,gy,cs,cs*N,10);cx.fill()}}cx.restore();
s.forEach(([a,b])=>drawBlock(gx+(hx+a)*cs+2,gy+(hy+b)*cs+2,cs-4,pal[drag.p.c-1],.4))}else hx=-1}
if(drag)drag.hx=hx,drag.hy=hy;
P.lines.forEach(l=>{l.t+=dt;const k=l.t/.45;if(k>=1)return;cx.save();cx.globalAlpha=(1-k)*.85;cx.fillStyle='#fff';cx.shadowColor='#fff';cx.shadowBlur=26;if(l.row!=null)roundPath(gx,gy+l.row*cs,cs*N,cs,10);else roundPath(gx+l.col*cs,gy,cs,cs*N,10);cx.fill();cx.restore()});P.lines=P.lines.filter(l=>l.t<.45);
tray.forEach(t=>{roundPath(t.x-W/6+6,t.y-cs*.85,W/3-12,cs*1.7,20);cx.fillStyle='rgba(255,255,255,.045)';cx.fill();cx.strokeStyle='rgba(255,255,255,.07)';cx.lineWidth=1;cx.stroke()});
P.pcs.forEach((p,i)=>{if(p.used)return;const t=tray[i],bw=Math.max(...p.s.map(q=>q[0]))+1,bh=Math.max(...p.s.map(q=>q[1]))+1;
if(drag&&drag.p==p){const k2=cs;cx.save();cx.fillStyle='rgba(0,0,0,.25)';cx.beginPath();cx.ellipse(drag.px,drag.py-cs*1.5+bh*k2/2+8,bw*k2*.45,8,0,0,6.3);cx.fill();cx.restore();p.s.forEach(([a,b])=>drawBlock(drag.px-bw*k2/2+a*k2,drag.py-cs*1.5-bh*k2/2+b*k2,k2-3,pal[p.c-1],1,1.04))}
else{p.pop=Math.min(1,(p.pop||0)+dt*4);const k=Math.min(cs*.55,(W/3-20)/bw,cs*1.5/bh),e=1-Math.pow(1-p.pop,3),bob=Math.sin(P.t*2+i)*2,ok=fits(p);cx.save();cx.translate(t.x,t.y+bob);cx.scale(.4+.6*e,.4+.6*e);cx.translate(-t.x,-t.y-bob);p.s.forEach(([a,b])=>drawBlock(t.x-bw*k/2+a*k,t.y+bob-bh*k/2+b*k,k-2,pal[p.c-1],ok?1:.4));cx.restore()}});
P.fx.forEach(f=>{f.t+=dt;if(f.t<0)return;if(f.size){f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=140*dt;f.vx*=1-1.2*dt;cx.globalAlpha=Math.max(0,1-f.t/f.life);cx.fillStyle=f.color;cx.shadowColor=f.color;cx.shadowBlur=10;cx.beginPath();cx.arc(f.x,f.y,Math.max(.1,f.size*(1-f.t/f.life)),0,6.283);cx.fill();cx.shadowBlur=0;cx.globalAlpha=1}else{const k=Math.min(1,f.t/f.life);cx.globalAlpha=1-k;cx.strokeStyle=f.color;cx.lineWidth=4*(1-k)+.5;cx.shadowColor=f.color;cx.shadowBlur=16;cx.beginPath();cx.arc(f.x,f.y,cs*.18+cs*.8*k,0,6.283);cx.stroke();cx.globalAlpha=1;cx.shadowBlur=0}});P.fx=P.fx.filter(f=>f.t<f.life);
cx.fillStyle='rgba(255,255,255,.55)';cx.font='13px system-ui';cx.textAlign='center';cx.fillText('Перетащи фигуру на поле и собирай линии',W/2,H-14);
if(P.mt>0){P.mt=Math.max(0,P.mt-dt);const k=Math.min(1,P.mt/1.3);cx.save();cx.globalAlpha=Math.min(1,P.mt*2);const sc=1+(1-k)*.08;cx.translate(W/2,gy+cs*N/2-(1-k)*30);cx.scale(sc,sc);cx.shadowColor='#ffd54a';cx.shadowBlur=25;cx.fillStyle='#fff2a8';cx.font='900 28px system-ui';cx.textAlign='center';cx.fillText(P.msg,0,0);cx.restore()}
if(shaking)cx.restore();
$('hl').innerHTML=`<div style="font-size:13px;color:#c8d2ff">БЛОК-ПАЗЛ 5×5</div>`;$('hr').innerHTML=`<div style="font-size:13px;color:#ffd76a">Рекорд ${S.prec}</div>`;
raf=requestAnimationFrame(loopP)}
cv.addEventListener('pointerdown',e=>{if(mode!='p'||!run||paused)return;const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
tray.forEach((t,i)=>{const p=P.pcs[i];if(!p.used&&Math.abs(x-t.x)<W/6&&Math.abs(y-t.y)<cs*1.8){drag={p,px:x,py:y,w:Math.max(...p.s.map(q=>q[0]))+1,h:Math.max(...p.s.map(q=>q[1]))+1};cv.setPointerCapture(e.pointerId)}})});
cv.addEventListener('pointermove',e=>{if(drag&&!paused){const r=cv.getBoundingClientRect();drag.px=e.clientX-r.left;drag.py=e.clientY-r.top}});
cv.addEventListener('pointerup',()=>{if(drag&&!paused){if(drag.hx>=0)place(drag.p,drag.hx,drag.hy);drag=null}});
cv.addEventListener('pointercancel',()=>{drag=null});
/* ---------- STAR PILOT ---------- */
let PL;
const BOSS_NAMES=['КОМЕТА-КРУШИТЕЛЬ','ДВОЙНОЕ ЯДРО','КОРОЛЕВА ЗАТМЕНИЯ'];
function startPlane(type,level){mode='plane';paused=false;show('game');$('over').classList.remove('on');$('pause-screen').classList.remove('on');$('stage-screen').classList.remove('on');$('ban').style.display='';$('hud').style.display='flex';$('ban').textContent=type=='story'?'СЮЖЕТНАЯ КАМПАНИЯ · Орудия стреляют автоматически':'БЕСКОНЕЧНЫЙ ПОЛЁТ · продержись как можно дольше';size();
PL={type,level:level||(type=='story'?Math.min(30,Math.max(1,S.planeLevel||1)):1),score:0,pendingGold:0,kills:0,lives:3,px:W/2,py:H*.77,bullets:[],hostile:[],enemies:[],fx:[],stars:Array.from({length:95},()=>[Math.random()*W,Math.random()*H,.4+Math.random()*1.8]),spawn:0,shot:0,t:0,shake:0,invuln:0,boss:null,keys:{},wl:0,wt:0,shield:0,slow:0,combo:0,ct:0,flash:0,items:[],bank:0,vx:0,vy:0,finale:0};initPlaneLevel();run=1;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loopPlane)}
function initPlaneLevel(){PL.kills=0;PL.spawn=.5;PL.shot=0;PL.bullets=[];PL.hostile=[];PL.enemies=[];PL.boss=null;PL.invuln=Math.max(PL.invuln,.8);PL.px=W/2;PL.py=H*.77;PL.tx=PL.px;PL.ty=PL.py;PL.vx=PL.vy=0;PL.items=[];PL.finale=0;PL.fx=PL.fx.filter(f=>f.kind!='text');
if(PL.level%10===0){const kind=(Math.floor(PL.level/10)-1)%BOSS_NAMES.length;PL.boss={kind,name:BOSS_NAMES[kind],x:W/2,y:Math.max(110,H*.2),hp:100+PL.level*11,max:100+PL.level*11,t:0,fire:1,phase:1};PL.enemies.push({type:'escort',x:W*.25,y:PL.boss.y+45,hp:3,v:55,fire:1.5,t:0});PL.enemies.push({type:'escort',x:W*.75,y:PL.boss.y+45,hp:3,v:55,fire:2,t:0})}
else PL.goal=5+Math.floor(PL.level*.8)}
function nextPlaneStage(){if(!PL)return;$('stage-screen').classList.remove('on');if(PL.type=='story'&&PL.level>=30){end(PL.score,0,PL.pendingGold,'planeRec');return}PL.level++;if(PL.type=='story'){S.planeLevel=Math.max(S.planeLevel,PL.level);save()}initPlaneLevel();$('ban').textContent=PL.type=='story'?'СЮЖЕТНАЯ КАМПАНИЯ · Орудия стреляют автоматически':'БЕСКОНЕЧНЫЙ ПОЛЁТ · продержись как можно дольше';run=1;last=performance.now();raf=requestAnimationFrame(loopPlane)}
function clearPlaneStage(bossDefeated){if(!run)return;run=0;cancelAnimationFrame(raf);const reward=10+PL.level*2;PL.pendingGold+=reward;S.gold+=PL.pendingGold;PL.pendingGold=0;
if(PL.type=='story')S.planeLevel=Math.max(S.planeLevel,Math.min(30,PL.level+1));save();
if(PL.type=='endless'){PL.level++;initPlaneLevel();run=1;last=performance.now();raf=requestAnimationFrame(loopPlane);return}
$('stage-title').textContent=PL.level>=30?'Галактика спасена!':bossDefeated?'Босс повержен!':'Уровень пройден!';
$('stage-copy').textContent=`Уровень ${PL.level} завершён. Награда: ${reward} 🟡${PL.level>=30?' · Ты прошёл всю кампанию!':''}`;$('stage-next').textContent=PL.level>=30?'Завершить кампанию':'Следующий уровень';$('stage-screen').classList.add('on');beep(bossDefeated?880:680,.2)}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function fxp(o){if(PL.fx.length>700)PL.fx.splice(0,80);PL.fx.push(Object.assign({t:0,life:.5,size:3,vx:0,vy:0,drag:2.5,kind:'spark'},o))}
function planeBurst(x,y,color,count=14){for(let i=0;i<count;i++){const a=rnd(0,6.283),v=rnd(40,230);fxp({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rnd(.3,.85),size:rnd(1.5,4.5),color})}}
function boom(x,y,color,big=1){planeBurst(x,y,color,Math.round(18*big));planeBurst(x,y,'#fff4c2',Math.round(8*big));fxp({x,y,kind:'ring',life:.45,size:10*big,color:'#ffffff',grow:140*big});fxp({x,y,kind:'ring',life:.7,size:6*big,color,grow:90*big});fxp({x,y,kind:'flash',life:.2,size:34*big,color:'#fff0b0'});
for(let i=0;i<Math.round(6*big);i++){const a=rnd(0,6.283),v=rnd(30,150);fxp({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,kind:'shard',life:rnd(.6,1.2),size:rnd(3,7),rot:rnd(0,6.28),vr:rnd(-9,9),color,drag:1.1})}
for(let i=0;i<Math.round(5*big);i++)fxp({x:x+rnd(-8,8),y:y+rnd(-8,8),vx:rnd(-30,30),vy:rnd(-30,30),kind:'smoke',life:rnd(.7,1.3),size:rnd(8,16)*big,color:'#8a7aa8',drag:1.5})}
function planeShot(x,y,vx,vy,owner='player',r=4){(owner=='player'?PL.bullets:PL.hostile).push({x,y,vx,vy,r})}
function hitPlane(){if(PL.invuln>0)return;if(PL.shield>0){PL.shield=0;PL.invuln=.7;PL.shake=.2;fxp({x:PL.px,y:PL.py,kind:'ring',life:.5,size:24,color:'#7fe9ff',grow:170});planeBurst(PL.px,PL.py,'#7fe9ff',20);beep(300,.15,'triangle');return}
PL.lives--;PL.invuln=1.6;PL.shake=.42;PL.flash=.28;PL.wl=Math.max(0,PL.wl-1);PL.combo=0;PL.vy+=160;boom(PL.px,PL.py,'#ff738f',1.1);beep(145,.22,'square');if(PL.lives<=0)end(PL.score,0,PL.pendingGold,'planeRec')}
function pickup(t){const lab={w:['ОРУДИЯ ▲','#ffe27a'],s:['ЩИТ','#7fe9ff'],h:['+♥','#ff8fb0']}[t];if(t=='w'){PL.wl=Math.min(2,PL.wl+1);PL.wt=14}else if(t=='s')PL.shield=14;else PL.lives=Math.min(5,PL.lives+1);
fxp({x:PL.px,y:PL.py-26,kind:'text',text:lab[0],life:1,vy:-55,drag:1.5,color:lab[1],size:16});fxp({x:PL.px,y:PL.py,kind:'ring',life:.45,size:10,color:lab[1],grow:120});planeBurst(PL.px,PL.py,lab[1],14);beep(880,.1,'triangle')}
function killEnemy(e){e.dead=true;PL.kills++;PL.combo++;PL.ct=2.5;const mult=1+Math.min(4,Math.floor(PL.combo/4)),gain=(e.type=='tank'?30:12)*mult;PL.score+=gain;PL.pendingGold++;
const col=e.type=='tank'?'#ff875a':e.type=='dart'?'#c58cff':'#64dcff';boom(e.x,e.y,col,e.type=='tank'?1.15:.7);fxp({x:e.x,y:e.y-10,kind:'text',text:'+'+gain,life:.8,vy:-50,drag:1.5,color:'#fff4b0',size:15});
if(Math.random()<(e.type=='tank'?.22:.07)){const r=Math.random();PL.items.push({x:e.x,y:e.y,t:r<.5?'w':(r<.8||PL.lives>=4)?'s':'h',ph:rnd(0,6)})}PL.shake=Math.max(PL.shake,.08);beep(410,.04)}
function loopPlane(n){if(!run||paused)return;let dt=Math.min(.04,Math.max(0,(n-last)/1000));last=n;if(PL.slow>0){PL.slow-=dt;dt*=.4}
PL.t+=dt;PL.shot-=dt;PL.invuln=Math.max(0,PL.invuln-dt);PL.shake=Math.max(0,PL.shake-dt);PL.flash=Math.max(0,PL.flash-dt);PL.shield=Math.max(0,PL.shield-dt);PL.wt=Math.max(0,PL.wt-dt);if(PL.wt<=0)PL.wl=0;PL.ct-=dt;if(PL.ct<=0)PL.combo=0;
const K=PL.keys,spd=380*dt;if(K.left)PL.tx-=spd;if(K.right)PL.tx+=spd;if(K.up)PL.ty-=spd;if(K.down)PL.ty+=spd;PL.tx=clamp(PL.tx,24,W-24);PL.ty=clamp(PL.ty,78,H-36);
PL.vx+=((PL.tx-PL.px)*150-PL.vx*19)*dt;PL.vy+=((PL.ty-PL.py)*150-PL.vy*19)*dt;PL.px=clamp(PL.px+PL.vx*dt,24,W-24);PL.py=clamp(PL.py+PL.vy*dt,78,H-36);PL.bank+=(PL.vx/380-PL.bank)*Math.min(1,dt*10);
const sp=1+(H-PL.py)/H*.8;PL.stars.forEach(s=>{s[1]=(s[1]+(30+s[2]*55)*sp*dt)%(H||1)});
if(PL.shot<=0){const wl=PL.wl,c=PL.px,y=PL.py-17;if(wl==0){planeShot(c-8,y,-12,-540);planeShot(c+8,y,12,-540);PL.shot=.19}else if(wl==1){planeShot(c,y-4,0,-580);planeShot(c-11,y,-40,-540);planeShot(c+11,y,40,-540);PL.shot=.17}else{[-90,-45,0,45,90].forEach((vx,i)=>planeShot(c+vx/9,y-(i==2?5:0),vx,-560));PL.shot=.15}fxp({x:c,y:y-3,kind:'flash',life:.08,size:10,color:'#aef'})}
fxp({x:PL.px+rnd(-3,3),y:PL.py+17,vx:rnd(-14,14)-PL.vx*.12,vy:rnd(90,170),life:rnd(.2,.4),size:rnd(2,4.5),color:Math.random()<.5?'#6fe7ff':'#b390ff',drag:.5});
if(!PL.boss&&PL.kills<PL.goal){PL.spawn-=dt;if(PL.spawn<=0){const level=PL.level,roll=Math.random(),type=level<3||roll<.58?'scout':roll<.83?'dart':'tank';PL.enemies.push({type,x:24+Math.random()*(W-48),y:-28,hp:type=='tank'?4:type=='dart'?2:1,v:(55+level*5)*(type=='dart'?1.5:type=='tank'?.72:1),fire:.9+Math.random()*1.8,t:Math.random()*6});PL.spawn=Math.max(.35,1.15-level*.025)}}
for(const e of PL.enemies){e.t=(e.t||0)+dt;e.hit=Math.max(0,(e.hit||0)-dt);e.kb=(e.kb||0)*Math.max(0,1-6*dt);e.y+=(e.v-e.kb)*dt;const px0=e.x;if(e.type=='dart')e.x+=Math.sin(e.t*3)*55*dt;else if(e.type=='scout')e.x+=Math.sin(e.t*1.5)*18*dt;e.vx=(e.x-px0)/(dt||1);e.x=Math.max(18,Math.min(W-18,e.x));e.fire-=dt;
if(Math.random()<.3)fxp({x:e.x,y:e.y-14,vx:rnd(-8,8),vy:-rnd(20,70),life:rnd(.2,.35),size:rnd(1.5,3),color:e.type=='tank'?'#ff9a5a':'#7fe7ff',drag:.5});
if(e.fire<=0&&e.y>20&&e.y<H*.62){const dx=PL.px-e.x,dy=PL.py-e.y,d=Math.hypot(dx,dy)||1;planeShot(e.x,e.y+10,dx/d*145,dy/d*145,'enemy',5);e.fire=Math.max(.8,2.4-PL.level*.035)}
if(e.y>H+30)e.dead=true;if(!e.dead&&Math.hypot(e.x-PL.px,e.y-PL.py)<24){e.dead=true;boom(e.x,e.y,'#ff9a6a',.8);hitPlane()}}
for(const b of PL.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<-20||b.x<-20||b.x>W+20)b.dead=true;for(const e of PL.enemies)if(!e.dead&&Math.hypot(b.x-e.x,b.y-e.y)<(e.type=='tank'?23:17)){b.dead=true;e.hp--;e.hit=.08;e.kb=(e.kb||0)+(e.type=='tank'?35:110);planeBurst(b.x,b.y,e.type=='tank'?'#ffab69':'#76eeff',4);fxp({x:b.x,y:b.y,kind:'flash',life:.1,size:9,color:'#fff'});if(e.hp<=0)killEnemy(e);break}}
if(PL.boss){const b=PL.boss;b.t+=dt;b.hit=Math.max(0,(b.hit||0)-dt);b.x=W/2+Math.sin(b.t*(b.kind==1?1.1:.7))*W*.31;b.y=Math.max(90,H*.17+Math.sin(b.t*1.7)*12);b.phase=b.hp<b.max*.48?2:1;b.fire-=dt;
if(b.phase==2&&Math.random()<.5)fxp({x:b.x+rnd(-40,40),y:b.y+rnd(-10,25),vx:rnd(-15,15),vy:rnd(-20,10),kind:'smoke',life:rnd(.6,1),size:rnd(7,13),color:'#5a4a6a',drag:1});
if(b.fire<=0){if(b.kind===0){const dx=PL.px-b.x,dy=PL.py-b.y,d=Math.hypot(dx,dy)||1;[-.24,0,.24].forEach(a=>planeShot(b.x,b.y+30,Math.sin(a)*dx/d*220+Math.cos(a)*130,Math.cos(a)*dy/d*220+Math.sin(a)*130,'enemy',7));b.fire=b.phase==2?.85:1.3}
else if(b.kind===1){const count=b.phase==2?10:7;for(let i=0;i<count;i++){const a=Math.PI*2*i/count+b.t;planeShot(b.x,b.y+24,Math.cos(a)*155,Math.sin(a)*155+60,'enemy',6)}b.fire=b.phase==2?1.05:1.55}
else{const dx=PL.px-b.x,dy=PL.py-b.y,d=Math.hypot(dx,dy)||1;[-.32,-.16,0,.16,.32].forEach(a=>planeShot(b.x,b.y+32,Math.sin(a)*dx/d*245+Math.cos(a)*110,Math.cos(a)*dy/d*245+Math.sin(a)*110,'enemy',6));b.fire=b.phase==2?.7:1.05}fxp({x:b.x,y:b.y+32,kind:'flash',life:.15,size:26,color:'#ffd0e0'})}
for(const shot of PL.bullets)if(!shot.dead&&Math.hypot(shot.x-b.x,shot.y-b.y)<(b.kind==1?52:58)){shot.dead=true;b.hp--;b.hit=.05;if(Math.random()<.5)planeBurst(shot.x,shot.y,b.kind==2?'#e374ff':'#ffb45c',3)}
if(b.hp<=0){PL.score+=250+PL.level*12;PL.pendingGold+=20+Math.floor(PL.level/2);PL.boss=null;PL.hostile=[];PL.enemies.forEach(e=>{boom(e.x,e.y,'#8cf',.8);e.dead=true});PL.finale=1.2;PL.fp={x:b.x,y:b.y};PL.fb=0;PL.slow=1.4;PL.invuln=Math.max(PL.invuln,3);boom(b.x,b.y,'#ffc85e',2.4);PL.shake=.7;beep(960,.3)}
else if(Math.hypot(b.x-PL.px,b.y-PL.py)<64)hitPlane()}
if(PL.finale>0){PL.finale-=dt;PL.fb-=dt;if(PL.fb<=0){PL.fb=.16;boom(PL.fp.x+rnd(-55,55),PL.fp.y+rnd(-35,35),Math.random()<.5?'#ffc85e':'#ff6a5a',rnd(.8,1.4));PL.shake=Math.max(PL.shake,.3);beep(rnd(120,260),.1,'sawtooth')}if(PL.finale<=0){drawPlane();clearPlaneStage(true);return}}
for(const s of PL.hostile){s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.y>H+20||s.y< -20||s.x<-20||s.x>W+20)s.dead=true;if(!s.dead&&Math.hypot(s.x-PL.px,s.y-PL.py)<s.r+14){s.dead=true;fxp({x:s.x,y:s.y,kind:'flash',life:.12,size:14,color:'#ff9db5'});hitPlane()}}
for(const it of PL.items){const dx=PL.px-it.x,dy=PL.py-it.y,d=Math.hypot(dx,dy);it.y+=70*dt;it.x+=Math.sin(PL.t*3+it.ph)*20*dt;if(d<130){it.x+=dx*dt*4;it.y+=dy*dt*4}if(d<28){it.dead=true;pickup(it.t)}if(it.y>H+20)it.dead=true}
PL.bullets=PL.bullets.filter(b=>!b.dead);PL.hostile=PL.hostile.filter(b=>!b.dead);PL.enemies=PL.enemies.filter(e=>!e.dead);PL.items=PL.items.filter(i=>!i.dead);
PL.fx.forEach(f=>{f.t+=dt;if(f.kind=='ring'){f.size+=f.grow*dt;return}f.x+=f.vx*dt;f.y+=f.vy*dt;const d=Math.max(0,1-f.drag*dt);f.vx*=d;f.vy*=d;if(f.rot!=null)f.rot+=f.vr*dt;if(f.kind=='smoke')f.size+=14*dt});PL.fx=PL.fx.filter(f=>f.t<f.life);
if(!run)return;if(!PL.boss&&PL.kills>=PL.goal){clearPlaneStage(false);return}
drawPlane();const mult=1+Math.min(4,Math.floor(PL.combo/4));
$('hl').innerHTML=`<div style="font-size:23px">${PL.score}</div><div style="font-size:12px">${PL.type=='story'?'СЮЖЕТ':'БЕСКОНЕЧНЫЙ'} · УРОВЕНЬ ${PL.level}</div>${mult>1?`<div style="color:var(--gold);font-size:12px">Серия ×${mult}</div>`:''}`;
$('hr').innerHTML=`<div style="color:#ff879d;font-size:17px">${'♥'.repeat(PL.lives)}${PL.shield>0?' 🛡':''}</div><div style="color:#ffd76a;font-size:12px">${PL.boss?`БОСС · ${Math.max(0,Math.ceil(PL.boss.hp))} HP`:`ЦЕЛЬ ${PL.kills}/${PL.goal||0}`}</div>${PL.wl?`<div style="color:#ffe27a;font-size:12px">ОРУДИЯ ${PL.wl+1} · ${Math.ceil(PL.wt)}с</div>`:''}`;
$('ban').textContent=PL.boss?`БОСС ${PL.level} · ${PL.boss.name}`:PL.type=='story'?`СЮЖЕТ · уровень ${PL.level} из 30`:`БЕСКОНЕЧНЫЙ ПОЛЁТ · уровень ${PL.level}`;
raf=requestAnimationFrame(loopPlane)}
const EC={scout:['#9ff4ff','#1e7fd6','#55ddff'],dart:['#e0b8ff','#6a35c8','#bc7cff'],tank:['#ffcfa0','#c4481f','#ff875a'],escort:['#ffb0c0','#b02048','#ff668f']};
const EP={scout:[[0,-18],[10,4],[16,12],[5,8],[0,14],[-5,8],[-16,12],[-10,4]],dart:[[0,-20],[7,-4],[20,10],[8,6],[0,16],[-8,6],[-20,10],[-7,-4]],tank:[[0,-20],[14,-12],[20,2],[14,16],[0,12],[-14,16],[-20,2],[-14,-12]]};
function drawEnemy(e){const c=EC[e.type]||EC.scout,pts=EP[e.type]||EP.scout;cx.save();cx.translate(e.x,e.y);cx.rotate(Math.PI+Math.max(-.4,Math.min(.4,(e.vx||0)/200)));
const fl=7+Math.sin(PL.t*40+e.t)*3;[-4,4].forEach(x=>{const fg=cx.createLinearGradient(0,12,0,12+fl+8);fg.addColorStop(0,'#fff');fg.addColorStop(.4,c[2]);fg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=fg;cx.beginPath();cx.moveTo(x-2.5,12);cx.lineTo(x,12+fl+8);cx.lineTo(x+2.5,12);cx.fill()});
cx.shadowColor=c[2];cx.shadowBlur=16;const gg=cx.createLinearGradient(0,-20,0,16);gg.addColorStop(0,c[0]);gg.addColorStop(1,c[1]);cx.fillStyle=e.hit>0?'#fff':gg;cx.beginPath();pts.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.closePath();cx.fill();cx.shadowBlur=0;cx.strokeStyle='rgba(255,255,255,.55)';cx.lineWidth=1.2;cx.lineJoin='round';cx.stroke();
if(e.type=='tank'){cx.strokeStyle='rgba(60,10,0,.45)';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,9,0,6.3);cx.stroke();cx.fillStyle='rgba(255,255,255,.3)';cx.beginPath();cx.ellipse(-8,-8,4,2,-.7,0,6.3);cx.fill()}
else{cx.strokeStyle='rgba(0,20,60,.4)';cx.lineWidth=1.2;cx.beginPath();cx.moveTo(0,-14);cx.lineTo(0,10);cx.stroke()}
const cg=cx.createLinearGradient(0,-8,0,2);cg.addColorStop(0,'#fff');cg.addColorStop(1,'#12224a');cx.fillStyle=cg;cx.beginPath();cx.ellipse(0,-4,3,5.5,0,0,6.3);cx.fill();
if(e.type=='dart'){cx.fillStyle='#ff4f7a';[-18,18].forEach(x=>{cx.beginPath();cx.arc(x,9,1.8+Math.sin(PL.t*10)*.6,0,6.3);cx.fill()})}
cx.restore()}
function drawBoss(b){cx.save();cx.translate(b.x,b.y);const colors=b.kind==0?['#ffb05b','#d94d6c']:b.kind==1?['#74f2ff','#695cff']:['#f37aff','#692eae'],ac=b.kind==2?'#e65fff':b.kind==1?'#74f2ff':'#ff5a78';
if(b.phase==2){const rg=cx.createRadialGradient(0,0,20,0,0,120);rg.addColorStop(0,'rgba(255,60,90,.0)');rg.addColorStop(.6,`rgba(255,60,90,${.18+Math.sin(PL.t*8)*.08})`);rg.addColorStop(1,'rgba(255,60,90,0)');cx.fillStyle=rg;cx.fillRect(-130,-130,260,260)}
[-1,1].forEach(s=>{const fl=14+Math.sin(PL.t*30+s)*5,fg=cx.createLinearGradient(0,-30,0,-30-fl-14);fg.addColorStop(0,'#fff');fg.addColorStop(.4,ac);fg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=fg;cx.beginPath();cx.moveTo(s*30-6,-34);cx.lineTo(s*30,-34-fl-14);cx.lineTo(s*30+6,-34);cx.fill()});
cx.shadowColor=ac;cx.shadowBlur=26+Math.sin(PL.t*6)*8;const gg=cx.createLinearGradient(0,-46,0,38);gg.addColorStop(0,shade(colors[0],.35));gg.addColorStop(.6,colors[0]);gg.addColorStop(1,shade(colors[1],-.2));cx.fillStyle=b.hit>0?'#fff':gg;cx.beginPath();cx.moveTo(-54,-8);cx.lineTo(-92,24);cx.lineTo(-48,20);cx.lineTo(-25,38);cx.lineTo(0,30);cx.lineTo(25,38);cx.lineTo(48,20);cx.lineTo(92,24);cx.lineTo(54,-8);cx.lineTo(37,-34);cx.lineTo(0,-46);cx.lineTo(-37,-34);cx.closePath();cx.fill();cx.shadowBlur=0;cx.strokeStyle='rgba(255,255,255,.5)';cx.lineWidth=2;cx.lineJoin='round';cx.stroke();
cx.strokeStyle='rgba(30,0,40,.35)';cx.lineWidth=2;cx.beginPath();cx.moveTo(-54,-8);cx.lineTo(-30,14);cx.moveTo(54,-8);cx.lineTo(30,14);cx.moveTo(-37,-34);cx.lineTo(-20,-8);cx.moveTo(37,-34);cx.lineTo(20,-8);cx.stroke();
const cg=cx.createRadialGradient(-6,-14,2,0,-7,30);cg.addColorStop(0,shade(colors[1],.5));cg.addColorStop(1,shade(colors[1],-.4));cx.fillStyle=cg;cx.beginPath();cx.ellipse(0,-7,26,28,0,0,6.3);cx.fill();
const pulse=1+Math.sin(PL.t*7)*.15;cx.shadowColor='#fff5bc';cx.shadowBlur=14;cx.fillStyle='#fff5bc';cx.beginPath();cx.ellipse(-11,-9,5*pulse,8*pulse,0,0,6.3);cx.ellipse(11,-9,5*pulse,8*pulse,0,0,6.3);cx.fill();cx.shadowBlur=0;
for(let i=0;i<(b.kind==1?2:1);i++){cx.strokeStyle=colors[0];cx.lineWidth=3;cx.beginPath();cx.arc((i?1:-1)*31,-8,12+Math.sin(PL.t*7+i)*3,0,6.3);cx.stroke()}
cx.restore();
const bx=W*.17,bw=W*.66;cx.fillStyle='rgba(255,255,255,.14)';roundPath(bx,65,bw,9,5);cx.fill();const grad=cx.createLinearGradient(bx,0,bx+bw,0);grad.addColorStop(0,'#ff4e78');grad.addColorStop(.5,'#ffcf65');grad.addColorStop(1,'#ff5ec4');cx.fillStyle=grad;cx.save();cx.shadowColor='#ff4e78';cx.shadowBlur=10;roundPath(bx,65,Math.max(2,bw*Math.max(0,b.hp/b.max)),9,5);cx.fill();cx.restore()}
function drawShip(){const bank=PL.bank;cx.save();cx.translate(PL.px,PL.py);cx.rotate(bank*.3);cx.scale(1-Math.abs(bank)*.18,1);
const fl=11+Math.sin(PL.t*45)*4+Math.max(0,-PL.vy)*.025;[-4.5,4.5].forEach(x=>{const fg=cx.createLinearGradient(0,17,0,17+fl+8);fg.addColorStop(0,'#fff');fg.addColorStop(.35,'#55e6ff');fg.addColorStop(1,'rgba(142,96,255,0)');cx.fillStyle=fg;cx.shadowColor='#4cecff';cx.shadowBlur=18;cx.beginPath();cx.moveTo(x-3,17);cx.lineTo(x,17+fl+8);cx.lineTo(x+3,17);cx.closePath();cx.fill()});
if(PL.wl>0){cx.shadowBlur=8;cx.fillStyle='#ffe27a';[-1,1].forEach(s=>{cx.fillRect(s*16-1.5,-6,3,14);if(PL.wl>1)cx.fillRect(s*21-1.5,-2,3,12)})}
cx.shadowColor='#4cecff';cx.shadowBlur=20;const g=cx.createLinearGradient(0,-21,0,19);g.addColorStop(0,'#f2ffff');g.addColorStop(.45,'#58d6ff');g.addColorStop(1,'#3a4fe0');cx.fillStyle=g;
cx.beginPath();cx.moveTo(0,-21);cx.lineTo(8,3);cx.lineTo(24,13);cx.lineTo(12,14);cx.lineTo(8,8);cx.lineTo(6,19);cx.lineTo(-6,19);cx.lineTo(-8,8);cx.lineTo(-12,14);cx.lineTo(-24,13);cx.lineTo(-8,3);cx.closePath();cx.fill();cx.shadowBlur=0;cx.strokeStyle='rgba(255,255,255,.65)';cx.lineWidth=1.2;cx.lineJoin='round';cx.stroke();
cx.strokeStyle='rgba(10,30,100,.35)';cx.lineWidth=1.3;cx.beginPath();cx.moveTo(-8,3);cx.lineTo(-18,12);cx.moveTo(8,3);cx.lineTo(18,12);cx.moveTo(0,-14);cx.lineTo(0,18);cx.stroke();
const pl=.6+Math.sin(PL.t*8)*.4;cx.fillStyle=`rgba(255,79,122,${pl})`;cx.shadowColor='#ff4f7a';cx.shadowBlur=8;[-23,23].forEach(x=>{cx.beginPath();cx.arc(x,13,2.3,0,6.3);cx.fill()});cx.shadowBlur=0;
const cg=cx.createLinearGradient(0,-12,0,8);cg.addColorStop(0,'#bff4ff');cg.addColorStop(1,'#0e2e6e');cx.fillStyle=cg;cx.beginPath();cx.ellipse(0,-2,4.5,10,0,0,6.3);cx.fill();cx.fillStyle='rgba(255,255,255,.75)';cx.beginPath();cx.ellipse(-1.3,-6,1.4,4,0,0,6.3);cx.fill();cx.restore();
if(PL.shield>0&&(PL.shield>3||Math.floor(PL.t*10)%2==0)){cx.save();cx.translate(PL.px,PL.py);const rg=cx.createRadialGradient(0,0,14,0,0,34);rg.addColorStop(0,'rgba(127,233,255,0)');rg.addColorStop(.8,`rgba(127,233,255,${.18+Math.sin(PL.t*6)*.06})`);rg.addColorStop(1,'rgba(180,250,255,.7)');cx.fillStyle=rg;cx.beginPath();cx.arc(0,0,34,0,6.3);cx.fill();cx.strokeStyle='rgba(200,250,255,.6)';cx.lineWidth=1.5;cx.beginPath();cx.arc(0,0,33,PL.t*2,PL.t*2+2.4);cx.stroke();cx.restore()}}
function drawPlane(){cx.save();cx.textBaseline='alphabetic';if(PL.shake>0)cx.translate(rnd(-1,1)*PL.shake*24,rnd(-1,1)*PL.shake*24);
const g=cx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#071331');g.addColorStop(.58,'#17265a');g.addColorStop(1,'#371d65');cx.fillStyle=g;cx.fillRect(-30,-30,W+60,H+60);
for(let i=0;i<3;i++){const x=W*(.2+i*.34)+Math.sin(PL.t*.16+i*3)*W*.08,y=H*(.2+i*.26),rg=cx.createRadialGradient(x,y,0,x,y,W*.3);rg.addColorStop(0,['#2463a533','#9435b533','#1bc7d522'][i]);rg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=rg;cx.fillRect(0,0,W,H)}
const hue=(PL.level*47)%360,pY=((PL.t*9)%(H+420))-210,pX=W*(.2+(PL.level*37%60)/100);cx.save();cx.globalAlpha=.6;const pg=cx.createRadialGradient(pX-22,pY-22,4,pX,pY,70);pg.addColorStop(0,`hsl(${hue} 70% 65%)`);pg.addColorStop(.6,`hsl(${hue} 55% 35%)`);pg.addColorStop(1,`hsl(${hue} 60% 12%)`);cx.fillStyle=pg;cx.beginPath();cx.arc(pX,pY,64,0,6.3);cx.fill();cx.strokeStyle=`hsla(${hue+30},60%,75%,.5)`;cx.lineWidth=5;cx.beginPath();cx.ellipse(pX,pY,102,20,-.4,0,6.3);cx.stroke();cx.restore();
const spd=1+(H-PL.py)/H*.8;PL.stars.forEach(s=>{cx.globalAlpha=.35+Math.sin(PL.t*2+s[0])*.25;cx.fillStyle=s[2]>1.5?'#fff':'#bfe3ff';cx.fillRect(s[0],s[1],s[2],s[2]*(2.4+s[2]*spd*1.2))});cx.globalAlpha=1;
if(PL.boss)drawBoss(PL.boss);
PL.enemies.forEach(drawEnemy);
PL.items.forEach(it=>{const col={w:'#ffe27a',s:'#7fe9ff',h:'#ff8fb0'}[it.t],ic={w:'⚡',s:'🛡',h:'❤️'}[it.t],p=1+Math.sin(PL.t*6+it.ph)*.1;cx.save();cx.translate(it.x,it.y);cx.scale(p,p);cx.shadowColor=col;cx.shadowBlur=18;const rg=cx.createRadialGradient(-3,-3,2,0,0,15);rg.addColorStop(0,'#fff');rg.addColorStop(.4,col);rg.addColorStop(1,shade(col,-.55));cx.fillStyle=rg;cx.beginPath();cx.arc(0,0,14,0,6.3);cx.fill();cx.shadowBlur=0;cx.strokeStyle='rgba(255,255,255,.8)';cx.lineWidth=1.5;cx.stroke();cx.font='13px serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(ic,0,1);cx.restore()});
PL.bullets.forEach(b=>{const tx=b.x-b.vx*.05,ty=b.y-b.vy*.05,tg=cx.createLinearGradient(b.x,b.y,tx,ty);tg.addColorStop(0,'#eaffff');tg.addColorStop(1,'rgba(105,239,255,0)');cx.save();cx.shadowColor='#69efff';cx.shadowBlur=14;cx.strokeStyle=tg;cx.lineWidth=4;cx.lineCap='round';cx.beginPath();cx.moveTo(b.x,b.y);cx.lineTo(tx,ty);cx.stroke();cx.fillStyle='#fff';cx.beginPath();cx.arc(b.x,b.y,2.2,0,6.3);cx.fill();cx.restore()});
PL.hostile.forEach(b=>{cx.save();cx.shadowColor='#ff668f';cx.shadowBlur=14;const rg=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*1.6);rg.addColorStop(0,'#fff');rg.addColorStop(.35,'#ff9da7');rg.addColorStop(1,'rgba(255,60,110,.05)');cx.fillStyle=rg;cx.beginPath();cx.arc(b.x,b.y,b.r*1.6,0,6.3);cx.fill();cx.restore()});
PL.fx.forEach(f=>{const k=f.t/f.life,a=Math.max(0,1-k);if(f.kind=='smoke'){cx.globalAlpha=.28*a;cx.fillStyle=f.color;cx.beginPath();cx.arc(f.x,f.y,f.size,0,6.3);cx.fill()}else if(f.kind=='shard'){cx.save();cx.globalAlpha=a;cx.translate(f.x,f.y);cx.rotate(f.rot);cx.fillStyle=f.color;cx.beginPath();cx.moveTo(f.size,0);cx.lineTo(-f.size*.6,f.size*.6);cx.lineTo(-f.size*.4,-f.size*.7);cx.closePath();cx.fill();cx.restore()}else if(f.kind=='text'){cx.save();cx.globalAlpha=Math.min(1,a*2);cx.font=`bold ${f.size}px system-ui`;cx.textAlign='center';cx.textBaseline='middle';cx.lineWidth=3;cx.strokeStyle='rgba(0,0,0,.5)';cx.strokeText(f.text,f.x,f.y);cx.fillStyle=f.color;cx.fillText(f.text,f.x,f.y);cx.restore()}});cx.globalAlpha=1;
if(PL.invuln<=0||Math.floor(PL.t*16)%2===0)drawShip();
cx.save();cx.globalCompositeOperation='lighter';PL.fx.forEach(f=>{const k=f.t/f.life,a=Math.max(0,1-k);if(f.kind=='spark'){cx.globalAlpha=a;cx.fillStyle=f.color;cx.beginPath();cx.arc(f.x,f.y,Math.max(.4,f.size*(.3+a*.7)),0,6.3);cx.fill()}else if(f.kind=='ring'){cx.globalAlpha=a;cx.strokeStyle=f.color;cx.lineWidth=4*a+.5;cx.beginPath();cx.arc(f.x,f.y,f.size,0,6.3);cx.stroke()}else if(f.kind=='flash'){const r=f.size*(1+k*.6),rg=cx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);rg.addColorStop(0,f.color);rg.addColorStop(1,'rgba(255,200,100,0)');cx.globalAlpha=a;cx.fillStyle=rg;cx.beginPath();cx.arc(f.x,f.y,r,0,6.3);cx.fill()}});cx.restore();cx.globalAlpha=1;
const vg=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*.45,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,12,0)');vg.addColorStop(1,'rgba(0,0,12,.5)');cx.fillStyle=vg;cx.fillRect(-30,-30,W+60,H+60);
if(PL.flash>0){cx.fillStyle=`rgba(255,50,90,${PL.flash*.9})`;cx.fillRect(-30,-30,W+60,H+60)}
cx.restore()}
/* ---------- SHOP ---------- */
let tab='up';
function openShop(){$('over').classList.remove('on');$('pause-screen').classList.remove('on');paused=false;cancelAnimationFrame(raf);run=0;show('shop');renderShop()}
function closeShop(){toMenu()}
function renderShop(){$('sg').textContent=S.gold;$('tabs').innerHTML=[['up','Улучшения'],['skin','Скины'],['bg','Фоны'],['blk','Блоки']].map(([k,n])=>`<button class="tab ${tab==k?'on':''}" onclick="tab='${k}';renderShop()">${n}</button>`).join('');
let h='';
if(tab=='up')for(const k in UPS){const[n,d,max,pr]=UPS[k],l=S.up[k];h+=`<div class="it row"><div>${n}</div><small>${d} (ур. ${l}/${max})</small>${l<max?`<button class="buy" onclick="buyUp('${k}')">${pr[l]} 🟡</button>`:'<button class="buy eq">Макс.</button>'}</div>`}
else{const D=tab=='skin'?SKINS:tab=='bg'?BGS:BLKS;for(const k in D){const[n,pr,c]=D[k],id=tab+':'+k,own=S.own.includes(id),eq=S[tab]==k,col=Array.isArray(c)?c[0]:c;
h+=`<div class="it">${n}<div class="sw" style="background:${col}"></div><button class="buy ${eq?'eq':''}" onclick="buyIt('${tab}','${k}',${pr})">${eq?'Надето':own?'Надеть':pr+' 🟡'}</button></div>`}}
$('sgrid').innerHTML=h}
function buyUp(k){const p=UPS[k][3][S.up[k]];if(S.gold>=p){S.gold-=p;S.up[k]++;save();beep(800)}else beep(150);renderShop()}
function buyIt(t,k,pr){const id=t+':'+k;if(!S.own.includes(id)){if(S.gold<pr){beep(150);return renderShop()}S.gold-=pr;S.own.push(id)}S[t]=k;save();beep(800);renderShop()}
addEventListener('resize',()=>{if(run)size()});
