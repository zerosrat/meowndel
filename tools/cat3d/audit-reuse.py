"""Read-only GLB compatibility audit. No conversion or asset mutation."""
import hashlib,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'demos/tripo-cat/asset-manifest.json').read_text())
archive=Path(manifest['archive']).expanduser()
def digest(b):return hashlib.sha256(b).hexdigest()
def stable(o):return json.dumps(o,sort_keys=True,separators=(',',':')).encode()
def without_names(o):
    if isinstance(o,dict):return {k:without_names(v) for k,v in o.items() if k not in ['name','extras']}
    if isinstance(o,list):return [without_names(v) for v in o]
    return o
rows=[];groups={};image_groups={}
for asset in manifest['assets']:
    data=(archive/asset['file']).read_bytes();assert digest(data)==asset['sha256'],asset['key']
    n=struct.unpack_from('<I',data,12)[0];j=json.loads(data[20:20+n]);binary=data[n+28:]
    assert len(j['buffers'])==1 and not j.get('skins') and not j.get('animations')
    def view(idx):
        v=j['bufferViews'][idx];start=v.get('byteOffset',0)
        return {'layout':{k:x for k,x in v.items() if k not in ['buffer','byteOffset']},'sha256':digest(binary[start:start+v['byteLength']])}
    accessors=[{**{k:v for k,v in a.items() if k!='bufferView'},'view':view(a['bufferView'])} for a in j['accessors']]
    mesh=without_names(j['meshes'])
    for m in mesh:
        for p in m['primitives']:p.pop('material',None)
    identity={'accessors':accessors,'meshes':mesh,'nodes':without_names(j['nodes']),'scenes':without_names(j['scenes']),'scene':j.get('scene',0),'rotationY':asset.get('rotationY',0)}
    fingerprint=digest(stable(identity));groups.setdefault(fingerprint,[]).append(asset['key'])
    images=[]
    for idx,img in enumerate(j['images']):
        v=j['bufferViews'][img['bufferView']];start=v.get('byteOffset',0);blob=binary[start:start+v['byteLength']];sha=digest(blob)
        images.append({'index':idx,'bytes':len(blob),'sha256':sha});image_groups.setdefault(sha,{'bytes':len(blob),'uses':[]})['uses'].append([asset['key'],idx])
    rows.append({'key':asset['key'],'bodyFingerprint':fingerprint,'bytes':len(data),'imageBytes':sum(i['bytes'] for i in images),'images':images,'materialCount':len(j['materials'])})
original=sum(r['bytes'] for r in rows)
# Non-image bytes retain original per-file metadata: estimate, not exported size.
body_est=sum(next(r['bytes']-r['imageBytes'] for r in rows if r['key']==keys[0]) for keys in groups.values())
print(json.dumps({'groups':list(groups.values()),'originalBytes':original,'sharedBodyEstimatedBytes':body_est,'imageBytes':sum(r['imageBytes'] for r in rows),'uniqueImageBytes':sum(i['bytes'] for i in image_groups.values()),'groupedEstimatedBytes':body_est+sum(i['bytes'] for i in image_groups.values()),'identicalImages':[i for i in image_groups.values() if len(i['uses'])>1],'assets':rows},indent=2))
