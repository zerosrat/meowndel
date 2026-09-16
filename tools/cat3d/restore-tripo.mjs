/** Restore only known, hash-verified local assets. Never overwrite existing files. */
import {readFile, lstat, symlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(await readFile(resolve(root,'demos/tripo-cat/asset-manifest.json'),'utf8'));
const archive=process.argv[2]?resolve(process.argv[2]):manifest.archive.replace(/^~/,homedir());
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const asset of [...manifest.assets,...(manifest.references??[])]){
 const source=resolve(archive,asset.file),target=resolve(root,'demos/tripo-cat',asset.file);
 if(digest(await readFile(source))!==asset.sha256)throw new Error(`Archive checksum mismatch: ${asset.file}`);
 let existing;try{existing=await lstat(target);}catch(error){if(error.code!=='ENOENT')throw error;}
 if(existing){
  if(digest(await readFile(target))!==asset.sha256)throw new Error(`Existing file differs; left unchanged: ${target}`);
  console.log(`Verified ${asset.file}`);
 }else{await symlink(source,target);console.log(`Linked ${asset.file}`);}
}
