import { coatName } from "../genetics/naming";
import { WHITE_FRAC } from "../genetics/loci";
import type { CoatSpec } from "../genetics/phenotype";

/* ============ 三、SVG 画猫 ============ */
export var COAT = {
  blackSolid:{ D:"#38332E", d:"#7F8990" },
  blackGround:{ D:"#907B5B", d:"#9DA6AB" },
  blackStripe:{ D:"#37312A", d:"#5D6971" },
  orangeGround:{ D:"#E09E51", d:"#F0D5A8" },
  orangeStripe:{ D:"#BC661F", d:"#D9AF77" },
  white:"#F8F6F2", eye:"#DFB149", pupil:"#2A2622", nose:"#D6928E"
};
var GEO = {
  earL:"M32,45 L25,12 L53,32 Z", earR:"M88,45 L95,12 L67,32 Z",
  body:"M36,64 C25,80 23,114 27,126 L93,126 C97,114 95,80 84,64 Z",
  tail:"M90,126 C119,124 121,86 103,77 C111,92 109,115 87,117 Z",
  head:{cx:60,cy:48,rx:31,ry:27}
};
// catSVG 的输出含自增 id，因此依赖调用次数；冻结基线按顺序调用 360 次录制，单独跑某个状态会得到不同的 id
var UID=0;
export function mulberry(seed: number): () => number { var t=seed>>>0; return function(){ t+=0x6D2B79F5; var r=t; r=Math.imul(r^r>>>15,r|1); r^=r+Math.imul(r^r>>>7,r|61); return ((r^r>>>14)>>>0)/4294967296; }; }
function shapes(fill: string, attr: string): string {
  return '<path d="'+GEO.tail+'" fill="'+fill+'" '+attr+'/>'
       + '<path d="'+GEO.earL+'" fill="'+fill+'" '+attr+'/>'
       + '<path d="'+GEO.earR+'" fill="'+fill+'" '+attr+'/>'
       + '<path d="'+GEO.body+'" fill="'+fill+'" '+attr+'/>'
       + '<ellipse cx="'+GEO.head.cx+'" cy="'+GEO.head.cy+'" rx="'+GEO.head.rx+'" ry="'+GEO.head.ry+'" fill="'+fill+'" '+attr+'/>';
}
function waveTop(y: number, rng: () => number): string {
  var d="M-8,140 L-8,"+y.toFixed(1), x=-8;
  while(x<132){ var nx=x+18+rng()*16, cy=y+(rng()*16-8), ey=y+(rng()*9-4.5);
    d+=" Q"+((x+nx)/2).toFixed(1)+","+cy.toFixed(1)+" "+nx.toFixed(1)+","+ey.toFixed(1); x=nx; }
  return d+" L140,140 Z";
}
export function catSVG(spec: CoatSpec, seed: number, size: number): string {
  var id="c"+(++UID), rng=mulberry((seed||1)*2654435761%2147483647);
  var dk: "D" | "d" = spec.dilute?"d":"D", ground: string, stripe: string | null = null;
  if(spec.series==="orange"){ ground=COAT.orangeGround[dk]; stripe=COAT.orangeStripe[dk]; }
  else if(spec.series==="black"){
    if(spec.tabby){ ground=COAT.blackGround[dk]; stripe=COAT.blackStripe[dk]; }
    else ground=COAT.blackSolid[dk];
  } else {
    ground = spec.tabby ? COAT.blackGround[dk] : COAT.blackSolid[dk];
    stripe = spec.tabby ? COAT.blackStripe[dk] : null;
  }
  var s='<svg viewBox="0 0 132 134" width="'+size+'" height="'+Math.round(size*134/132)+'" role="img" aria-label="'+coatName(spec.series,spec.dilute,spec.tabby,spec.white)+'">';
  s+='<defs><clipPath id="clip'+id+'">'+shapes("#000","")+'</clipPath>';
  if(spec.long) s+='<filter id="f'+id+'" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="0.075" numOctaves="2" seed="'+(seed%97)+'" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="8" xChannelSelector="R" yChannelSelector="G"/></filter>';
  s+='</defs>';
  if(spec.long) s+='<g filter="url(#f'+id+')" opacity=".85" transform="translate(60,72) scale(1.10) translate(-60,-72)">'+shapes(ground,"")+'</g>';
  s+='<g stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">'+shapes(ground,"")+'</g>';
  s+='<g clip-path="url(#clip'+id+')">';
  if(spec.series==="tortie"){
    var oc=COAT.orangeGround[dk];
    for(var i=0;i<9;i++){
      var cx=14+rng()*104, cy=14+rng()*112, r=9+rng()*15;
      s+='<ellipse cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" rx="'+r.toFixed(1)+'" ry="'+(r*(.65+rng()*.7)).toFixed(1)+'" fill="'+oc+'" transform="rotate('+(rng()*180).toFixed(0)+' '+cx.toFixed(1)+' '+cy.toFixed(1)+')"/>';
    }
  }
  if(stripe){
    var st = spec.series==="tortie" ? 'stroke="rgba(30,24,18,.42)"' : 'stroke="'+stripe+'"';
    s+='<g fill="none" '+st+' stroke-width="4.6" stroke-linecap="round">'
     + '<path d="M25,68 Q60,80 95,68"/><path d="M24,83 Q60,95 96,83"/>'
     + '<path d="M24,98 Q60,110 96,98"/><path d="M26,113 Q60,124 94,113"/>'
     + '<path d="M46,25 Q51,35 47,44"/><path d="M60,21 Q60,33 60,40"/><path d="M74,25 Q69,35 73,44"/>'
     + '<path d="M96,88 L114,92"/><path d="M98,104 L116,104"/></g>';
  }
  if(spec.white>0){
    if(spec.white===1){
      s+='<g fill="'+COAT.white+'"><ellipse cx="60" cy="90" rx="13" ry="17"/>'
       + '<rect x="30" y="112" width="19" height="16" rx="7"/><rect x="71" y="112" width="19" height="16" rx="7"/>'
       + '<ellipse cx="60" cy="66" rx="9" ry="6"/></g>';
    } else {
      var y = 132 - WHITE_FRAC[spec.white]*132;
      s+='<path d="'+waveTop(y,rng)+'" fill="'+COAT.white+'"/>';
      if(spec.white>=3) s+='<path d="M53,16 Q60,44 55,64 L66,64 Q62,42 68,16 Z" fill="'+COAT.white+'"/>';
    }
  }
  s+='</g>';
  s+='<g><ellipse cx="48.5" cy="49" rx="6.2" ry="7" fill="'+COAT.eye+'"/><ellipse cx="71.5" cy="49" rx="6.2" ry="7" fill="'+COAT.eye+'"/>'
   + '<ellipse cx="48.5" cy="49" rx="1.9" ry="6" fill="'+COAT.pupil+'"/><ellipse cx="71.5" cy="49" rx="1.9" ry="6" fill="'+COAT.pupil+'"/>'
   + '<path d="M56,60 L64,60 L60,64.5 Z" fill="'+COAT.nose+'"/></g>';
  return s+'</svg>';
}
