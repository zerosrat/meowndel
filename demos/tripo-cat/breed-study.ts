import {createComparisonScene} from './comparison-scene';
import manifest from './breed-manifest.json';
const root=document.querySelector<HTMLElement>('#cats')!;
let angle=0,clay=false,dead=false,oldDomestic=false;
let reloadDomestic=()=>{};
const cards=manifest.cats.map((cat,index)=>{
 const card=document.createElement('section');card.className='card';
 const name=document.createElement('h2');name.className='identity';name.textContent=cat.name;
 const blindName=document.createElement('h2');blindName.className='blind-name';blindName.textContent=`猫 ${String.fromCharCode(65+index)}`;
 const desc=document.createElement('p');desc.className='note identity';desc.textContent=cat.description;
 const host=document.createElement('div');host.className='portrait';host.dataset.loading='true';
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',`可旋转的猫 ${String.fromCharCode(65+index)}`);host.append(canvas);
 const status=document.createElement('p');status.className='status';status.setAttribute('role','status');
 const retry=document.createElement('button');retry.textContent='重新加载';retry.hidden=true;
 card.append(name,blindName,desc,host,status,retry);root.append(card);
 const scene=createComparisonScene(canvas,host);
 const coats=manifest.coats.filter(coat=>coat.breed===cat.key);
 let selected=coats[0];
 const choices=document.createElement('div');choices.className='controls coat-controls';choices.setAttribute('aria-label',`${cat.name}花色`);
 const buttons=coats.map(coat=>{
  const button=document.createElement('button');button.textContent=coat.label;button.setAttribute('aria-pressed',String(coat===selected));
  button.addEventListener('click',()=>{selected=coat;void load();});choices.append(button);return button;
 });
 card.insertBefore(choices,host);
 let version=0;
 async function load(){
  const current=++version;
  host.dataset.loading='true';retry.hidden=true;status.textContent='正在准备模型…';
  const isPrevious=index===0&&oldDomestic;
  const active=isPrevious?manifest.domesticPrevious:{...cat,file:selected?.file??cat.file};
  buttons.forEach((button,i)=>{button.disabled=isPrevious;button.setAttribute('aria-pressed',String(!isPrevious&&coats[i]===selected));});
  desc.textContent=active.description;
  try{const result=await scene.load(active.file,active.rotationY,{flatShading:true,roughness:1});if(!result||dead||current!==version)return;scene.setClay(clay);scene.angle(angle);status.textContent=`${isPrevious?'上一版 · 棕虎斑加白':selected?.label??'棕虎斑加白'} · 已就绪，可旋转查看`;}
  catch(error){if(dead||current!==version)return;status.textContent='素材加载失败，请重试。';retry.hidden=false;console.error(error);}
  finally{if(current===version)host.dataset.loading='false';}
 }
 if(index===0)reloadDomestic=()=>void load();
 retry.addEventListener('click',()=>void load());void load();return scene;
});
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-angle]'))button.addEventListener('click',()=>{angle=Number(button.dataset.angle);cards.forEach(scene=>scene.angle(angle));});
function setClay(value:boolean){clay=value;cards.forEach(scene=>scene.setClay(value));document.querySelector('#clay')!.setAttribute('aria-pressed',String(value));document.querySelector('#color')!.setAttribute('aria-pressed',String(!value));}
document.querySelector('#clay')!.addEventListener('click',()=>setClay(true));document.querySelector('#color')!.addEventListener('click',()=>setClay(false));
document.querySelector('#blind')!.addEventListener('click',event=>{const hidden=document.body.classList.toggle('blind');const button=event.currentTarget as HTMLButtonElement;button.setAttribute('aria-pressed',String(hidden));button.textContent=hidden?'显示品种名称':'隐藏品种名称';});
for(const [id,old] of [['domestic-new',false],['domestic-old',true]] as const)document.querySelector('#'+id)!.addEventListener('click',()=>{oldDomestic=old;document.querySelector('#domestic-new')!.setAttribute('aria-pressed',String(!old));document.querySelector('#domestic-old')!.setAttribute('aria-pressed',String(old));reloadDomestic();});
document.querySelector('#resources')!.textContent=manifest.note;
window.addEventListener('pagehide',()=>{dead=true;cards.forEach(scene=>scene.dispose());},{once:true});
