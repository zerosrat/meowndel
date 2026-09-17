"""Extract a candidate material; reuse an existing body only after exact geometry/UV checks."""
import copy, hashlib, json, math, struct
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
DEMO = ROOT / 'demos/tripo-cat'
source = json.loads((DEMO / 'asset-manifest.json').read_text())
archive = Path(source['archive']).expanduser()
path = archive / 'cat-tabbyWhite-80k-2k.glb'
out = archive / 'natural-white'
out.mkdir(exist_ok=True)
def sha(data): return hashlib.sha256(data).hexdigest()
def read(path):
 data = path.read_bytes(); n = struct.unpack_from('<I', data, 12)[0]
 return json.loads(data[20:20+n]), data[28+n:]
def clean(value):
 if isinstance(value, dict): return {k:clean(v) for k,v in value.items() if k not in ['name','extras']}
 if isinstance(value, list): return [clean(v) for v in value]
 return value
def identity(j,b):
 accessors=[]
 for a in j['accessors']:
  v=j['bufferViews'][a['bufferView']]; start=v.get('byteOffset',0)
  accessors.append({**{k:x for k,x in a.items() if k!='bufferView'},'layout':{k:x for k,x in v.items() if k not in ['buffer','byteOffset']},'bytes':sha(b[start:start+v['byteLength']])})
 meshes=clean(j['meshes'])
 for mesh in meshes:
  for p in mesh['primitives']: p.pop('material',None)
 return {'accessors':accessors,'meshes':meshes,'nodes':clean(j['nodes']),'scenes':clean(j['scenes']),'scene':j.get('scene',0)}
def save(name,data):
 p=out/name
 if p.exists() and p.read_bytes()!=data: raise ValueError(f'Refuse changed output {p}')
 p.write_bytes(data)
 return {'file':name,'bytes':len(data),'sha256':sha(data)}
previous=DEMO/'natural-white-manifest.json'
if previous.exists():
 expected=json.loads(previous.read_text())['source']['sha256']
 assert sha(path.read_bytes())==expected, 'Candidate source changed; archive as a new revision instead'
j,b=read(path)
assert len(j['materials'])==1 and len(j['meshes'])==1 and not j.get('skins') and not j.get('animations')
groups=json.loads((DEMO/'grouped-manifest.json').read_text())
match=None
for body in groups['bodies']:
 existing=DEMO/'grouped-assets'/body['file']
 assert sha(existing.read_bytes())==body['sha256'], 'Existing body hash mismatch'
 if identity(*read(existing))==identity(j,b):
  match=body; break
# A new export can change topology or UVs. Never force a material onto an incompatible body.
if match:
 body_url='grouped-assets/'+match['file']; rotation=match['rotationY']; body_asset=match
else:
 body=copy.deepcopy(j); ids=sorted({a['bufferView'] for a in j['accessors']}); buf=bytearray(); views=[]
 for idx in ids:
  old=j['bufferViews'][idx]; start=old.get('byteOffset',0); buf+=b'\0'*(-len(buf)%4)
  views.append({**old,'buffer':0,'byteOffset':len(buf)}); buf+=b[start:start+old['byteLength']]
 for a in body['accessors']: a['bufferView']=ids.index(a['bufferView'])
 for key in ['materials','images','textures','samplers']: body.pop(key,None)
 for mesh in body['meshes']:
  for primitive in mesh['primitives']: primitive.pop('material',None)
 body['bufferViews']=views; body['buffers']=[{'byteLength':len(buf)}]
 js=json.dumps(body,separators=(',',':')).encode(); js+=b' '*(-len(js)%4); buf+=b'\0'*(-len(buf)%4)
 blob=struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
 body_asset=save('body.glb',blob); body_url='natural-assets/body.glb'; rotation=-math.pi/2
mat={k:copy.deepcopy(j[k]) for k in ['asset','materials','textures','samplers','images'] if k in j}; images=[]
for image in mat['images']:
 v=j['bufferViews'][image.pop('bufferView')]; start=v.get('byteOffset',0); blob=b[start:start+v['byteLength']]
 image['uri']=sha(blob)+('.jpg' if image['mimeType']=='image/jpeg' else '.png'); images.append(save(image['uri'],blob))
material=save('tabbyWhite.gltf',json.dumps(mat,separators=(',',':')).encode())
manifest={'taskId':'c4b8c823-16bf-4c3d-a254-d37677d12b82','original':{'file':'cat-tabbyWhite-4k.glb','sha256':sha((archive/'cat-tabbyWhite-4k.glb').read_bytes()),'bytes':(archive/'cat-tabbyWhite-4k.glb').stat().st_size},'source':{'file':path.name,'bytes':path.stat().st_size,'sha256':sha(path.read_bytes())},'body':body_url,'rotationY':rotation,'material':'natural-assets/'+material['file'],'sharedWith':match['coats'] if match else [],'bodyAsset':body_asset,'materialAsset':material,'images':images,'note':('几何、UV 与已有 '+' / '.join({'black':'纯黑','blue':'纯蓝灰'}.get(k,k) for k in match['coats'])+' 完全匹配，复用该组身体；新增独立完整材质。' if match else '新导出的几何或 UV 与现有组不完全一致；本样板保留独立身体，没有强行套用。')}
(DEMO/'natural-white-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
link=DEMO/'natural-assets'
if not link.exists(): link.symlink_to(out,target_is_directory=True)
assert link.resolve()==out
print(json.dumps(manifest,ensure_ascii=False,indent=2))
