import {domesticPortrait} from '../../src/illustration/browser';
import type {CoatSpec} from '../../src/genetics';
import {createComparisonScene} from './comparison-scene';
import manifest from './asset-manifest.json';

const presets:Record<string,{name:string;coat:CoatSpec}>={
 orange:{name:'橘猫',coat:{series:'orange',dilute:false,tabby:true,white:0,long:false}},
 tabby:{name:'狸花',coat:{series:'black',dilute:false,tabby:true,white:0,long:false}},
 tuxedo:{name:'黑白',coat:{series:'black',dilute:false,tabby:false,white:1,long:false}},
 calico:{name:'三花',coat:{series:'tortie',dilute:false,tabby:false,white:2,long:false}},
};
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const host=el('stage'),flat=el<HTMLImageElement>('flat'),fallback=el<HTMLImageElement>('fallback'),status=el('status'),toggle=el<HTMLButtonElement>('toggle'),retry=el<HTMLButtonElement>('retry');
let scene:ReturnType<typeof createComparisonScene>|undefined,selected='orange',ticket=0,flatOnly=false;
const angleButtons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-angle]'));
function releaseScene(){scene?.dispose();scene=undefined;host.querySelector('canvas')?.remove();angleButtons.forEach(b=>b.disabled=true);}
function showFallback(message:string){releaseScene();fallback.hidden=flat.hidden;status.textContent=message;el('mode').textContent='2D 备用';retry.hidden=flatOnly;}
function cards(two:string,three?:string){
 const root=el('samples');root.replaceChildren();
 for(const [size,label] of [[46,'当前候选卡片 · 46px'],[72,'较大的候选卡片 · 72px'],[96,'详情摘要 · 96px']] as const){
  const sample=document.createElement('div');sample.className='sample';
  const title=document.createElement('h3');title.textContent=label;sample.append(title);
  const pair=document.createElement('div');pair.className='pair';
  for(const [url,label] of [[two,'2D 插画'],[three??two,three?'3D 静态预览':'2D 备用']]){
   const figure=document.createElement('figure'),img=new Image(),caption=document.createElement('figcaption');img.src=url;img.width=img.height=size;img.alt=presets[selected].name+' · '+label;caption.textContent=label;figure.append(img,caption);pair.append(figure);
  }sample.append(pair);root.append(sample);
 }
}
async function select(key:string){
 const seq=++ticket;selected=key;const preset=presets[key];
 releaseScene();flat.hidden=fallback.hidden=true;retry.hidden=true;el('samples').replaceChildren();
 el('metrics').textContent='尚未载入';el('mode').textContent=flatOnly?'2D 备用':'主图';status.textContent='正在准备'+preset.name+'…';
 document.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cat===key)));
 let two:string;
 try{two=await domesticPortrait(preset.coat,42);}catch{if(seq===ticket)status.textContent='2D 素材未能载入，请刷新页面重试。';return;}
 if(seq!==ticket)return;
 flat.src=fallback.src=two;flat.alt=preset.name+' · 现有 2D 插画';flat.hidden=false;cards(two);
 if(flatOnly){showFallback('已切换为 2D，3D 场景已释放。');return;}
 const asset=manifest.assets.find(a=>a.key===key)!;
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','拖动查看 '+preset.name+' 3D 模型');host.prepend(canvas);
 try{
  const instance=scene=createComparisonScene(canvas,host);
  const loaded=await instance.load('./'+asset.file);
  if(seq!==ticket||!loaded)return;
  cards(two,loaded.thumbnail);status.textContent='拖动转身，或用按钮查看侧面和背面';angleButtons.forEach(b=>b.disabled=false);
  el('metrics').textContent=`${preset.name}：文件 ${(asset.bytes/1000000).toFixed(2)} MB；本次加载至首次绘制 ${loaded.milliseconds} ms；${loaded.triangles.toLocaleString()} 三角面。`;
 }catch{if(seq===ticket)showFallback('3D 暂不可用，已显示对应的 2D 插画。');}
}
document.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach(b=>b.onclick=()=>void select(b.dataset.cat!));
angleButtons.forEach(b=>b.onclick=()=>scene?.angle(Number(b.dataset.angle)));
toggle.onclick=()=>{flatOnly=!flatOnly;toggle.setAttribute('aria-pressed',String(flatOnly));toggle.textContent=flatOnly?'启用 3D':'改用 2D';void select(selected);};
retry.onclick=()=>void select(selected);
window.addEventListener('pagehide',()=>{ticket++;releaseScene();});
window.addEventListener('pageshow',event=>{if(event.persisted)void select(selected);});
void select(selected);
