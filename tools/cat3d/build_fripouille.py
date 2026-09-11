"""Adapt the attributed Fripouille asset; never replace its anatomy with primitives.

Run with Blender --background --python tools/cat3d/build_fripouille.py.
The unchanged downloaded source and attribution live alongside the .blend.
"""
from pathlib import Path
import bpy
from mathutils import Vector, Matrix
import math
import bmesh
import random

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'art/cat3d/fripouille-v2'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.import_scene.gltf(filepath=str(OUT / 'source/fripouille-unposed.glb'))
scene = bpy.context.scene
meshes = [o for o in scene.objects if o.type == 'MESH']
bpy.context.view_layer.update()

# This archived FBX conversion contains a second armature transform on each
# skinned mesh. Bake the evaluated skin in armature-parent coordinates once.
# Keep the untouched original as provenance; this sample gets a small new rig.
deps = bpy.context.evaluated_depsgraph_get()
for o in meshes:
    evaluated = bpy.data.meshes.new_from_object(o.evaluated_get(deps), depsgraph=deps)
    o.modifiers.clear()
    o.data = evaluated
    o.parent = None
    o.matrix_world = Matrix.Identity(4)
    # Evaluated coordinates are glTF Y-up; Blender review uses Z-up.
    o.data.transform(Matrix.Rotation(math.pi, 4, 'X'))
    if 'custom_normal' in o.data.attributes:
        o.data.attributes.remove(o.data.attributes['custom_normal'])
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.001)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(o.data); bm.free()
    for p in o.data.polygons: p.use_smooth = True
for o in list(scene.objects):
    if o.type != 'MESH':
        bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.update()
deps = bpy.context.evaluated_depsgraph_get()
points = [o.matrix_world @ v.co for o in meshes for v in o.evaluated_get(deps).data.vertices]
low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
print('SOURCE_BOUNDS', list(low), list(high))
for o in scene.objects:
    if o.type == 'ARMATURE':
        for b in o.pose.bones:
            print('BONE', b.name, list(o.matrix_world @ b.head))
for image in bpy.data.images:
    print('IMAGE', image.name, list(image.size))

for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    for key in ['Normal', 'Metallic', 'Roughness']:
        for link in list(bsdf.inputs[key].links): mat.node_tree.links.remove(link)
    bsdf.inputs['Metallic'].default_value = 0
    for socket in bsdf.inputs:
        if socket.name == 'Weight': socket.default_value = 1
    bsdf.inputs['Roughness'].default_value = .8 if mat.name == 'SHD_frip' else .28
    if mat.name == 'SHD_frip':
        normal = mat.node_tree.nodes.get('Normal Map')
        normal.inputs['Strength'].default_value = .55
        mat.node_tree.links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])

# Parent all imported roots, preserving all bind/rest transforms.
root = bpy.data.objects.new('Fripouille', None)
root['author']='guillaume bolis'
root['license']='CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/'
root['source']='https://sketchfab.com/3d-models/3d-modelling-my-cat-fripouille-0ab14bf98e754f8d90fe1bf1c84ca66c'
root['modifications']='Meowndel: recovered rest mesh, aligned eyes, smoothed silhouette, new short fur/whiskers/study rig. Web applies coat variations.'
scene.collection.objects.link(root)
for o in list(scene.objects):
    if o != root and o.parent is None:
        o.parent = root
scale = 3.6 / (high.z-low.z)
root.scale = (scale,)*3
root.location = (-((low.x+high.x)/2)*scale, -((low.y+high.y)/2)*scale, -low.z*scale)
bpy.context.view_layer.update()

# Normalize the recovered rest mesh; restore the separate original eye mesh
# to the two sockets (the archived skin lost its separate object transform).
body = next(o for o in meshes if 'high_poly' in o.name)
eyes = next(o for o in meshes if 'SHD_eye' in o.name)
for o in meshes:
    if o == eyes: continue
    o.data.transform(o.matrix_world)
    o.parent = None; o.matrix_world = Matrix.Identity(4)
eye_center = sum((v.co for v in eyes.data.vertices), Vector()) / len(eyes.data.vertices)
for v in eyes.data.vertices:
    v.co = (v.co-eye_center)*-.64 + Vector((-2.84,-1.275,2.95))
