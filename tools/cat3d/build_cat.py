"""Build the isolated cat study. Blender 5.2 LTS, no external assets/add-ons.

blender --background --factory-startup --python tools/cat3d/build_cat.py
Outputs are confined to src/preview3d/assets and art/cat3d.
The reference is an art target, not a claim of reconstruction fidelity.
"""
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "src/preview3d/assets"
ART = ROOT / "art/cat3d"
ASSETS.mkdir(parents=True, exist_ok=True)
ART.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, rough=.8):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    return m


fur = material("Coat", (.72, .34, .095))
muzzle = material("Muzzle", (.88, .57, .26))
earpink = material("InnerEar", (.58, .27, .22))
nosemat = material("Nose", (.58, .22, .18), .55)
dark = material("EyeRim", (.065, .035, .022), .65)
eyelid = material("Eyelid", (.72, .34, .095), .85)
ivory = material("EyeWhite", (.73, .64, .44), .45)
iris = material("Iris", (.22, .26, .085), .32)
pupil = material("Pupil", (.008, .012, .01), .28)
glint = material("Catchlight", (.96, .97, .88), .2)
whisker = material("Whisker", (.42, .31, .20), .7)


def smooth(o):
    for p in o.data.polygons:
        p.use_smooth = True


def ellipsoid(name, loc, scale, mat=fur, seg=40, rings=28):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    smooth(o)
    return o


def fuse(name, pieces, voxel):
    bpy.ops.object.select_all(action="DESELECT")
    for o in pieces:
        o.select_set(True)
    bpy.context.view_layer.objects.active = pieces[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.remesh_voxel_size = voxel
    bpy.ops.object.voxel_remesh()
    mod = o.modifiers.new("Sculpt smoothing", "SMOOTH")
    mod.factor = 1.4
    mod.iterations = 7
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = o.modifiers.new("Web mesh", "DECIMATE")
    mod.ratio = .62
    bpy.ops.object.modifier_apply(modifier=mod.name)
    smooth(o)
    return o


def curve(name, points, radius, mat, resolution=10):
    d = bpy.data.curves.new(name, "CURVE")
    d.dimensions = "3D"
    d.resolution_u = resolution
    d.bevel_depth = radius
    d.bevel_resolution = 3
    s = d.splines.new("BEZIER")
    s.bezier_points.add(len(points) - 1)
    for bp, xyz in zip(s.bezier_points, points):
        bp.co = xyz[:3]
        bp.handle_left_type = bp.handle_right_type = "AUTO"
        bp.radius = xyz[3] if len(xyz) == 4 else 1
    o = bpy.data.objects.new(name, d)
    bpy.context.collection.objects.link(o)
    d.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target="MESH")
    smooth(o)
    return o


def ear(name, side, mat, inset=False):
    # A rounded triangular solid, not a cone attached to the head.
    x = side
    if inset:
        verts = [(x*.49, -.217, 3.28), (x*.82, -.105, 3.27), (x*.78, -.04, 3.66)]
        thickness = .025
    else:
        verts = [(x*.30, -.26, 3.05), (x*.97, -.05, 3.09), (x*.80, .025, 3.82)]
        thickness = .29
    verts += [(a, b+thickness, c-.025) for a, b, c in verts]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], [(0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)])
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(o)
    mesh.materials.append(mat)
    bpy.context.view_layer.objects.active = o
    bevel = o.modifiers.new("Soft ear edges", "BEVEL")
    bevel.width = .055 if inset else .105
    bevel.segments = 4
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    smooth(o)
    return o


