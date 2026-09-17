// Restore the acceptance study's external files without silently replacing assets.
import {readFile, lstat, symlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const demo=path.join(root,'demos/tripo-cat');
const manifest=JSON.parse(await readFile(path.join(demo,'blocky-manifest.json'),'utf8'));
const archive=manifest.archive.replace(/^~/,os.homedir());
for(const asset of manifest.assets){
 const file=path.join(archive,asset.file), bytes=await readFile(file);
 if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw new Error(`Source hash mismatch: ${asset.file}`);
 if(!asset.link)continue;
 const target=path.join(demo,asset.file);
 try{await lstat(target);if(createHash('sha256').update(await readFile(target)).digest('hex')!==asset.sha256)throw new Error(`Refuse different local asset: ${target}`);}
 catch(error){if(error.code!=='ENOENT')throw error;await symlink(file,target);}
}
console.log('Blocky cat study assets verified and restored.');
