"""Derive shared-body assets without altering originals; binaries remain outside Git."""
import copy, hashlib, json, struct
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = Path.home()/'.local/share/meowndel/soft-low-poly-cat-2026-09-16'
OUT = ARCHIVE/'shared-coats'
SOURCES = json.loads((ROOT/'demos/tripo-cat/asset-manifest.json').read_text())['assets']
KEYS = ['cream', 'blueTabby', 'blueWhite', 'diluteCalico', 'tortie']
def read(key):
    data=(ARCHIVE/f'cat-{key}-80k-2k.glb').read_bytes()
    expected=next(a['sha256'] for a in SOURCES if a['key']==key)
    assert hashlib.sha256(data).hexdigest()==expected, f'Source checksum mismatch: {key}'
    n=struct.unpack_from('<I',data,12)[0]
    return json.loads(data[20:20+n]),data[28+n:]
def save(name,data):
    path=OUT/name
    if path.exists() and path.read_bytes()!=data: raise ValueError(f'Refuse to overwrite changed {path}')
    path.write_bytes(data)
    return {'file':name,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def encode(j,b):
    js=json.dumps(j,separators=(',',':')).encode();js+=b' '*(-len(js)%4);b+=b'\0'*(-len(b)%4)
    return struct.pack('<III',0x46546c67,2,28+len(js)+len(b))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(b),0x004e4942)+b
OUT.mkdir(exist_ok=True)
base,raw=read(KEYS[0]); views=base['bufferViews']; image_views={i['bufferView'] for i in base['images']}
assert image_views==set(range(4,len(views)))
end=max(v.get('byteOffset',0)+v['byteLength'] for v in views[:4])
body=copy.deepcopy(base)
for k in ['images','textures','samplers','materials']:body.pop(k,None)
for mesh in body['meshes']:
    for prim in mesh['primitives']:prim.pop('material',None)
body['bufferViews']=body['bufferViews'][:4];body['buffers']=[{'byteLength':end}]
manifest={'body':save('body.glb',encode(body,raw[:end])),'coats':[]}
for key in KEYS:
    j,b=read(key)
    assert j['accessors']==base['accessors'] and j['bufferViews'][:4]==views[:4] and b[:end]==raw[:end],key
    assert [{k:v for k,v in n.items() if k!='name'} for n in j['nodes']]==[{k:v for k,v in n.items() if k!='name'} for n in base['nodes']],key
    assert [m['primitives'] for m in j['meshes']]==[m['primitives'] for m in base['meshes']],key
    mat={k:copy.deepcopy(j[k]) for k in ['asset','materials','textures','samplers','images']}
    assets=[]
    for idx,img in enumerate(mat['images']):
        v=j['bufferViews'][img.pop('bufferView')];off=v.get('byteOffset',0)
        img['uri']=f'{key}-{idx}.jpg';assets.append(save(img['uri'],b[off:off+v['byteLength']]))
    entry=save(f'{key}.gltf',json.dumps(mat,separators=(',',':')).encode())
    manifest['coats'].append({'key':key,'material':entry,'images':assets,'originalBytes':(ARCHIVE/f'cat-{key}-80k-2k.glb').stat().st_size})
(ROOT/'demos/tripo-cat/shared-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
link=ROOT/'demos/tripo-cat/shared-assets'
if not link.exists():link.symlink_to(OUT,target_is_directory=True)
assert link.resolve()==OUT
print('Verified identical geometry, UVs, primitives and transforms for five coats.')
print('Original bytes:',sum(c['originalBytes'] for c in manifest['coats']))
print('Shared bytes:',manifest['body']['bytes']+sum(c['material']['bytes']+sum(i['bytes'] for i in c['images']) for c in manifest['coats']))
