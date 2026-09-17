import {createComparisonScene} from './comparison-scene';
import candidate from './blocky-manifest.json';
const stage=document.querySelector<HTMLElement>('#stage')!;
const status=document.querySelector<HTMLElement>('#status')!;
const retry=document.querySelector<HTMLButtonElement>('#retry')!;
const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','可拖动旋转的狸花加白 3D 模型');stage.append(canvas);
const scene=createComparisonScene(canvas,stage);
type Mode='blocky'|'original';
let mode:Mode='blocky',angle=0,ticket=0;
const descriptions:Record<Mode,string>={blocky:'重新生成的块状卡通造型，使用简化花纹与统一的哑光风格。',original:'上一版狸花加白：用于比较造型、贴图和眼睛的风格一致性。'};
const buttons=[...document.querySelectorAll<HTMLButtonElement>('[data-mode]')];
async function show(){
 const id=++ticket,current=mode;stage.dataset.loading='true';retry.hidden=true;
 buttons.forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',String(b.dataset.mode===current));});
 document.querySelector('#description')!.textContent=descriptions[current];status.textContent='正在准备猫咪…';
 try{
  const result=await scene.load(current==='blocky'?candidate.file:'grouped-assets/body-black.glb',current==='blocky'?candidate.rotationY:-Math.PI/2,current==='blocky'?{flatShading:true,roughness:1}:undefined);
  if(!result||id!==ticket)return;
  if(current==='original' && !await scene.replaceMaterial('natural-assets/tabbyWhite.gltf'))return;
  
  scene.angle(angle);status.textContent=(current==='blocky'?'块状卡通猫':'上一版狸花加白')+' · 可旋转查看';
 }catch(error){if(id!==ticket)return;status.textContent='加载失败，请检查本地素材后重试。';retry.hidden=false;console.error(error);}
 finally{if(id===ticket){stage.dataset.loading='false';buttons.forEach(b=>b.disabled=false);}}
}
buttons.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode as Mode;void show();}));
document.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.addEventListener('click',()=>{angle=Number(b.dataset.angle);scene.angle(angle);}));
retry.addEventListener('click',()=>void show());
document.querySelector('#resource')!.textContent=candidate.note;
window.addEventListener('pagehide',()=>{ticket++;scene.dispose();},{once:true});void show();
