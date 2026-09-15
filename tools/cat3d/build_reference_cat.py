"""One bounded reference-cat candidate; run in a NEW Blender process.

Blender --background --factory-startup --python tools/cat3d/build_reference_cat.py
Creates versioned source/reviews and a separate GLB, preserving the old spike.
The generated mesh is an editable starting sculpt, not an anatomy reconstruction.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "art/cat3d/reference-v1"
ASSET = ROOT / "src/preview3d/assets/cat-reference-v1.glb"
ART.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def mat(name, color, rough=.72):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    return m


coat = mat("Coat", (.025, .029, .027))
pink = mat("Skin", (.43, .21, .19), .7)
nosemat = mat("Nose", (.58, .30, .27), .48)
dark = mat("Details", (.026, .023, .024), .6)
eye_mat = mat("Eyes", (1, 1, 1), .22)
whiskermat = mat("Whiskers", (.59, .57, .50), .7)
clay = mat("ReviewClay", (.38, .40, .38), .83)


def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj


def mesh(name, vertices, faces, material):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return smooth(obj)


def ball(name, loc, scale, material=coat, seg=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    return smooth(o)


def fuse(name, parts, voxel, ratio=.40):
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.data.remesh_voxel_size = voxel
    bpy.ops.object.voxel_remesh()
    mod = o.modifiers.new("Soften mass transitions", "SMOOTH")
    mod.factor, mod.iterations = 1.0, 28 if name == "Body" else 8
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod = o.modifiers.new("Candidate surface density", "DECIMATE")
    mod.ratio = ratio
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:
        p.material_index = 0
    return smooth(o)


def tube(name, points, radius, material=coat, resolution=8):
    d = bpy.data.curves.new(name, "CURVE")
    d.dimensions, d.resolution_u = "3D", resolution
    d.bevel_depth, d.bevel_resolution = radius, 2
    s = d.splines.new("BEZIER")
    s.bezier_points.add(len(points)-1)
    for p, co in zip(s.bezier_points, points):
        p.co = co[:3]
        p.radius = co[3] if len(co) == 4 else 1
        p.handle_left_type = p.handle_right_type = "AUTO"
    o = bpy.data.objects.new(name, d)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(material)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    return smooth(o)


def segment(name, a, b, radius, depth):
    mid = (Vector(a)+Vector(b))/2
    o = ball(name, mid, (radius, depth, (Vector(a)-Vector(b)).length/2 + radius*.5))
    o.rotation_euler = (Vector(b)-Vector(a)).to_track_quat("Z", "Y").to_euler()
    return o


# Adult standing silhouette: chest, shoulder blades, belly, pelvis, hocks, paws.
parts = [ball("Torso", (0, 1.02, 1.84), (.47, 1.28, .59)),
         ball("Pelvis", (0, 1.88, 1.79), (.445, .48, .54)),
         ball("Neck", (0, -.16, 2.40), (.36, .40, .70)),
         ball("Brisket", (0, -.10, 1.97), (.32, .30, .43))]
for side in [-1, 1]:
    x = side*.32
    parts += [ball("Shoulder", (x, .05, 1.92), (.23, .38, .58)),
              segment("Upper foreleg", (x, .01, 1.8), (x, .12, 1.07), .155, .17),
              segment("Forearm", (x, .12, 1.12), (x, -.06, .31), .105, .12),
              ball("Front paw", (x, -.17, .17), (.165, .26, .15)),
              ball("Thigh", (side*.36, 1.92, 1.48), (.28, .42, .52)),
              segment("Shin", (side*.37, 1.70, 1.19), (side*.38, 2.16, .63), .13, .145),
              segment("Hock", (side*.38, 2.16, .65), (side*.38, 2.01, .22), .095, .11),
              ball("Back paw", (side*.38, 1.90, .15), (.15, .25, .135))]
body = fuse("Body", parts, .028, .37)
tail = tube("Tail", [(0, 2.22, 1.92), (.08, 2.49, 1.60), (.13, 2.64, 1.03),
                      (.19, 2.85, .54), (.40, 3.00, .48, .70), (.57, 2.97, .54, .05)], .125, resolution=12)

# Continuous facial masses. The muzzle and nasal bridge belong to the head.
head = fuse("Head", [
    ball("Skull", (0, -.29, 3.00), (.53, .43, .52)),
    ball("Jaw", (0, -.37, 2.76), (.40, .36, .29)),
    ball("Cheek.L", (-.32, -.41, 2.87), (.255, .27, .275)),
    ball("Cheek.R", (.32, -.41, 2.87), (.255, .27, .275)),
    ball("Nasal bridge", (0, -.61, 2.95), (.15, .22, .26)),
    ball("Muzzle.L", (-.125, -.67, 2.76), (.185, .215, .14)),
    ball("Muzzle.R", (.125, -.67, 2.76), (.185, .215, .14)),
    ball("Chin", (0, -.64, 2.62), (.23, .17, .10)),
], .013, .40)


def ear(side):
    # Concentric curved rings make a genuine concave ear shell with a thick rim.
    boundary = [(.20, 3.28), (.49, 3.24), (.61, 3.43), (.62, 3.73),
                (.56, 3.81), (.44, 3.72), (.29, 3.52)]
    # Smooth closed boundary by repeated corner cutting.
    for _ in range(3):
        boundary = [p for i, a in enumerate(boundary) for p in
                    [(a[0]*.75+boundary[(i+1)%len(boundary)][0]*.25,
                      a[1]*.75+boundary[(i+1)%len(boundary)][1]*.25),
                     (a[0]*.25+boundary[(i+1)%len(boundary)][0]*.75,
                      a[1]*.25+boundary[(i+1)%len(boundary)][1]*.75)]]
    n = len(boundary)
    verts, faces = [], []
    center = (.425, 3.47)
    for scale, depth in [(1, -.26), (.85, -.335), (.67, -.24), (.35, -.08), (.015, -.035)]:
        for x, z in boundary:
            verts.append((side*(center[0]+(x-center[0])*scale), depth+(z-3.5)*.20,
                          center[1]+(z-center[1])*scale))
    for ring in range(4):
        for i in range(n):
            faces.append((ring*n+i, ring*n+(i+1)%n, (ring+1)*n+(i+1)%n, (ring+1)*n+i))
    o = mesh(f"Ear.{side}", verts, faces, coat)
    o.data.materials.append(pink)
    for p in o.data.polygons:
        if n*2 <= p.index < n*4:
            p.material_index = 1
    solid = o.modifiers.new("Ear shell", "SOLIDIFY")
    solid.thickness = .045
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=solid.name)
    return o


head_parts = [head, ear(-1), ear(1)]
eye_parts = []
lid_parts = []
for side in [-1, 1]:
    cx, cy, cz = side*.267, -.641, 3.058
    cut = ball("Socket cutter", (cx, -.556, cz), (.18, .18, .14), dark)
    bpy.context.view_layer.objects.active = head
    boolean = head.modifiers.new("Recessed eye socket", "BOOLEAN")
    boolean.operation, boolean.object = "DIFFERENCE", cut
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cut, do_unlink=True)
    # Almond-shaped spherical patch; corner tilt follows the feline eye line.
    def eye_co(r, angle, extra=0):
        u = math.cos(angle)
        v = math.sin(angle)
        dx = .18*r*u
        dz = .129*r*v*(.78+.22*abs(v)) + side*dx*.17
        return (cx+dx, cy+.070*r*r+extra, cz+dz)
    verts, faces, colors = [], [], []
    n, rings = 64, 12
    for j in range(rings+1):
        r = max(.0001, j/rings)
        for i in range(n):
            a = i/n*math.tau
            verts.append(eye_co(r, a))
            # Narrow vertical pupil, radial iris fibers, dark limbal ring.
            x, _, z = verts[-1]
            pupil = ((x-cx)/.044)**2 + ((z-cz)/.106)**2 < 1
            fiber = .90+.10*math.sin(a*57+math.sin(r*30))
            if pupil:
                c = (.004, .007, .006)
            elif r > .88:
                c = (.07, .09, .045)
            else:
                c = (.32*fiber, .34*fiber, .105*fiber)
            colors.append((*c, 1))
    for j in range(rings):
        for i in range(n):
            faces.append((j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i))
    eye = mesh(f"Eye.{side}", verts, faces, eye_mat)
    layer = eye.data.color_attributes.new(name="IrisColor", type="BYTE_COLOR", domain="POINT")
    for i, c in enumerate(colors):
        layer.data[i].color = c
    eye.shape_key_add(name="Basis")
    closed = eye.shape_key_add(name="Blink")
    closed.value = 0
    for v in closed.data:
        v.co.z = cz+(v.co.x-cx)*side*.17+(v.co.z-cz-(v.co.x-cx)*side*.17)*.025
    eye_parts.append(eye)
    # Four rings bridge the eye edge to the facial surface. The inner edge
    # follows the eye when blinking; the outer edge remains fixed.
    verts, faces = [], []
    for r in [1, 1.07, 1.21, 1.40]:
        for i in range(n):
            co = eye_co(r, i/n*math.tau, -.006 if r < 1.1 else -.025)
            verts.append(co)
    for j in range(3):
        for i in range(n):
            faces.append((j*n+i, j*n+(i+1)%n, (j+1)*n+(i+1)%n, (j+1)*n+i))
    lid = mesh(f"Lid.{side}", verts, faces, coat)
    lid.shape_key_add(name="Basis")
    closed = lid.shape_key_add(name="Blink")
    closed.value = 0
    for i, v in enumerate(closed.data):
        amount = [1, .92, .48, 0][i//n]
        base = cz+(v.co.x-cx)*side*.17
        v.co.z = base+(v.co.z-base)*(1-.975*amount)
    lid_parts.append(lid)

# Colored eyes export as vertex colors, avoiding texture downloads.
vc = eye_mat.node_tree.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "IrisColor"
eye_mat.node_tree.links.new(vc.outputs["Color"], eye_mat.node_tree.nodes.get("Principled BSDF").inputs["Base Color"])

nose = ball("Nose", (0, -.846, 2.845), (.104, .057, .064), nosemat)
for v in nose.data.vertices:
    v.co.x *= .58+.42*((v.co.z/.064+1)/2)
head_parts.append(nose)
for s in [-1, 1]:
    head_parts.append(ball("Nostril", (s*.066, -.884, 2.847), (.020, .011, .009), dark, 16, 8))
head_parts.append(tube("Philtrum", [(0, -.88, 2.807), (0, -.873, 2.733)], .005, dark))
for s in [-1, 1]:
    head_parts.append(tube("Mouth", [(0, -.873, 2.733), (s*.07, -.863, 2.699),
                                     (s*.17, -.815, 2.70)], .0045, dark))
    for i in range(4):
        head_parts.append(tube("Whisker", [(s*.17, -.854, 2.767-i*.023, .65),
                                           (s*.43, -.865, 2.80-i*.052, .45),
                                           (s*.76, -.78, 2.88-i*.083, .015)], .0028, whiskermat))
    for xoff in [-.05, .045]:
        for y in [-.17, 1.90]:
            headless = tube("Toe crease", [(s*.32+xoff, y-.21, .17),
                                            (s*.32+xoff, y-.15, .25)], .003, dark)
            headless["body_detail"] = True


def step(a, b, x):
    t = max(0, min(1, (x-a)/(b-a)))
    return t*t*(3-2*t)


def mask(obj, kind):
    colors = obj.data.color_attributes.new(name="CoatMask", type="BYTE_COLOR", domain="POINT")
    for i, v in enumerate(obj.data.vertices):
        x, y, z = obj.matrix_world @ v.co
        if kind == "head":
            # Individual example mask, not a gene-to-position rule.
            blaze = (1-step(.045, .105, abs(x)))*(1-step(3.27, 3.50, z))*step(-.48, -.65, y)
            muzzle = (1-step(.23, .34, abs(x)))*(1-step(2.86, 2.96, z))*step(-.48, -.68, y)
            chin = (1-step(2.78, 2.86, z))*step(-.24, -.58, y)
            white = max(blaze, muzzle, chin)
        elif kind == "body":
            bib = step(-.10, -.40, y)*(1-step(2.63, 2.94, z))
            belly = 1-step(1.38, 1.60, z)
            # Socks end lower on forelegs and near hocks on back legs.
            socks = 1-step(.65 if y < .8 else .74, .78 if y < .8 else .86, z)
            white = max(bib, belly*.90 if .35 < y < 1.9 else 0, socks)
        else:
            white = 0
        colors.data[i].color = (1, white, 0, 1)


mask(head, "head")
mask(body, "body")
mask(tail, "tail")
for o in [*lid_parts, *[o for o in head_parts if o.name.startswith("Ear")]]:
    mask(o, "head")

# Blender material matches the runtime channel contract: green = white mask.
nodes, links = coat.node_tree.nodes, coat.node_tree.links
vc = nodes.new("ShaderNodeVertexColor")
vc.layer_name = "CoatMask"
separate = nodes.new("ShaderNodeSeparateColor")
links.new(vc.outputs["Color"], separate.inputs["Color"])
mix = nodes.new("ShaderNodeMixRGB")
mix.inputs[1].default_value = (.025, .029, .027, 1)
mix.inputs[2].default_value = (.80, .77, .69, 1)
links.new(separate.outputs["Green"], mix.inputs[0])
links.new(mix.outputs[0], nodes.get("Principled BSDF").inputs["Base Color"])

# Merge static detail meshes by parent/material at export while keeping eyes
# and lids separate for Blink shape keys. Each joined object stays editable.
def join(name, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    objects[0].name = name
    return objects[0]


head_details = join("HeadDetails", head_parts[1:])
body_details = join("PawDetails", [o for o in bpy.context.scene.objects if o.get("body_detail")])
root = bpy.data.objects.new("Cat", None)
bpy.context.collection.objects.link(root)
head_pivot = bpy.data.objects.new("HeadPivot", None)
bpy.context.collection.objects.link(head_pivot)
head_pivot.location = (0, -.16, 2.49)
head_pivot.parent = root
tail_pivot = bpy.data.objects.new("TailPivot", None)
bpy.context.collection.objects.link(tail_pivot)
tail_pivot.location = (0, 2.22, 1.92)
tail_pivot.parent = root
bpy.context.view_layer.update()
for o in [head, head_details, *eye_parts, *lid_parts]:
    world = o.matrix_world.copy()
    o.parent = head_pivot
    o.matrix_world = world
world = tail.matrix_world.copy()
tail.parent = tail_pivot
tail.matrix_world = world
body.parent = body_details.parent = root

# Source embeds the reference sheet, available when opening the .blend offline.
ref = bpy.data.images.load(str(ROOT / "references/cat-style-v1.png"))
ref.pack()
root["art_direction"] = "references/art-direction-v1.md"
root["status"] = "candidate; art approval pending"

bpy.ops.object.select_all(action="DESELECT")
for o in [root, head_pivot, tail_pivot, body, body_details, tail, head, head_details, *eye_parts, *lid_parts]:
    o.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(filepath=str(ASSET), export_format="GLB", use_selection=True,
    export_yup=True, export_animations=False, export_texcoords=False,
    export_vertex_color="ACTIVE", export_attributes=False, export_materials="EXPORT",
    export_extras=True, export_morph=True)

# The exporter can leave sampled morph values at 1; reset before saving/review.
for obj in [*eye_parts, *lid_parts]:
    obj.data.shape_keys.key_blocks["Blink"].value = 0

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.world.color = (.22, .22, .22)
scene.render.resolution_x = scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.render.image_settings.file_format = "PNG"
scene.view_settings.view_transform = "AgX"
for name, loc, power, size in [("Key", (-3, -4, 7), 500, 4), ("Fill", (4, -2, 4), 280, 4), ("Rim", (0, 4, 5), 500, 3)]:
    bpy.ops.object.light_add(type="AREA", location=loc)
    light = bpy.context.object
    light.name = name
    light.data.energy, light.data.size = power, size
    light.rotation_euler = (Vector((0, .5, 2))-light.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.camera_add()
camera = bpy.context.object
camera.name = "ReviewCamera"
camera.data.type = "ORTHO"
scene.camera = camera


def view(loc, target, scale, file):
    camera.location = loc
    camera.rotation_euler = (Vector(target)-camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = scale
    scene.render.filepath = str(ART / file)


view((5, -7, 3.7), (0, .85, 1.95), 4.8, "full-color.png")
bpy.ops.wm.save_as_mainfile(filepath=str(ART / "cat-master-v001.blend"))
if "--skip-render" not in sys.argv:
    bpy.ops.render.render(write_still=True)
    scene.view_layers[0].material_override = clay
    # Hide whiskers/details for uncluttered gray-volume inspection; all geometry
    # remains in the saved master. Eyes are gray too, not a fake desaturation.
    head_details.hide_render = True
    # Ear shell lives in HeadDetails, so keep it visible for the actual reviews.
    head_details.hide_render = False
    for loc, name in [((0, -8, 3.12), "head-front.png"), ((8, -.27, 3.12), "head-side.png"),
                      ((5, -8, 3.4), "head-three-quarter.png")]:
        view(loc, (0, -.32, 3.23), 1.90, name)
        bpy.ops.render.render(write_still=True)
    scene.render.resolution_x = scene.render.resolution_y = 320
    scene.render.filepath = str(ART / "head-ui-320.png")
    bpy.ops.render.render(write_still=True)
print("REFERENCE_CAT_READY", ASSET)
