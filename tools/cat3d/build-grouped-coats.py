"""Restore five shared bodies and deduplicated original textures for eleven coats."""
import copy,hashlib,json,struct,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SOURCE=json.loads((ROOT/'demos/tripo-cat/asset-manifest.json').read_text())
ARCHIVE=Path(SOURCE['archive']).expanduser(); OUT=ARCHIVE/'grouped-coats'
audit=json.loads(subprocess.check_output([sys.executable,str(ROOT/'tools/cat3d/audit-reuse.py')]))
OUT.mkdir(exist_ok=True)
def sha(b):return hashlib.sha256(b).hexdigest()
def save(name,data):
 p=OUT/name
 if p.exists() and p.read_bytes()!=data:raise ValueError(f'Refuse changed output {p}')
 p.write_bytes(data);return {'file':name,'bytes':len(data),'sha256':sha(data)}
def read(asset):
 b=(ARCHIVE/asset['file']).read_bytes();assert sha(b)==asset['sha256']
 n=struct.unpack_from('<I',b,12)[0];return json.loads(b[20:20+n]),b[28+n:]
def glb(j,b):
 js=json.dumps(j,separators=(',',':')).encode();js+=b' '*(-len(js)%4);b+=b'\0'*(-len(b)%4)
 return struct.pack('<III',0x46546c67,2,28+len(js)+len(b))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b
manifest={'bodies':[],'coats':[]}; files={}
for keys in audit['groups']:
 representative=next(a for a in SOURCE['assets'] if a['key']==keys[0]);j,b=read(representative)
 assert len(j['meshes'])==1 and len(j['meshes'][0]['primitives'])==1 and len(j['materials'])==1
 body=copy.deepcopy(j);geom_indices=sorted({a['bufferView'] for a in j['accessors']});buf=bytearray();views=[]
 for idx in geom_indices:
  old=j['bufferViews'][idx];start=old.get('byteOffset',0);buf+=b'\0'*(-len(buf)%4)
  views.append({**old,'buffer':0,'byteOffset':len(buf)});buf+=b[start:start+old['byteLength']]
 for a in body['accessors']:a['bufferView']=geom_indices.index(a['bufferView'])
 for k in ['images','textures','samplers','materials']:body.pop(k,None)
 for mesh in body['meshes']:
  for prim in mesh['primitives']:prim.pop('material',None)
 body['bufferViews']=views;body['buffers']=[{'byteLength':len(buf)}]
 entry=save('body-'+keys[0]+'.glb',glb(body,bytes(buf)));files[entry['file']]=entry
 manifest['bodies'].append({'key':keys[0],**entry,'rotationY':representative.get('rotationY',0),'coats':keys})
 for key in keys:
  source=next(a for a in SOURCE['assets'] if a['key']==key);j,b=read(source)
  mat={k:copy.deepcopy(j[k]) for k in ['asset','materials','textures','samplers','images'] if k in j};images=[]
  for image in mat['images']:
   v=j['bufferViews'][image.pop('bufferView')];start=v.get('byteOffset',0);blob=b[start:start+v['byteLength']]
   suffix={'image/jpeg':'jpg','image/png':'png'}[image['mimeType']];image['uri']=sha(blob)+'.'+suffix
   asset=save(image['uri'],blob);files[asset['file']]=asset;images.append(asset)
  material=save(key+'.gltf',json.dumps(mat,separators=(',',':')).encode());files[material['file']]=material
  manifest['coats'].append({'key':key,'body':keys[0],'material':material,'images':images,'originalFile':source['file'],'originalBytes':source['bytes'],'rotationY':source.get('rotationY',0)})
manifest['totalBytes']=sum(a['bytes'] for a in files.values());manifest['originalBytes']=audit['originalBytes']
(ROOT/'demos/tripo-cat/grouped-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
link=ROOT/'demos/tripo-cat/grouped-assets'
if not link.exists():link.symlink_to(OUT,target_is_directory=True)
assert link.resolve()==OUT
print(json.dumps({'bodies':len(manifest['bodies']),'coats':len(manifest['coats']),'originalBytes':manifest['originalBytes'],'totalBytes':manifest['totalBytes']},indent=2))
