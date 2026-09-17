import {createComparisonScene} from './comparison-scene';
import candidate from './natural-white-manifest.json';
const stage=document.querySelector<HTMLElement>('#stage')!;
const status=document.querySelector<HTMLElement>('#status')!;
const retry=document.querySelector<HTMLButtonElement>('#retry')!;
const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','可拖动旋转的狸花加白 3D 模型');stage.append(canvas);
const scene=createComparisonScene(canvas,stage);
type Mode='natural'|'procedural'|'original';
let mode:Mode='natural',angle=0,ticket=0;
const descriptions:Record<Mode,string>={natural:'白毛、条纹和脸部细节一起制作的新材质。',procedural:'上一版未通过的样板：在原狸花上叠加中量白斑，保留作对照。',original:'之前的原狸花材质，作为造型与脸部细节的参照。'};
const buttons=[...document.querySelectorAll<HTMLButtonElement>('[data-mode]')];
async function show(){
 const id=++ticket,current=mode;stage.dataset.loading='true';retry.hidden=true;
 buttons.forEach(b=>{b.disabled=true;b.setAttribute('aria-pressed',String(b.dataset.mode===current));});
 document.querySelector('#description')!.textContent=descriptions[current];status.textContent='正在准备猫咪…';
 try{
  const result=await scene.load(current==='natural'?candidate.body:'grouped-assets/body-tabby.glb',current==='natural'?candidate.rotationY:0);
  if(!result||id!==ticket)return;
  if(!await scene.replaceMaterial(current==='natural'?candidate.material:'grouped-assets/tabby.gltf')||id!==ticket)return;
  if(current==='procedural')scene.setWhiteLevel(2);
  scene.angle(angle);status.textContent=(current==='natural'?'新版狸花加白':current==='procedural'?'旧版程序白斑':'原狸花')+' · 可旋转查看';
 }catch(error){if(id!==ticket)return;status.textContent='加载失败，请检查本地素材后重试。';retry.hidden=false;console.error(error);}
 finally{if(id===ticket){stage.dataset.loading='false';buttons.forEach(b=>b.disabled=false);}}
}
buttons.forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode as Mode;void show();}));
document.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.addEventListener('click',()=>{angle=Number(b.dataset.angle);scene.angle(angle);}));
retry.addEventListener('click',()=>void show());
document.querySelector('#resource')!.textContent=candidate.note;
window.addEventListener('pagehide',()=>{ticket++;scene.dispose();},{once:true});void show();
