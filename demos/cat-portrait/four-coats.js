const cats = {
  domestic: { name: '中华田园猫', coats: [
    {name:'橘白',file:'domestic-shape-v4.png'},
    {name:'狸花',file:'domestic-v4-coats.png',cell:0},
    {name:'三花',file:'domestic-v4-coats.png',cell:1}] },
  british: { name: '英国短毛猫', coats: [
    {name:'纯蓝',file:'british.png'}, {name:'蓝白',file:'british-bicolor.png'}] },
  american: { name: '美国短毛猫', coats: [
    {name:'银虎斑',file:'american-coats.png',cell:0},
    {name:'棕虎斑',file:'american-coats.png',cell:1}] },
  ragdoll: { name: '布偶猫', coats: [
    {name:'海豹双色',file:'ragdoll-coats.png',cell:0},
    {name:'蓝双色',file:'ragdoll-coats.png',cell:1}] }
};
const state={breed:'domestic',size:320,selected:Object.fromEntries(Object.keys(cats).map(k=>[k,0]))};
const breeds=document.getElementById('breeds');
breeds.innerHTML=Object.entries(cats).map(([key,c])=>`<button data-breed="${key}" aria-pressed="false">${c.name}</button>`).join('')+'<button data-breed="all" aria-pressed="false">四只一起</button>';
function draw(){
  const keys=state.breed==='all'?Object.keys(cats):[state.breed];
  const all=state.breed==='all';
  document.getElementById('patterns').innerHTML=keys.map(k=>`<div style="margin-bottom:14px"><div class="small" style="margin-bottom:6px">${cats[k].name}</div><div class="choices">${cats[k].coats.map((c,i)=>`<button data-cat="${k}" data-coat="${i}" aria-pressed="${state.selected[k]===i}">${c.name}</button>`).join('')}</div></div>`).join('');
  const gallery=document.getElementById('gallery');
  gallery.classList.toggle('compare',all);
  gallery.innerHTML=keys.map(k=>{const cat=cats[k],coat=cat.coats[state.selected[k]];const strip=coat.cell!==undefined;return `<figure class="portrait"><div class="sprite" role="img" aria-label="${cat.name}，${coat.name}" style="--size:${state.size}px;background-image:url('flat-assets/${coat.file}');${strip?`background-size:200% 100%;background-position:${coat.cell*100}% center;`:''}"></div><figcaption>${cat.name} · ${coat.name}</figcaption></figure>`}).join('');
  document.getElementById('stageTitle').textContent=all?'四品种 · 自由搭配':cats[state.breed].name+' / '+cats[state.breed].coats[state.selected[state.breed]].name;
  document.getElementById('sizeNote').textContent=all?'各品种可独立切换花色':state.size+' px 画布 · 窄屏自动适配';
  document.querySelectorAll('[data-breed]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.breed===state.breed));
  document.querySelectorAll('[data-size]').forEach(b=>{b.disabled=all;b.style.opacity=all?'.4':'1';b.setAttribute('aria-pressed',Number(b.dataset.size)===state.size)});
}
breeds.onclick=e=>{const b=e.target.closest('[data-breed]');if(b){state.breed=b.dataset.breed;draw()}};
document.getElementById('patterns').onclick=e=>{const b=e.target.closest('[data-coat]');if(b){state.selected[b.dataset.cat]=Number(b.dataset.coat);draw()}};
document.getElementById('backgrounds').onclick=e=>{const b=e.target.closest('[data-bg]');if(b){document.getElementById('stage').dataset.bg=b.dataset.bg;document.querySelectorAll('button[data-bg]').forEach(x=>x.setAttribute('aria-pressed',x===b))}};
document.getElementById('sizes').onclick=e=>{const b=e.target.closest('[data-size]');if(b){state.size=Number(b.dataset.size);draw()}};
draw();
for(const cat of Object.values(cats))for(const coat of cat.coats){const image=new Image();image.src='flat-assets/'+coat.file;}
