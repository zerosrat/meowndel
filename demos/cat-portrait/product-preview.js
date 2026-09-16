import {breeds,prepare} from './breed-layers.js';
const $=id=>document.getElementById(id);
const state={breed:0,coat:4,detailBreed:0,detailCoat:4};
const cache=new Map();
function art(b,i,size=144){const source=cache.get(b.id)[i],out=document.createElement('canvas');out.width=size;out.height=size;out.getContext('2d').drawImage(source,0,0,size,size);out.setAttribute('role','img');out.setAttribute('aria-label',`${b.name} · ${b.coats[i].name}`);return out;}
function button(text,handler,attrs={}){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=handler;for(const[k,v]of Object.entries(attrs))b.setAttribute(k,v);return b;}
function choose(bi,ci){state.breed=bi;state.coat=ci;draw();}
function openDetail(bi,ci){state.detailBreed=bi;state.detailCoat=ci;drawDetail();$('detail').showModal();}
function drawDetail(){
 const b=breeds[state.detailBreed],c=b.coats[state.detailCoat];
 $('detail-image').replaceChildren(art(b,state.detailCoat,720));$('detail-title').textContent=c.name;$('detail-breed').textContent=b.name;$('detail-note').textContent=b.note;
 $('detail-coats').replaceChildren(...b.coats.map((coat,i)=>button(coat.name,()=>{state.detailCoat=i;drawDetail();},{'aria-pressed':state.detailCoat===i})));
}
function draw(){
 const b=breeds[state.breed],c=b.coats[state.coat];
 $('breeds').replaceChildren(...breeds.map((breed,i)=>button(breed.name,()=>choose(i,breed.initial),{'aria-pressed':state.breed===i})));
 $('coats').replaceChildren(...b.coats.map((coat,i)=>{
  const el=button('',()=>choose(state.breed,i),{'class':'pick','aria-label':`选择${coat.name}`,'aria-pressed':i===state.coat});const text=document.createElement('span');text.textContent=coat.name;el.append(art(b,i),text);return el;
 }));
 const cap=document.createElement('div');cap.className='platecap';cap.textContent='点击查看大图';$('hero').replaceChildren(art(b,state.coat,380),cap);
 $('cat-name').textContent=c.name;$('cat-sub').textContent=b.name;$('cat-note').textContent=b.note;
 $('candidate-cards').replaceChildren(...breeds.flatMap((breed,bi)=>breed.coats.map((coat,ci)=>{
  const el=button('',()=>openDetail(bi,ci),{'class':'catchip','aria-label':`查看${breed.short}${coat.name}详情`});const text=document.createElement('span');text.className='cname';text.textContent=`${breed.short} · ${coat.name}`;el.append(art(breed,ci),text);return el;
 })));
 $('coat-tabs').replaceChildren(...b.coats.map((coat,i)=>{const el=button('',()=>choose(state.breed,i),{'class':'tab','aria-pressed':i===state.coat,'aria-label':`切换到${coat.name}`});el.append(art(b,i),document.createTextNode(coat.name));return el;}));
 $('result-cards').replaceChildren(...b.coats.map((coat,i)=>{const el=button('',()=>openDetail(state.breed,i),{'class':'catchip','aria-label':`放大${coat.name}`,'aria-pressed':i===state.coat});const text=document.createElement('span');text.className='cname';text.textContent=coat.name;el.append(art(b,i),text);return el;}));
}
$('close-detail').onclick=()=>$('detail').close();
$('use-cat').onclick=()=>{choose(state.detailBreed,state.detailCoat);$('detail').close();$('hero').focus();$('hero').scrollIntoView({block:'center',behavior:'instant'});};
$('open-detail').onclick=$('hero').onclick=()=>openDetail(state.breed,state.coat);
$('density').onclick=e=>{const b=e.target.closest('[data-density]');if(!b)return;document.body.dataset.density=b.dataset.density;$('density').querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',el===b));};
$('theme').onclick=e=>{const b=e.target.closest('[data-theme]');if(!b)return;document.documentElement.dataset.theme=b.dataset.theme;$('theme').querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',el===b));};
Promise.all(breeds.map(async b=>{const r=await prepare(b);cache.set(b.id,b.coats.map(c=>r.render(c)));})).then(()=>{draw();$('loading').textContent='四品种 · 十二花色已就绪';}).catch(e=>{$('loading').textContent=`素材加载失败：${e.message}`;$('loading').className='error';});
