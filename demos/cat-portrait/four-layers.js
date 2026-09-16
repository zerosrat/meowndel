import {breeds,prepare,validate} from './breed-layers.js';
import {N,canvas} from './coat-renderer.js';
const $=id=>document.getElementById(id);
const state={breed:'all',size:360,original:false,background:'',selected:{},layers:{}};
const renderers=new Map(),defaults=new Map();
let downloadURL;
function button(text,attrs,action){const b=document.createElement('button');b.textContent=text;for(const [k,v]of Object.entries(attrs))b.setAttribute(k,v);b.onclick=action;return b;}
function active(){return state.breed==='all'?breeds:breeds.filter(b=>b.id===state.breed);}
function current(b){return b.coats[state.selected[b.id]];}
function drawCanvas(source,label){const out=canvas();out.getContext('2d').drawImage(source,0,0);out.setAttribute('role','img');out.setAttribute('aria-label',label);return out;}
function selectedImage(b){
 const r=renderers.get(b.id),settings=state.layers[b.id];
 if(state.original)return r.master;
 if(settings.pattern&&settings.white)return defaults.get(b.id)[state.selected[b.id]];
 return r.render(current(b),settings.pattern,settings.white);
}
function refresh(){
 const all=state.breed==='all',cats=active();
 $('portraits').replaceChildren();$('portraits').classList.toggle('all',all);
 $('stage').className=`stage ${state.background} ${state.original?'original':''}`;
 for(const b of cats){
  const fig=document.createElement('figure'),caption=document.createElement('figcaption');
  const name=state.original?'原始底稿':current(b).name;
  const image=drawCanvas(selectedImage(b),`${b.name} · ${name}`);image.style.setProperty('--size',`${state.size}px`);
  caption.textContent=`${b.short} · ${name}`;
  if(!state.original&&(!state.layers[b.id].pattern||!state.layers[b.id].white)){
   const sub=document.createElement('span');sub.textContent='图层拆解预览';caption.append(sub);
  }
  fig.append(image,caption);$('portraits').append(fig);
 }
 $('coats').replaceChildren();
 for(const b of cats){
  const group=document.createElement('div');group.className='coat-group';
  if(all){const title=document.createElement('h3');title.textContent=b.short;group.append(title);}
  const choices=document.createElement('div');choices.className='choices';
  b.coats.forEach((coat,i)=>choices.append(button(coat.name,{'aria-pressed':state.selected[b.id]===i,'data-breed-coat':`${b.id}:${coat.id}`},()=>{
   state.selected[b.id]=i;state.original=false;state.layers[b.id]={pattern:true,white:true};refresh();
  })));
  group.append(choices);$('coats').append(group);
 }
 document.querySelectorAll('[data-breed]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.breed===state.breed));
 document.querySelectorAll('[data-preview]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.preview===`${state.breed}:${current(cats[0]).id}`));
 $('source').checked=state.original;$('layer-controls').hidden=all;
 $('description').textContent=all?'上方可分别切换四只猫的花色。选择单一品种后，可拆开花纹与白斑观察。':cats[0].note;
 if(!all){
  const b=cats[0],coat=current(b),settings=state.layers[b.id];
  $('pattern-label').textContent=b.id==='ragdoll'?' 重点色区域':' 花纹';
  $('pattern').checked=settings.pattern;$('white').checked=settings.white;
  $('pattern').disabled=state.original||!(coat.stripe||coat.patch||coat.point);
  $('white').disabled=state.original||!coat.white;
 }
 document.querySelectorAll('[data-size]').forEach(b=>{b.disabled=all;b.setAttribute('aria-pressed',Number(b.dataset.size)===state.size);});
 if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=undefined;}
 $('download').removeAttribute('href');$('download').setAttribute('aria-disabled',all);
 $('download').textContent=all?'选择单只后保存 PNG ↓':'保存当前透明 PNG ↓';
 if(!all){
  // A generation token prevents a slower previous export from replacing the latest selection.
  const token=++refresh.exportToken;
  selectedImage(cats[0]).toBlob(blob=>{if(token!==refresh.exportToken||state.breed==='all'||!blob)return;downloadURL=URL.createObjectURL(blob);$('download').href=downloadURL;},'image/png');
  $('download').download=`meowndel-${cats[0].id}-${state.original?'source':current(cats[0]).id}.png`;
 }else refresh.exportToken++;
}
refresh.exportToken=0;
async function start(){
 const results=await Promise.allSettled(breeds.map(async b=>{
  const r=await prepare(b);renderers.set(b.id,r);
  const outputs=b.coats.map(c=>r.render(c));defaults.set(b.id,outputs);
  state.selected[b.id]=b.initial;state.layers[b.id]={pattern:true,white:true};
  return {breed:b.id,...validate(r,outputs,b)};
 }));
 const failures=results.filter(r=>r.status==='rejected');
 if(failures.length)throw new Error(failures.map(r=>r.reason.message).join('；'));
 const checks=results.map(r=>r.value),errors=checks.reduce((n,c)=>n+c.alphaErrors+c.featureErrors+c.originalErrors,0);
 $('status').textContent=errors?'校验发现差异，请检查保护区域。':'12 种花色已生成。各品种轮廓透明度逐像素一致，五官保护与采样检查通过。';
 $('status').dataset.checks=JSON.stringify(checks);
 for(const b of breeds){
  $('breeds').append(button(b.short,{'data-breed':b.id,'aria-pressed':false},()=>{state.breed=b.id;refresh();}));
  const section=document.createElement('section');section.className='gallery-group';
  const title=document.createElement('h2');title.textContent=b.name;
  const grid=document.createElement('div');grid.className='grid';
  b.coats.forEach((c,i)=>{
   const card=button('',{'class':'card','data-preview':`${b.id}:${c.id}`,'aria-label':`放大${b.short}${c.name}`,'aria-pressed':false},()=>{
    state.breed=b.id;state.selected[b.id]=i;state.original=false;state.layers[b.id]={pattern:true,white:true};refresh();$('stage').scrollIntoView({behavior:'instant',block:'start'});
   });
   const preview=drawCanvas(defaults.get(b.id)[i],`${b.name} · ${c.name}`);preview.setAttribute('aria-hidden','true');
   card.append(preview,document.createTextNode(c.name));grid.append(card);
  });
  section.append(title,grid);$('gallery').append(section);
 }
 $('breeds').append(button('四只一起',{'data-breed':'all','aria-pressed':true},()=>{state.breed='all';refresh();}));
 $('source').onchange=()=>{state.original=$('source').checked;refresh();};
 for(const id of ['pattern','white'])$(id).onchange=()=>{if(state.breed!=='all'){state.layers[state.breed][id]=$(id).checked;refresh();}};
 $('background').onclick=e=>{const b=e.target.closest('[data-bg]');if(!b)return;state.background=b.dataset.bg;document.querySelectorAll('[data-bg]').forEach(el=>el.setAttribute('aria-pressed',el===b));refresh();};
 $('sizes').onclick=e=>{const b=e.target.closest('[data-size]');if(b&&!b.disabled){state.size=Number(b.dataset.size);refresh();}};
 refresh();
}
start().catch(e=>{$('portraits').textContent='素材加载失败，请刷新重试。';$('status').textContent=e.message;$('status').className='error';$('status').closest('details').open=true;});
