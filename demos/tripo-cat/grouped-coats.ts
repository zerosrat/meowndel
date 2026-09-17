import {createComparisonScene} from './comparison-scene';
import manifest from './grouped-manifest.json';
import {coats} from './coats';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const stage=el('stage'),status=el('status'),stats=el('stats'),retry=el<HTMLButtonElement>('retry');
let scene:ReturnType<typeof createComparisonScene>|undefined,bodyPromise:Promise<unknown>|undefined;
let loadedBody='',key='black',mode='shared',serial=0,level=0,bodyLoads=0,materialLoads=0;
let ready=false;
const labels=['无白斑','零星白','中量白','大面积白','高白'];
function release(){scene?.dispose();scene=undefined;bodyPromise=undefined;loadedBody='';ready=false;}
function update(){
 document.querySelectorAll<HTMLButtonElement>('[data-coat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.coat===key)));
 for(const m of ['shared','original'])el(m).setAttribute('aria-pressed',String(mode===m));
 const eligible=mode==='shared'&&(key==='black'||key==='tabby');
 document.querySelectorAll<HTMLButtonElement>('[data-white]').forEach(b=>{b.disabled=!eligible||!ready;b.setAttribute('aria-pressed',String(Number(b.dataset.white)===level));});
 el('white-note').textContent=mode==='original'?'原版对照显示原始无叠加贴图。':eligible?'白斑仅为试验：请重点检查眼鼻耳、前腿、侧腹与背面的衔接。':'当前花色不叠加白斑；点上方“用纯黑试”或“用狸花试”。';
 document.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.disabled=!ready);
}
function applyWhite(){scene?.setWhiteLevel(mode==='shared'&&(key==='black'||key==='tabby')?level:0);update();}
async function select(){
 const ticket=++serial,coat=manifest.coats.find(c=>c.key===key)!,body=manifest.bodies.find(b=>b.key===coat.body)!;
 ready=false;update();stage.dataset.loading='true';stats.textContent='';retry.hidden=true;status.textContent='正在载入…';
 const start=performance.now();
 try{
  const wanted=mode==='shared'?body.key:'original:'+key;
  if(loadedBody!==wanted){release();loadedBody=wanted;}
  if(!scene){const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','可旋转田园猫');stage.replaceChildren(canvas);scene=createComparisonScene(canvas,stage);}
  const active=scene;
  if(!bodyPromise){bodyLoads++;bodyPromise=active.load(mode==='shared'?'./grouped-assets/'+body.file:'./'+coat.originalFile,coat.rotationY);}
  await bodyPromise;if(ticket!==serial)return;
  if(mode==='shared'){materialLoads++;const success=await active.replaceMaterial('./grouped-assets/'+coat.material.file);if(ticket!==serial||!success)return;}
  if(ticket!==serial)return;
  ready=true;applyWhite();stage.dataset.loading='false';
  status.textContent=`${coats.find(c=>c.key===key)!.name} · ${mode==='shared'?'共享版':'原版'} · 可旋转`;
  stats.textContent=`身体读取 ${bodyLoads} 次，材质读取 ${materialLoads} 次。本身体 ${(body.bytes/1e6).toFixed(2)} MB，本花色 ${((coat.material.bytes+coat.images.reduce((n,i)=>n+i.bytes,0))/1e6).toFixed(2)} MB。本次就绪 ${Math.round(performance.now()-start)} ms。`;
 }catch{if(ticket!==serial)return;release();stage.replaceChildren();stage.dataset.loading='false';status.textContent='加载失败，请重试';retry.hidden=false;update();}
}
for(const coat of coats){const b=document.createElement('button');b.dataset.coat=coat.key;b.textContent=coat.name;b.onclick=()=>{key=coat.key;level=0;void select();};el('coats').append(b);}
labels.forEach((label,i)=>{const b=document.createElement('button');b.dataset.white=String(i);b.textContent=label;b.onclick=()=>{level=i;applyWhite();};el('white-levels').append(b);});
for(const m of ['shared','original'])el(m).onclick=()=>{if(mode===m)return;mode=m;void select();};
for(const name of ['black','tabby'])el('try-'+name).onclick=()=>{key=name;mode='shared';level=2;void select();};
document.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.onclick=()=>scene?.angle(Number(b.dataset.angle)));
retry.onclick=()=>void select();window.addEventListener('pagehide',()=>{serial++;release();});
void select();
