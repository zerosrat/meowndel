"""Build a local comparison asset without modifying the source GLB."""
from pathlib import Path
import bpy
import json
import time
import sys
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--input', default='cat-original-4k.glb')
parser.add_argument('--output', default='cat-80k-2k.glb')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])

root = Path.home() / '.local/share/meowndel/soft-low-poly-cat-2026-09-16'
started = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(root / args.input))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
before = sum(len(o.data.polygons) for o in meshes)
for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    modifier = obj.modifiers.new('Preview 80k triangles', 'DECIMATE')
    modifier.ratio = min(1.0, 80000 / before)
    modifier.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=modifier.name)
for image in bpy.data.images:
    if image.size[0] > 2048:
        image.scale(2048, round(image.size[1] * 2048 / image.size[0]))
out = root / args.output
bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB', export_image_format='JPEG', export_jpeg_quality=90)
report = {'original_triangles': before, 'optimized_triangles': sum(len(o.data.polygons) for o in meshes), 'bytes': out.stat().st_size, 'seconds': round(time.time()-started, 2)}
(out.with_suffix('.json')).write_text(json.dumps(report, indent=2))
print(json.dumps(report))
