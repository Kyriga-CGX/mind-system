"""Da GLB generato a FBX da gioco: import, pulizia, decimazione al budget, pivot, export.

    blender -b --factory-startup -P from_generated.py -- --glb out/prop.glb --out out/prop.fbx --faces 3000 --name prop_crate_gen_a

Perche' serve: trellis.cpp decima a 150-300K facce e non espone un target (verificato il
2026-10-27). Il budget di un asset di gioco si raggiunge qui, non nel generatore.
"""

import os
import sys

import bmesh
import bpy
import math
from mathutils import Vector

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from asset_lib import (apply_modifiers, export_unity, render_preview, report, reset_scene,
                       weighted_normals)

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(name, default=None):
    if name in argv:
        i = argv.index(name)
        return argv[i + 1] if i + 1 < len(argv) else True
    return default


GLB = arg("--glb")
OUT = arg("--out")
TARGET = int(arg("--faces", 3000))
NAME = arg("--name", "prop_gen_a")
PREVIEW = arg("--preview", None)
SIZE = arg("--size", None)      # dimensione massima in metri (l'immagine non porta scala)
BLEND = arg("--blend", None)    # salva il .blend per farci girare qa_check sopra
MODE = arg("--mode", "planar")  # planar = hard-surface (preserva spigoli) | collapse = organico
ANGLE = float(arg("--angle", 5.0))

if not GLB or not OUT:
    print("USO: --glb in.glb --out out.fbx --faces 3000 --name prop_x_gen_a [--preview out.png]")
    sys.exit(2)

reset_scene()
bpy.ops.import_scene.gltf(filepath=GLB)

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if not meshes:
    print("ERRORE: nessun mesh dentro " + GLB)
    sys.exit(1)

bpy.ops.object.select_all(action='DESELECT')
for obj in meshes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.join()
obj = bpy.context.active_object
obj.name = NAME

# pulizia: vertici duplicati, geometria degenere, vertici isolati
me = obj.data
bm = bmesh.new()
bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.dissolve_degenerate(bm, dist=1e-5, edges=bm.edges)
bm.to_mesh(me)
bm.free()
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.delete_loose()
bpy.ops.object.mode_set(mode='OBJECT')

me.calc_loop_triangles()
before = len(me.loop_triangles)

# decimazione al budget: planar per l'hard-surface (dissolve dei coplanari, spigoli intatti),
# collapse per le forme organiche. Il collapse puro scioglie le cinghie di una cassa.
if MODE == "planar":
    mod = obj.modifiers.new("dissolve", "DECIMATE")
    mod.decimate_type = 'DISSOLVE'
    mod.angle_limit = math.radians(ANGLE)
    mod.delimit = {'NORMAL', 'UV', 'MATERIAL'}
    apply_modifiers(obj)
    me.calc_loop_triangles()
    if len(me.loop_triangles) > TARGET:
        mod = obj.modifiers.new("decimate", "DECIMATE")
        mod.decimate_type = 'COLLAPSE'
        mod.ratio = max(0.001, TARGET / float(len(me.loop_triangles)))
        apply_modifiers(obj)
        me.calc_loop_triangles()
elif before > TARGET:
    mod = obj.modifiers.new("decimate", "DECIMATE")
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = max(0.001, TARGET / float(before))
    apply_modifiers(obj)
    me.calc_loop_triangles()

after = len(me.loop_triangles)

# la decimazione aggressiva crea gusci interni, normali invertite e vertici doppi:
# senza questa pulizia qa_check boccia l'asset (verificato il 2026-10-27)
bm = bmesh.new()
bm.from_mesh(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me)
bm.free()
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.delete_loose()
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
me.calc_loop_triangles()
after = len(me.loop_triangles)

# scala metrica: image->3D non ha scala, l'oggetto esce normalizzato (qui 1.0 x 0.8)
if SIZE:
    bpy.context.view_layer.update()
    dims = obj.dimensions
    maxd = max(dims)
    if maxd > 0:
        factor = float(SIZE) / maxd
        obj.scale = (obj.scale[0] * factor, obj.scale[1] * factor, obj.scale[2] * factor)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        print("SCALED factor=%.4f -> max %.3f m" % (factor, float(SIZE)))

# UV: il GLB generato le ha; se mancano si unwrapa, altrimenti il bake e' rotto
if not me.uv_layers:
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15192, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    print("UV_GENERATE smart_project")

# appoggio a terra: il GLB esce centrato sull'origine, quindi mezzo sotto z=0
bpy.context.view_layer.update()
bb = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
min_z = min(v.z for v in bb)
obj.location.z -= min_z
bpy.context.view_layer.update()

# pivot in basso al centro
bpy.context.view_layer.update()
bb = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
bb = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2.0
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2.0
bpy.context.scene.cursor.location = (cx, cy, min(v.z for v in bb))
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

weighted_normals(obj)
apply_modifiers(obj)

print("GENERATED_FACES before=%d after=%d target=%d" % (before, after, TARGET))
report([obj], NAME)
if PREVIEW:
    render_preview(PREVIEW, target=(0, 0, 0.5), distance=3.2, elevation=24, azimuth=36)
if BLEND:
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
export_unity(OUT, [obj])
print("FROM_GENERATED_DONE " + OUT)