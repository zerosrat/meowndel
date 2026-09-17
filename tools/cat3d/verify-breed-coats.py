"""Verify retextured cats retain oriented triangles and UV mapping despite vertex reordering."""
import collections
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = Path.home()/'.local/share/meowndel/soft-low-poly-cat-2026-09-16'


def signature(file):
    data = (ARCHIVE/file).read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20+length])
    raw = data[28+length:]

    def accessor(index):
        item = doc['accessors'][index]
        assert 'sparse' not in item
        view = doc['bufferViews'][item['bufferView']]
        width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[item['type']]
        fmt = '<' + {5126: 'f', 5123: 'H', 5125: 'I'}[item['componentType']]*width
        offset = view.get('byteOffset', 0)+item.get('byteOffset', 0)
        stride = view.get('byteStride', struct.calcsize(fmt))
        return [struct.unpack_from(fmt, raw, offset+i*stride) for i in range(item['count'])]

    assert len(doc['meshes']) == 1
    assert len(doc['meshes'][0]['primitives']) == 1
    primitive = doc['meshes'][0]['primitives'][0]
    assert primitive.get('mode', 4) == 4
    position = accessor(primitive['attributes']['POSITION'])
    uv = accessor(primitive['attributes']['TEXCOORD_0'])
    indices = [i[0] for i in accessor(primitive['indices'])]
    triangles = []
    for start in range(0, len(indices), 3):
        # 1e-5 accommodates float export noise, well below a displayed pixel.
        corners = tuple(tuple(round(v, 5) for v in position[i]+uv[i]) for i in indices[start:start+3])
        triangles.append(min(corners, corners[1:]+corners[:1], corners[2:]+corners[:2]))
    nodes = [{k:v for k,v in node.items() if k != 'name'} for node in doc['nodes']]
    return collections.Counter(triangles), nodes, doc['scenes']


if __name__ == '__main__':
    manifest = json.loads((ROOT/'demos/tripo-cat/breed-manifest.json').read_text())
    for cat in manifest['cats']:
        base = signature(cat['file'])
        for coat in manifest['coats']:
            if coat['breed'] != cat['key']:
                continue
            assert signature(coat['file']) == base, f"Geometry/UV/transform mismatch: {coat['file']}"
            print(f"Verified {coat['file']}")
