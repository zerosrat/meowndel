// Standalone Vite-served verification page; never imported by the product entry.
import { domesticArtSpec } from './spec';
import { domesticMasks, loadDomesticMaster, domesticPixels, domesticPortrait } from './browser';
import { WHITE_FRAC, WHITE_LABEL } from '../genetics';
const status=document.getElementById('status')!;
async function check(){
  let count=0,alphaErrors=0,protectedErrors=0;const fractions:Record<string,number[]>={};
  const patternAreas:Record<string,{stripe:number;patch:number}>={};
  for(const long of [false,true]){
    const source=await loadDomesticMaster(long);
    const seedSpec=domesticArtSpec({series:'black',dilute:false,tabby:false,white:0,long},7)!;
    const masks=domesticMasks(source,seedSpec);let total=0;
    const areas=[0,0,0,0,0];let stripeArea=0,patchArea=0;
    for(let j=0;j<masks.fur.length;j++){
      const w=masks.fur[j]*source.data[j*4+3]/255;total+=w;
      stripeArea+=w*masks.stripe[j]/255;patchArea+=w*masks.patches[j]/255;
      for(let level=1;level<=4;level++)areas[level]+=w*Math.max(0,Math.min(1,(WHITE_FRAC[level]-masks.whiteRank[j])/.004+.5));
    }
    fractions[long?'long':'short']=areas.map(a=>a/total);
    patternAreas[long?'long':'short']={stripe:stripeArea/total,patch:patchArea/total};
    for(const series of ['black','orange','tortie'] as const)for(const dilute of [false,true])
    for(const tabby of (series==='orange'?[true]:[false,true]))for(const white of [0,1,2,3,4]){
      const spec=domesticArtSpec({series,dilute,tabby,white,long},7)!;
      const pixels=await domesticPixels(spec);
      for(let j=0;j<masks.fur.length;j++){
        const i=j*4;if(pixels.data[i+3]!==source.data[i+3])alphaErrors++;
        if(!masks.fur[j])for(let c=0;c<3;c++)if(pixels.data[i+c]!==source.data[i+c])protectedErrors++;
      }
      const fig=document.createElement('figure'),img=document.createElement('img'),cap=document.createElement('figcaption');
      img.src=await domesticPortrait(spec,7);img.alt=spec.label;cap.textContent=`${spec.label} · ${tabby?'有纹':'无纹'} · ${WHITE_LABEL[white]}`;
      fig.append(img,cap);document.getElementById('grid')!.append(fig);count++;
      await new Promise(resolve=>setTimeout(resolve,0));
    }
  }
  const calibrated=Object.values(fractions).every(a=>a.every((v,i)=>Math.abs(v-WHITE_FRAC[i])<.01));
  const patternsVisible=Object.values(patternAreas).every(a=>a.stripe>.05&&a.stripe<.5&&a.patch>.1&&a.patch<.8);
  const report={count,alphaErrors,protectedErrors,whiteFractions:fractions,calibrated,patternAreas,patternsVisible};
  status.dataset.report=JSON.stringify(report);status.textContent=JSON.stringify(report,null,2);
  if(count!==100||alphaErrors||protectedErrors||!calibrated||!patternsVisible)throw new Error('校验未通过');
}
check().catch(e=>{status.textContent+='\n'+e.message;status.dataset.error='true';});
