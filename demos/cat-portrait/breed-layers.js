import {N,canvas,loadMaster,domesticRenderer,domesticCoats} from './coat-renderer.js';

export const breeds=[
 {id:'domestic',name:'中华田园猫',short:'田园猫',file:'domestic-neutral-master.png',coats:domesticCoats,initial:4,
  note:'沿用已认可的中和版底稿；耳朵较大、体态轻巧。',eyes:[[394,304,30,40],[556,341,35,35]],samples:[[394,304],[556,341],[457,360]]},
 {id:'british',name:'英国短毛猫',short:'英短',file:'british.png',initial:0,
  note:'直接复用已认可的原版英短；圆脸、小耳朵、短粗四肢。',eyes:[[335,335,28,35],[565,382,27,33]],samples:[[335,335],[565,382],[439,369]],
  coats:[{id:'blue',name:'纯蓝',base:[145,153,170]},{id:'blue-white',name:'蓝白',base:[145,153,170],white:true}]},
 {id:'american',name:'美国短毛猫',short:'美短',file:'american-coats.png',cell:0,initial:0,
  note:'复用原银虎斑底稿；保留结实身形与侧腹回旋纹。浅色毛区不等同于遗传白斑。',eyes:[[396,286,35,40],[590,286,35,40]],samples:[[396,286],[590,286],[484,333]],
  coats:[{id:'silver',name:'银虎斑',base:[207,196,190],stripe:[85,79,77],light:[250,236,219]},
   {id:'brown',name:'棕虎斑',base:[193,157,119],stripe:[102,75,54],light:[250,232,204]}]},
 {id:'ragdoll',name:'布偶猫',short:'布偶',file:'ragdoll-coats.png',cell:1,initial:0,
  note:'复用原蓝双色底稿；保留蓝眼睛、长毛围脖与蓬松尾巴。',eyes:[[389,264,42,44],[550,282,42,44]],samples:[[389,264],[550,282],[449,310]],
  coats:[{id:'seal-bicolor',name:'海豹双色',base:[163,130,105],point:true,white:true},
   {id:'blue-bicolor',name:'蓝双色',base:[143,145,161],point:true,white:true}]}
];
const clamp=x=>Math.max(0,Math.min(1,x));
const white=[255,246,232];

// Color-region masks come from the approved artwork. They retain its grain,
// shadows and pattern edges, instead of generating a new cat for each coat.
function extractedRenderer(breed,master){
 const source=master.getContext('2d').getImageData(0,0,N,N),src=source.data;
 const mask=new Float32Array(N*N),kind=new Uint8Array(N*N),protectedPixels=new Uint8Array(N*N);
 const whiteMap=canvas(),wc=whiteMap.getContext('2d',{willReadFrequently:true});
 if(breed.id==='british'){
  wc.fillStyle='#fff';
  [
   'M439 317 Q404 387 330 411 Q239 440 119 443 L124 577 L746 614 L752 506 Q608 495 537 438 Q477 389 439 317Z',
   'M249 531 Q445 569 644 578 Q621 656 576 710 L552 694 L489 786 L462 767 L411 813 Q341 763 310 691 Q264 636 249 531Z',
   'M219 893 Q267 862 313 896 Q359 866 406 900 Q457 873 510 905 Q563 866 610 898 L679 966 L201 980Z'
  ].forEach(d=>wc.fill(new Path2D(d)));
 }
 const whiteMask=wc.getImageData(0,0,N,N).data;
 for(let j=0;j<N*N;j++){
  const i=j*4,r=src[i],g=src[i+1],b=src[i+2],lum=(r+g+b)/3;
  if(!src[i+3])continue;
  const x=j%N,y=Math.floor(j/N);
  const eye=breed.eyes.some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<1);
  const fixed=eye||(r-g>27&&r-b>32)||(lum<60);
  if(fixed){protectedPixels[j]=1;continue;}
  if(breed.id==='british'){
   mask[j]=clamp((b-r)/14)*clamp((g-r)/5);kind[j]=1;
  }else if(breed.id==='american'){
   mask[j]=1;
   kind[j]=(r-b>24&&r>165)?3:lum<145?2:1;
  }else{
   mask[j]=1;
   kind[j]=(r-b>18&&r>160)?3:1;
  }
 }
 function render(coat,pattern=true,spots=true){
  const out=canvas(),data=new ImageData(new Uint8ClampedArray(src),N,N),dst=data.data;
  for(let j=0;j<N*N;j++){
   const weight=mask[j];if(!weight)continue;
   const i=j*4;let target,ref;
   if(breed.id==='british'){
    ref=[145,153,170];target=coat.base;
    if(coat.white&&spots){const a=whiteMask[i+3]/255;target=target.map((v,c)=>v*(1-a)+white[c]*a);}
   }else if(breed.id==='american'){
    ref=kind[j]===3?[250,236,219]:kind[j]===2?[85,79,77]:[207,196,190];
    target=kind[j]===3?coat.light:kind[j]===2&&pattern?coat.stripe:coat.base;
   }else{
    ref=kind[j]===3?[250,237,222]:[143,145,161];
    if(kind[j]===3)target=spots?ref:(j/N<450?coat.base:[236,218,198]);
    else target=pattern?coat.base:[241,229,212];
   }
   for(let c=0;c<3;c++)dst[i+c]=src[i+c]*(1-weight)+Math.min(255,src[i+c]*target[c]/ref[c])*weight;
  }
  out.getContext('2d').putImageData(data,0,0);return out;
 }
 return {master,source,render,protectedPixels};
}
export async function prepare(breed){
 const master=await loadMaster(breed.file,breed.cell);
 return breed.id==='domestic'?domesticRenderer(master):extractedRenderer(breed,master);
}
export function validate(renderer,outputs,breed){
 let alphaErrors=0,featureErrors=0,originalErrors=0;
 for(const out of outputs){
  const data=out.getContext('2d').getImageData(0,0,N,N).data,src=renderer.source.data;
  for(let j=0;j<N*N;j++){
   const i=j*4;if(data[i+3]!==src[i+3])alphaErrors++;
   if(renderer.protectedPixels?.[j])for(let c=0;c<3;c++)if(data[i+c]!==src[i+c])featureErrors++;
  }
  for(const [x,y]of breed.samples){const i=(y*N+x)*4;for(let c=0;c<4;c++)if(data[i+c]!==src[i+c])featureErrors++;}
 }
 const originalIndex={british:0,american:0,ragdoll:1}[breed.id];
 if(originalIndex!==undefined){
  const data=outputs[originalIndex].getContext('2d').getImageData(0,0,N,N).data;
  for(let i=0;i<data.length;i++)if(data[i]!==renderer.source.data[i])originalErrors++;
 }
 return {alphaErrors,featureErrors,originalErrors};
}
