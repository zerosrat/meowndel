import {readFile, mkdir, copyFile, access} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, resolve, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(repo,'demos/cat-portrait');
const archiveArg=process.argv[2] || process.env.MEOWNDEL_CAT_DEMO_ASSETS;
if(!archiveArg){console.error('Usage: node tools/restore-cat-demo-assets.mjs /path/to/cat-2d-validation-2026-09-16');process.exit(1);}
const archive=resolve(archiveArg);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function within(root,path){const out=resolve(root,path),rel=relative(root,out);if(!rel||rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw new Error(`Unsafe asset path: ${path}`);return out;}
try{
 const manifest=JSON.parse(await readFile(resolve(target,'asset-manifest.json'),'utf8'));
 const pending=[];
 // Check the entire archive and existing destinations before copying anything.
 for(const asset of manifest.assets){
  const source=within(archive,asset.path),dest=within(target,asset.path);
  const bytes=await readFile(source);
  if(bytes.length!==asset.bytes||sha(bytes)!==asset.sha256)throw new Error(`Archive checksum mismatch: ${asset.path}`);
  let exists=true;try{await access(dest);}catch(e){if(e.code==='ENOENT')exists=false;else throw e;}
  if(exists){if(sha(await readFile(dest))!==asset.sha256)throw new Error(`Refusing to replace a different local asset: ${asset.path}`);}
  else pending.push({source,dest});
 }
 for(const {source,dest}of pending){await mkdir(dirname(dest),{recursive:true});await copyFile(source,dest,constants.COPYFILE_EXCL);}
 console.log(`Verified ${manifest.assets.length} assets; restored ${pending.length}; existing files preserved.`);
}catch(e){console.error(e.message);process.exitCode=1;}