eyes.parent = None; eyes.matrix_world = Matrix.Identity(4)
for o in list(meshes):
    if o not in [body, eyes]: bpy.data.objects.remove(o, do_unlink=True)
meshes = [body, eyes]
body.name='CoatMesh'; eyes.name='Eyes'
align = Matrix.Rotation(math.radians(65), 4, 'Z')
for o in meshes:
    o.data.transform(align)
    if 'custom_normal' in o.data.attributes: o.data.attributes.remove(o.data.attributes['custom_normal'])
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free()
    for p in o.data.polygons: p.use_smooth=True
sub=body.modifiers.new('Gentle silhouette refinement','SUBSURF');sub.levels=1
bpy.context.view_layer.objects.active=body
bpy.ops.object.modifier_apply(modifier=sub.name)
root.location=(0,0,0);root.scale=(1,1,1)
for o in meshes: o.parent=root
for v in eyes.data.vertices: v.co.y += .025

# Very short, tapered surface wisps add a soft silhouette, not a fur simulation.
body.data.calc_loop_triangles()
tris=list(body.data.loop_triangles)
weights=[t.area for t in tris]
rng=random.Random(20260908); verts=[]; faces=[]; uvs=[]; fur_normals=[]
for tri in rng.choices(tris, weights=weights, k=6500):
    a,b=rng.random(),rng.random()
    if a+b>1:a,b=1-a,1-b
    bary=(1-a-b,a,b)
    point=sum((body.data.vertices[i].co*w for i,w in zip(tri.vertices,bary)),Vector())
    if point.z<.09:continue
    normal=sum((body.data.vertices[i].normal*w for i,w in zip(tri.vertices,bary)),Vector()).normalized()
    tangent=normal.cross(Vector((0,0,1)))
    if tangent.length<.01:tangent=normal.cross(Vector((1,0,0)))
    tangent.normalize()
    uv=sum((body.data.uv_layers.active.data[i].uv*w for i,w in zip(tri.loops,bary)),Vector((0,0)))
    length=rng.uniform(.012,.03) * (.4 if point.y<-2.5 and point.z>2.5 else 1)
    groom=(Vector((0,.15,-1))-normal*normal.dot(Vector((0,.15,-1)))).normalized()
    i=len(verts);base=point+normal*.001
    verts.extend([base+tangent*.002,base-tangent*.002,base+normal*length*.65+groom*length*.7])
    faces.append((i,i+1,i+2));uvs.extend([uv,uv,uv])
    fur_normals.extend([normal]*3)
data=bpy.data.meshes.new('Short fur wisps');data.from_pydata(verts,[],faces);data.update()
data.normals_split_custom_set_from_vertices(fur_normals)
uvlayer=data.uv_layers.new(name='UVMap')
for loop in data.loops:uvlayer.data[loop.index].uv=uvs[loop.vertex_index]
fuzz=bpy.data.objects.new('CoatFuzz',data);scene.collection.objects.link(fuzz);fuzz.parent=root
furmat=bpy.data.materials['SHD_frip'].copy();furmat.name='CoatFuzz'
bs=furmat.node_tree.nodes.get('Principled BSDF')
for link in list(bs.inputs['Normal'].links):furmat.node_tree.links.remove(link)
fuzz.data.materials.append(furmat)
# Tested at face-close scale: sparse wisps read as stubble, not short fur.
# Retain the experiment in the editable studio only, excluded from delivery.
fuzz.hide_render=True;fuzz.hide_viewport=True

whisker_mat=bpy.data.materials.new('Whiskers');whisker_mat.diffuse_color=(.72,.68,.58,1)
curve=bpy.data.curves.new('Whisker curves','CURVE');curve.dimensions='3D';curve.bevel_depth=.0022;curve.bevel_resolution=2
for side in [-1,1]:
    for i in range(5):
        spline=curve.splines.new('BEZIER');spline.bezier_points.add(2)
        points=[(side*.14,-3.25,2.68+i*.02),(side*.43,-3.27,2.66+i*.034),(side*(.72-i*.028),-3.16,2.62+i*.055)]
        for j,(p,co) in enumerate(zip(spline.bezier_points,points)):
            p.co=co;p.handle_left_type=p.handle_right_type='AUTO';p.radius=[1,.7,.04][j]
