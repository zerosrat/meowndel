"""Export the CURRENT edited master without regenerating geometry.

Blender art/cat3d/reference-v1/cat-master-v001.blend --background \
  --python tools/cat3d/export_reference_cat.py
"""
from pathlib import Path
import bpy

root = bpy.data.objects.get("Cat")
if root is None:
    raise RuntimeError("Open the reference cat master first; Cat root is missing")
path = Path(__file__).resolve().parents[2] / "src/preview3d/assets/cat-reference-v1.glb"
bpy.ops.object.select_all(action="DESELECT")
objects = [root, *root.children_recursive]
values = []
for obj in objects:
    obj.select_set(True)
    if obj.type == "MESH" and obj.data.shape_keys:
        for key in obj.data.shape_keys.key_blocks:
            if key.name != "Basis":
                values.append((key, key.value))
                key.value = 0
bpy.context.view_layer.objects.active = root
try:
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=True,
        export_yup=True, export_animations=False, export_texcoords=False,
        export_vertex_color="ACTIVE", export_attributes=False, export_materials="EXPORT",
        export_extras=True, export_morph=True)
finally:
    for key, value in values:
        key.value = value
print("EXPORTED_EDITED_MASTER", path)
