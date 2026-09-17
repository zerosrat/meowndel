import {createComparisonScene} from './comparison-scene';
import manifest from './shared-manifest.json';
const names:Record<string,string>={cream:'奶油',blueTabby:'蓝狸花',blueWhite:'蓝白',diluteCalico:'淡三花',tortie:'玳瑁'};
const stage=document.querySelector<HTMLElement>('#stage')!;
const status=document.querySelector<HTMLElement>('#status')!;
const stats=document.querySelector<HTMLElement>('#stats')!;
const retry=document.querySelector<HTMLButtonElement>('#retry')!;
let scene:ReturnType<typeof createComparisonScene>|undefined, body:Promise<unknown>|undefined;
let key='cream',mode='shared',serial=0,bodyLoads=0;
const seen=new Set<string>();
const mb=(n:number)=>(n/1e6).toFixed(2)+' MB';
function release(){scene?.dispose();scene=undefined;body=undefined;}
async function select(){
 const turn=++serial;const coat=manifest.coats.find(c=>c.key===key)!;const chosenMode=mode;
 stage.dataset.loading='true';retry.hidden=true;stats.textContent='';status.textContent='正在载入'+names[key];
 document.querySelectorAll<HTMLButtonElement>('[data-coat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.coat===key)));
 for(const m of ['shared','original'])document.getElementById(m)!.setAttribute('aria-pressed',String(mode===m));
 const start=performance.now();
 try{
  if(!scene){const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','可旋转猫模型');stage.replaceChildren(canvas);scene=createComparisonScene(canvas,stage);}
  const active=scene;
  if(chosenMode==='shared'){
   if(!body){bodyLoads++;body=active.load('./shared-assets/body.glb',-Math.PI/2);}
   await body;if(turn!==serial)return;
   await active.replaceMaterial('./shared-assets/'+coat.material.file);if(turn!==serial)return;
   seen.add(coat.key);
  }else{await active.load('./cat-'+coat.key+'-80k-2k.glb',-Math.PI/2);if(turn!==serial)return;}
  stage.dataset.loading='false';status.textContent=names[key]+' · '+(mode==='shared'?'共用身体':'原始模型')+' · 可旋转';
  const textures=coat.material.bytes+coat.images.reduce((s,i)=>s+i.bytes,0);
  stats.textContent=mode==='shared'?`身体加载 ${bodyLoads} 次 · 身体 ${mb(manifest.body.bytes)} · 本花色 ${mb(textures)} · 已浏览 ${seen.size}/5 套 · 本次就绪 ${Math.round(performance.now()-start)} ms`:`原始整套 ${mb(coat.originalBytes)} · 本次就绪 ${Math.round(performance.now()-start)} ms`;
 }catch{if(turn!==serial)return;release();stage.dataset.loading='false';stage.replaceChildren();status.textContent='载入失败，请重试';retry.hidden=false;}
}
for(const coat of manifest.coats){const b=document.createElement('button');b.dataset.coat=coat.key;b.textContent=names[coat.key];b.onclick=()=>{key=coat.key;void select();};document.querySelector('#coats')!.append(b);}
for(const m of ['shared','original'])document.getElementById(m)!.onclick=()=>{if(mode===m)return;mode=m;release();void select();};
document.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.onclick=()=>scene?.angle(Number(b.dataset.angle)));
retry.onclick=()=>void select();window.addEventListener('pagehide',()=>{serial++;release();});
void select();
