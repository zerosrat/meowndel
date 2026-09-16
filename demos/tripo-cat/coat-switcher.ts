import {createComparisonScene} from './comparison-scene';
import {coats,findCoat} from './coats';
import manifest from './asset-manifest.json';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const stage=el('stage'),photo=el<HTMLImageElement>('stage-photo'),status=el('status'),kind=el('kind'),retry=el<HTMLButtonElement>('retry');
const angles=[...document.querySelectorAll<HTMLButtonElement>('[data-angle]')];
let active=coats[0] as typeof coats[number],serial=0,scene:ReturnType<typeof createComparisonScene>|undefined;
const ready=new Map(manifest.assets.map(a=>[a.key,a]));
function release(){scene?.dispose();scene=undefined;stage.querySelector('canvas')?.remove();angles.forEach(b=>b.disabled=true);}
function sync(){
 el('coat-title').textContent=active.name;el('pattern-info').textContent=active.pattern+' · '+active.white;
 document.querySelectorAll<HTMLButtonElement>('[data-family]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.family===active.family)));
 document.querySelectorAll<HTMLButtonElement>('[data-coat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.coat===active.key)));
 el('normal').setAttribute('aria-pressed',String(!active.dilute));el('dilute').setAttribute('aria-pressed',String(active.dilute));
 el<HTMLButtonElement>('dilute').disabled=active.family==='tortie';el('dilute-note').textContent=active.family==='tortie'?'本轮玳瑁仅制作正常色。':'同一纹路下切换正常色与稀释色。';
}
async function select(key:string){
 const item=coats.find(c=>c.key===key);if(!item)return;active=item;const turn=++serial;release();sync();photo.hidden=true;retry.hidden=true;
 const asset=ready.get(key);kind.className='badge'+(asset?'':' pending');
 if(!asset){
  kind.textContent='参考图 · 3D 待制作';photo.alt=active.name+'设计参考图，尚非可旋转模型';photo.src='./reference-'+key+'.png';photo.hidden=false;
  status.textContent='配色参考已完成，尚未生成 3D 贴图。新增贴图正在制作与检查，完成后将替换为可旋转模型。';return;
 }
 kind.textContent='3D 载入中';status.textContent='正在载入'+active.name+'…';const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',active.name+'可旋转 3D 模型');stage.prepend(canvas);
 try{const instance=scene=createComparisonScene(canvas,stage);const result=await instance.load('./'+asset.file);if(turn!==serial||!result)return;kind.textContent='可旋转 3D';angles.forEach(b=>b.disabled=false);status.textContent='拖动转身 · 双指或滚轮缩放';}
 catch{if(turn!==serial)return;release();status.textContent='模型未能载入，请检查本地素材后重试。';kind.textContent='3D 暂不可用';retry.hidden=false;}
}
const catalog=el('catalog');for(const coat of coats){const b=document.createElement('button');b.dataset.coat=coat.key;b.setAttribute('aria-pressed','false');b.append(coat.name);const tag=document.createElement('span');tag.textContent=ready.has(coat.key)?'可旋转 3D':'参考图 · 3D 待制作';b.append(tag);b.onclick=()=>void select(coat.key);catalog.append(b);}
el('coverage').textContent=`${coats.filter(c=>ready.has(c.key)).length} 种可旋转模型；其余花色已完成参考图。`;
document.querySelectorAll<HTMLButtonElement>('[data-family]').forEach(b=>b.onclick=()=>void select(findCoat(b.dataset.family!,active.dilute).key));
el('normal').onclick=()=>void select(findCoat(active.family,false).key);el('dilute').onclick=()=>void select(findCoat(active.family,true).key);
angles.forEach(b=>b.onclick=()=>scene?.angle(Number(b.dataset.angle)));retry.onclick=()=>void select(active.key);
photo.onerror=()=>{status.textContent='参考图未能载入，请恢复本地素材。';};
window.addEventListener('pagehide',()=>{serial++;release();});window.addEventListener('pageshow',e=>{if(e.persisted)void select(active.key);});
void select('orange');
