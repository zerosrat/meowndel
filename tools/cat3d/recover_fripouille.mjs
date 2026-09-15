// Recover the unposed source meshes from the archived, malformed skin export.
import {readFileSync, writeFileSync} from 'node:fs';
const path='art/cat3d/fripouille-v2/source/';
const b=readFileSync(path+'fripouille-original.glb');
const size=b.readUInt32LE(12); const j=JSON.parse(b.subarray(20,20+size));
j.nodes=j.meshes.map((m,i)=>({name:m.name,mesh:i}));
j.scenes=[{nodes:[0,1,2]}];j.scene=0;delete j.skins;delete j.animations;
for(const m of j.meshes)for(const p of m.primitives){delete p.attributes.JOINTS_0;delete p.attributes.WEIGHTS_0;delete p.attributes.NORMAL;delete p.attributes.TANGENT;}
let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
const head=Buffer.alloc(20);head.write('glTF');head.writeUInt32LE(2,4);head.writeUInt32LE(20+json.length+b.length-20-size,8);head.writeUInt32LE(json.length,12);head.writeUInt32LE(0x4e4f534a,16);
writeFileSync(path+'fripouille-unposed.glb',Buffer.concat([head,json,b.subarray(20+size)]));