# Broad anatomical masses are fused so the body is a continuous surface.
body = fuse("Body", [
    ellipsoid("torso", (0, .18, 1.20), (.61, .56, .94)),
    ellipsoid("chest", (0, -.10, 1.64), (.48, .45, .57)),
    ellipsoid("haunch.L", (-.45, .26, .57), (.40, .48, .53)),
    ellipsoid("haunch.R", (.45, .26, .57), (.40, .48, .53)),
    ellipsoid("shoulder.L", (-.31, -.25, 1.26), (.26, .32, .66)),
    ellipsoid("shoulder.R", (.31, -.25, 1.26), (.26, .32, .66)),
    ellipsoid("foreleg.L", (-.30, -.40, .65), (.205, .225, .58)),
    ellipsoid("foreleg.R", (.30, -.40, .65), (.205, .225, .58)),
    ellipsoid("paw.L", (-.30, -.52, .18), (.25, .32, .18)),
    ellipsoid("paw.R", (.30, -.52, .18), (.25, .32, .18)),
    ellipsoid("backpaw.L", (-.63, .04, .17), (.25, .34, .18)),
    ellipsoid("backpaw.R", (.63, .04, .17), (.25, .34, .18)),
], .034)

tail = curve("Tail", [(0, .60, .42), (.58, .84, .28), (1.13, .57, .20),
                      (1.33, -.03, .18), (1.10, -.47, .19), (.85, -.49, .24, .45)], .155, fur, 16)

head = fuse("Head", [
    ellipsoid("cranium", (0, -.06, 2.64), (.82, .60, .70)),
    ellipsoid("cheek.L", (-.43, -.23, 2.43), (.43, .43, .38)),
    ellipsoid("cheek.R", (.43, -.23, 2.43), (.43, .43, .38)),
    ellipsoid("chin", (0, -.37, 2.24), (.42, .32, .20)),
    ear("outerEar.L", -1, fur), ear("outerEar.R", 1, fur),
], .023)

head_parts = [head, ear("InnerEar.L", -1, earpink, True), ear("InnerEar.R", 1, earpink, True)]
# Recessed sockets keep the eyes in the face, rather than stuck on it.
for side in [-1, 1]:
    cut = ellipsoid("socket", (side*.36, -.54, 2.69), (.282, .22, .310), dark)
    bpy.context.view_layer.objects.active = head
    mod = head.modifiers.new("Eye socket", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cut
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cut, do_unlink=True)
    for poly in head.data.polygons:
        poly.material_index = 0
    for name, y, size, mat in [
        ("EyeRim", -.50, (.283, .135, .313), eyelid),
        ("EyeWhite", -.51, (.263, .15, .296), ivory),
        ("Iris", -.625, (.211, .048, .251), iris),
        ("Pupil", -.661, (.154, .025, .198), pupil),
    ]:
        head_parts.append(ellipsoid(f"{name}.{side}", (side*.36, y, 2.69), size, mat))
    head_parts.append(ellipsoid(f"Glint.{side}", (side*.36-.066, -.684, 2.79), (.035, .010, .039), glint, 20, 12))
    head_parts.append(ellipsoid(f"GlintSmall.{side}", (side*.36+.058, -.684, 2.625), (.014, .006, .015), glint, 16, 10))

head_parts += [
    ellipsoid("Muzzle.L", (-.148, -.620, 2.32), (.22, .16, .155), muzzle),
    ellipsoid("Muzzle.R", (.148, -.620, 2.32), (.22, .16, .155), muzzle),
]
nose = ellipsoid("Nose", (0, -.778, 2.43), (.105, .06, .066), nosemat, 32, 20)
for v in nose.data.vertices:
    v.co.x *= .62 + .38 * ((v.co.z/.066+1)/2)
head_parts.append(nose)
head_parts.append(curve("Mouth", [(-.16, -.76, 2.275), (-.085, -.784, 2.255), (0, -.787, 2.30),
                                 (.085, -.784, 2.255), (.16, -.76, 2.275)], .009, dark))
head_parts.append(curve("Philtrum", [(0, -.785, 2.39), (0, -.79, 2.30)], .009, dark))
for side in [-1, 1]:
    for i in range(3):
        head_parts.append(curve(f"Whisker.{side}.{i}", [
            (side*.26, -.755, 2.32-i*.032, .8),
            (side*.55, -.73, 2.33-i*.073, .6),
            (side*.91, -.63, 2.39-i*.13, .12),
        ], .0055, whisker))

