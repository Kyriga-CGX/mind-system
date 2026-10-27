"""Da GLB generato a FBX da gioco: import, pulizia, decimazione al budget, pivot, export.

    blender -b --factory-startup -P from_generated.py -- --glb out/prop.glb --out out/prop.fbx --faces 3000 --name prop_crate_gen_a

Perche' serve: trellis.cpp decima a 150-300K facce e non espone un target (verificato il
2026-10-27). Il budget di un asset di gioco si raggiunge qui, non nel generatore.
"""

import os
import sys

import bmesh
import bpy
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

# decimazione al budget
if before > TARGET:
    mod = obj.modifiers.new("decimate", "DECIMATE")
    mod.decimate_type = 'COLLAPSE'
    mod.ratio = max(0.001, TARGET / float(before))
    apply_modifiers(obj)
    me.calc_loop_triangles()

after = len(me.loop_triangles)

# UV: il GLB generato le ha; se mancano si unwrapa, altrimenti il bake e' rotto
if not me.uv_layers:
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=1.15192, island_margin=0.02)
    bpy.ops.object.mode_set(mode='OBJECT')
    print("UV_GENERATE smart_project")

# pivot in basso al centro
bpy.context.view_layer.update()
bb = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
min_z = min(v.z for v in bb)
cx = (min(v.x for v in bb) + max(v.x for v in bb)) / 2.0
cy = (min(v.y for v in bb) + max(v.y for v in bb)) / 2.0
bpy.context.scene.cursor.location = (cx, cy, min_z)
bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

weighted_normals(obj)
apply_modifiers(obj)

print("GENERATED_FACES before=%d after=%d target=%d" % (before, after, TARGET))
report([obj], NAME)
if PREVIEW:
    render_preview(PREVIEW, target=(0, 0, 0.5), distance=3.2, elevation=24, azimuth=36)
export_unity(OUT, [obj])
print("FROM_GENERATED_DONE " + OUT)