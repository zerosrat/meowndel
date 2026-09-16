// Run with: node --import tsx tools/audit-cat-art-coverage.mjs [--json]
// Read-only audit: current model facts versus explicit, non-production art candidates.
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {buildTarget,mateList,childrenWith,CANON,canonSpec,coatName} from '../src/genetics/index.ts';
import {normalizeUi,QUICK} from '../src/ui/types.ts';
import {breeds} from '../demos/cat-portrait/breed-layers.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const contract=JSON.parse(readFileSync(resolve(root,'demos/cat-portrait/coverage-contract.json'),'utf8'));
const key=s=>[s.series,s.dilute?'d':'D',s.tabby?'tabby':'solid',s.white,s.long?'long':'short'].join('/');
const label=s=>(s.long?'长毛':'短毛')+coatName(s.series,s.dilute,s.tabby,s.white);
const index=new Map(contract.assets.map(a=>[`${a.breed}/${a.coat}`,a]));
const actual=breeds.flatMap(b=>b.coats.map(c=>({id:`${b.id}/${c.id}`,name:`${b.name} · ${c.name}`})));
if(index.size!==contract.assets.length||actual.length!==index.size||actual.some(a=>!index.has(a.id)))throw new Error('Demo inventory changed: update coverage-contract.json before auditing.');
const candidates=new Map(contract.assets.filter(a=>a.spec).map(a=>[key(a.spec),a]));
const specs=new Map(),normalized=new Set(),children=new Map(),names=new Map();
let raw=0,pairs=0,nonNullPairs=0;
for(const series of ['black','orange','tortie'])for(const dilute of [false,true])for(const tabby of [true,false])for(let white=0;white<5;white++)for(const long of [false,true])for(const sex of ['M','F','?']){
 raw++;const ui=normalizeUi({series,dilute,tabby,white,long,sex});normalized.add(JSON.stringify(ui));
 const spec={series:ui.series,dilute:ui.dilute,tabby:ui.tabby,white:ui.white,long:ui.long};specs.set(key(spec),spec);
 const target=buildTarget(ui);
 for(const mate of mateList(target)){
  pairs++;const result=childrenWith(target,mate);if(!result)continue;nonNullPairs++;
  for(const sp of Object.values(result.specs))children.set(key(sp),sp);
 }
}
for(const [k,s]of specs){const n=label(s);if(!names.has(n))names.set(n,[]);names.get(n).push(k);}
const counts=list=>{
 const out={total:list.length,candidate:0,whiteCalibration:0,noCandidate:0};
 for(const s of list){const c=candidates.get(key(s));if(c?.category==='candidate')out.candidate++;else if(c?.category==='white-calibration')out.whiteCalibration++;else out.noCandidate++;}return out;
};
const report={
 baseCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 qualification:'Candidate counts are manually declared semantic matches, not implemented coverage or population coverage. No production renderer is connected.',
 rawUiStates:raw,normalizedUiStates:normalized.size,distinctCoatSpecs:specs.size,
 rawStateMateEvaluations:pairs,nonNullPairs,distinctChildCoatSpecs:children.size,
 assets:actual.map(a=>({...a,...index.get(a.id)})),
 surfaces:{self:counts([...specs.values()]),quick:counts(QUICK.map(q=>normalizeUi(q.ui))),catalog:counts(CANON.map(canonSpec)),children:counts([...children.values()])},
 nameCollisions:[...names].filter(([,keys])=>keys.length>1).map(([name,keys])=>({name,keys})),
 missingSpecs:[...specs.values()].filter(s=>!candidates.has(key(s))).map(s=>({key:key(s),name:label(s)})),
 catalog:CANON.map(c=>({name:c.name,key:key(canonSpec(c)),category:candidates.get(key(canonSpec(c)))?.category??'no-candidate'}))
};
if(process.argv.includes('--json'))console.log(JSON.stringify(report,null,2));
else{
 console.log(`Base ${report.baseCommit}\nUI: ${raw} raw / ${normalized.size} normalized / ${specs.size} distinct CoatSpec\nChildren: ${pairs} evaluations / ${children.size} distinct CoatSpec\nArt: ${actual.length} variants; production integration: none`);
 console.table(report.surfaces);
 console.table(report.catalog);
 console.log(`Name collisions: ${report.nameCollisions.length}. Example:`,report.nameCollisions[0]);
}