# COLOR_0 stores a deterministic grayscale coat pattern, not orange pixels.
# The web shader interprets it as a mask, allowing a truly solid black coat.
def mark(o, kind):
    layer = o.data.color_attributes.new(name="CoatMask", type="BYTE_COLOR", domain="CORNER")
    for loop in o.data.loops:
        p = o.matrix_world @ o.data.vertices[loop.vertex_index].co
        x, y, z = p
        ax = abs(x)
        stripe = 0.0
        if kind == "head":
            # Forehead stripes taper before the eyes; cheek stripes stay outside them.
            if z > 2.96:
                phase = x*19 + math.sin(z*7)*.9
                stripe = max(0, math.cos(phase))**5 * min(1, (z-2.96)*8)
            if ax > .60 and z < 2.78:
                stripe = max(stripe, max(0, math.cos(z*30 + y*4))**5 * min(1, (ax-.60)*10))
        elif kind == "body":
            stripe = max(0, math.cos(z*18 + math.sin(x*5+y*3)*1.3))**7
            stripe *= .68 + .32*min(1, abs(x)*2)
        else:
            stripe = max(0, math.cos((x-y)*18))**6
        value = 1 - .55*stripe
        layer.data[loop.index].color = (value, value, value, 1)


mark(head, "head")
mark(body, "body")
mark(tail, "tail")
root = bpy.data.objects.new("Cat", None)
bpy.context.collection.objects.link(root)
head_pivot = bpy.data.objects.new("HeadPivot", None)
bpy.context.collection.objects.link(head_pivot)
head_pivot.location = (0, 0, 2.20)
head_pivot.parent = root
bpy.context.view_layer.update()
for o in head_parts:
    world = o.matrix_world.copy()
    o.parent = head_pivot
    o.matrix_world = world
body.parent = tail.parent = root

# Bind a vertex-color node so native Blender stills also show the mask.
nodes = fur.node_tree.nodes
vc = nodes.new("ShaderNodeVertexColor")
vc.layer_name = "CoatMask"
mix = nodes.new("ShaderNodeMixRGB")
mix.blend_type = "MULTIPLY"
mix.inputs[0].default_value = 1
mix.inputs[1].default_value = (*(.72, .34, .095), 1)
fur.node_tree.links.new(vc.outputs["Color"], mix.inputs[2])
fur.node_tree.links.new(mix.outputs[0], nodes.get("Principled BSDF").inputs["Base Color"])

# Export model only. Runtime lighting belongs to the web scene.
bpy.ops.object.select_all(action="DESELECT")
for o in [root, head_pivot, body, tail, *head_parts]:
    o.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(filepath=str(ASSETS / "cat.glb"), export_format="GLB", use_selection=True,
                          export_yup=True, export_animations=False, export_texcoords=False,
                          export_vertex_color="ACTIVE",
                          export_attributes=False, export_materials="EXPORT", export_extras=True)

# Native reference camera and lighting (not part of the exported asset).
bpy.ops.object.camera_add(location=(4, -8, 3.65))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 1.85))-camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = 4.9
bpy.context.scene.camera = camera
for name, loc, power, size in [("Key", (-3, -4, 7), 500, 5), ("Fill", (4, -2, 4), 240, 4), ("Rim", (0, 3, 5), 350, 3)]:
    bpy.ops.object.light_add(type="AREA", location=loc)
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.shape = "DISK"
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 1.7))-light.location).to_track_quat("-Z", "Y").to_euler()
scene = bpy.context.scene
scene.world.color = (.28, .28, .28)
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.render.resolution_x = scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(ART / "blender-study.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ART / "cat-study.blend"))
print("CAT_STUDY_EXPORTED", ASSETS / "cat.glb")
if "--render-study" in __import__("sys").argv:
    bpy.ops.render.render(write_still=True)