whiskers=bpy.data.objects.new('Whiskers',curve);scene.collection.objects.link(whiskers);whiskers.data.materials.append(whisker_mat)
bpy.context.view_layer.objects.active=whiskers;whiskers.select_set(True)
bpy.ops.object.convert(target='MESH');whiskers=bpy.context.object;whiskers.parent=root;meshes.append(whiskers)

# Minimal study rig: smooth neck weights keep the original continuous mesh.
arm=bpy.data.armatures.new('StudyRig');rig=bpy.data.objects.new('StudyRig',arm);scene.collection.objects.link(rig);rig.parent=root
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
base=arm.edit_bones.new('BodyRoot');base.head=(0,0,1);base.tail=(0,0,2)
head=arm.edit_bones.new('HeadPivot');head.head=(0,-2.5,2.45);head.tail=(0,-3.15,2.95);head.parent=base
tail=arm.edit_bones.new('TailPivot');tail.head=(0,1.85,2.65);tail.tail=(0,2.6,2.3);tail.parent=base
bpy.ops.object.mode_set(mode='OBJECT')
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
for o in meshes:
    groups={n:o.vertex_groups.new(name=n) for n in ['BodyRoot','HeadPivot','TailPivot']}
    for v in o.data.vertices:
        h=smooth(2.05,2.65,v.co.z)*smooth(1.9,2.65,-v.co.y)
        t=smooth(1.95,2.65,v.co.y)*smooth(1.0,1.8,v.co.z)
        for n,w in [('HeadPivot',h),('TailPivot',t),('BodyRoot',max(0,1-h-t))]:
            if w>0:groups[n].add([v.index],w,'REPLACE')
    mod=o.modifiers.new('Study deformation','ARMATURE');mod.object=rig
    o.parent=rig

# Export original painted colour; the web shader applies coat variants while
# preserving these UVs, normal detail, pink nose, iris and authored white edges.
bpy.ops.object.select_all(action='DESELECT')
for o in [root,rig,*meshes]:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'src/preview3d/assets/cat-fripouille-v2.glb'),export_format='GLB',use_selection=True,export_animations=False,export_skins=True,export_extras=True)

def aim(o, p):
    o.rotation_euler = (Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name, pos, power, size, color):
    data = bpy.data.lights.new(name, 'AREA'); data.energy = power; data.shape = 'DISK'; data.size = size; data.color = color
    o = bpy.data.objects.new(name, data); scene.collection.objects.link(o); o.location = pos; aim(o, (0,0,1.6))
