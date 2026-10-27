"""Esempio di generatore parametrico: cassa hard-surface per Unity.

    blender -b --factory-startup --python gen_crate.py

Produce in tools/blender/_out/: prop_crate_a.blend, .fbx, .png (preview).
Lo script e' il sorgente dell'asset: cambi un parametro, rilanci, l'asset e' rigenerato.
"""

import os
import sys

import bmesh
import bpy

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from asset_lib import (apply_modifiers, assign_materials, bevel, export_unity, material,
                       render_preview, report, reset_scene, save_blend, weighted_normals)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "_out")

W, D, H = 1.0, 1.25, 0.75  # metri
PANEL_THICKNESS = 0.05
PANEL_DEPTH = -0.012

reset_scene()
hull = material("hull", (0.055, 0.062, 0.075), 0.55, 0.20)
plate = material("plate", (0.130, 0.140, 0.160), 0.45, 0.40)
accent = material("accent", (0.950, 0.420, 0.090), 0.35, 0.0, (0.95, 0.35, 0.05))

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, H / 2))
crate = bpy.context.active_object
crate.name = "prop_crate_a"
crate.scale = (W, D, H)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# pannellature: inset per faccia, le facce interne prendono il materiale "plate"
me = crate.data
bm = bmesh.new()
bm.from_mesh(me)
inset = bmesh.ops.inset_individual(bm, faces=list(bm.faces), thickness=PANEL_THICKNESS, depth=PANEL_DEPTH)
for face in inset.get("faces", []):
    face.material_index = 1
for face in bm.faces:
    face.smooth = False
bm.to_mesh(me)
bm.free()

straps = []
for index, z in enumerate((0.15, 0.60)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, z))
    strap = bpy.context.active_object
    strap.name = "strap_%d" % index
    strap.scale = (W * 1.02, D * 1.02, 0.045)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_materials(strap, [plate])
    straps.append(strap)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, -(D / 2), 0.55))
status = bpy.context.active_object
status.name = "status_light"
status.scale = (0.5, 0.02, 0.03)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
assign_materials(status, [accent])

# un solo oggetto in export (un prop = un oggetto, i materiali sono slot)
bpy.ops.object.select_all(action='DESELECT')
for obj in [crate] + straps + [status]:
    obj.select_set(True)
bpy.context.view_layer.objects.active = crate
bpy.ops.object.join()
crate = bpy.context.active_object
crate.name = "prop_crate_a"

assign_materials(crate, [hull, plate, accent])
bevel(crate, 0.006, 2)
weighted_normals(crate)
apply_modifiers(crate)

report([crate], "prop_crate_a")
render_preview(os.path.join(OUT, "prop_crate_a.png"), target=(0, 0, H / 2), distance=3.3, elevation=24, azimuth=36)
save_blend(os.path.join(OUT, "prop_crate_a.blend"))
export_unity(os.path.join(OUT, "prop_crate_a.fbx"), [crate])
print("GEN_DONE prop_crate_a")