area('Key', (1,-5,7), 650, 5, (1,.91,.8))
area('Fill', (-5,-2,4), 400, 5, (.83,.9,1))
area('Rim', (3,4,6), 750, 4, (1,.94,.83))
bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object; floor.name = 'Studio floor'
mat = bpy.data.materials.new('Warm ivory'); mat.diffuse_color = (.72,.67,.57,1); floor.data.materials.append(mat)
mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.72,.67,.57,1)
scene.world = bpy.data.worlds.new('Studio world'); scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.72,.77,.8,1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
data = bpy.data.cameras.new('Review'); camera = bpy.data.objects.new('Review', data); scene.collection.objects.link(camera)
camera.location = (7,-8,4.1); aim(camera, (0,0,1.8)); data.type = 'ORTHO'; data.ortho_scale = 7.2; scene.camera = camera
scene.render.engine = 'CYCLES'; scene.cycles.samples = 24; scene.cycles.use_denoising = True
scene.render.resolution_x = 1100; scene.render.resolution_y = 900; scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.render.filepath = str(OUT / 'source-review.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'fripouille-studio.blend'))
bpy.ops.render.render(write_still=True)

# Native Blender counterpart of the web coat shader, kept editable in .blend.
def coat_nodes(material):
    tree=material.node_tree;nodes=tree.nodes;links=tree.links
    def input_value(socket,value):
        if isinstance(value,(int,float,tuple)):socket.default_value=value
        else:links.new(value,socket)
    def math_node(op,a,b=0):
        n=nodes.new('ShaderNodeMath');n.operation=op;input_value(n.inputs[0],a);input_value(n.inputs[1],b);return n.outputs[0]
    def smooth_node(a,b,x):
        n=nodes.new('ShaderNodeMapRange');n.interpolation_type='SMOOTHSTEP';n.clamp=True
        input_value(n.inputs['Value'],x);n.inputs['From Min'].default_value=a;n.inputs['From Max'].default_value=b;return n.outputs[0]
    def mix(a,b,t):
        n=nodes.new('ShaderNodeMixRGB');input_value(n.inputs[0],t);input_value(n.inputs[1],a);input_value(n.inputs[2],b);return n.outputs[0]
    tex=nodes.get('Image Texture').outputs['Color']
    rgb=nodes.new('ShaderNodeSeparateColor');links.new(tex,rgb.inputs[0]);r,g,b=[rgb.outputs[n]for n in ['Red','Green','Blue']]
    warm=smooth_node(.08,.18,math_node('DIVIDE',math_node('SUBTRACT',r,b),math_node('MAXIMUM',r,.001)))
    skin=math_node('MULTIPLY',smooth_node(.006,.035,math_node('SUBTRACT',b,g)),smooth_node(.025,.1,math_node('SUBTRACT',r,g)))
    gray=nodes.new('ShaderNodeRGBToBW');links.new(tex,gray.inputs[0]);value=gray.outputs[0]
    mul=nodes.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[1].default_value=(.82,.88,.92,1)
    input_value(mul.inputs[2],math_node('ADD',.010,math_node('MULTIPLY',value,.095)))
    geom=nodes.new('ShaderNodeNewGeometry');xyz=nodes.new('ShaderNodeSeparateXYZ');links.new(geom.outputs['Position'],xyz.inputs[0]);x,y,z=xyz.outputs
    front=smooth_node(3.03,3.20,math_node('MULTIPLY',y,-1))
    mx=math_node('DIVIDE',math_node('ADD',x,.04),.28);mz=math_node('DIVIDE',math_node('SUBTRACT',z,2.72),.22)
    muzzle=math_node('SUBTRACT',1,smooth_node(.65,1,math_node('ADD',math_node('MULTIPLY',mx,mx),math_node('MULTIPLY',mz,mz))))
    blaze=math_node('MULTIPLY',math_node('SUBTRACT',1,smooth_node(.035,.12,math_node('ABSOLUTE',math_node('ADD',x,.04)))),math_node('MULTIPLY',smooth_node(2.90,3.00,z),math_node('SUBTRACT',1,smooth_node(3.19,3.32,z))))
    face=math_node('MULTIPLY',front,math_node('MAXIMUM',muzzle,blaze))
    white=math_node('SUBTRACT',1,warm)
    tint=nodes.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;tint.inputs[1].default_value=(.72,.70,.65,1)
    input_value(tint.inputs[2],math_node('ADD',.65,math_node('MULTIPLY',value,.7)))
    nx=math_node('DIVIDE',math_node('ADD',x,.048),.085);nz=math_node('DIVIDE',math_node('SUBTRACT',z,2.75),.09)
    nose=math_node('MULTIPLY',math_node('SUBTRACT',1,smooth_node(.6,1,math_node('ADD',math_node('MULTIPLY',nx,nx),math_node('MULTIPLY',nz,nz)))),smooth_node(3.34,3.365,math_node('MULTIPLY',y,-1)))
    links.new(mix(mix(mix(mul.outputs[0],tex,white),tint.outputs[0],face),tex,math_node('MAXIMUM',skin,nose)),nodes.get('Principled BSDF').inputs['Base Color'])
for material in [bpy.data.materials['SHD_frip'],furmat]:coat_nodes(material)
for name,pos,target,size in [
    ('blender-three-quarter',(7,-8,4.1),(0,0,1.8),7.2),
    ('blender-front',(0,-10,3.5),(0,-.3,1.8),6.2),
    ('blender-side',(10,0,3.5),(0,0,1.8),7.2),
    ('blender-face',(2.7,-7,3.35),(0,-2.98,2.9),2.25),
]:
    camera.location=pos;aim(camera,target);camera.data.ortho_scale=size
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
camera.location=(7,-8,4.1);aim(camera,(0,0,1.8));camera.data.ortho_scale=7.2
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'fripouille-studio.blend'))
