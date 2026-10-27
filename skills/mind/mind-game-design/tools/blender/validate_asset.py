"""Gate di validazione di un asset prima dell'import in Unity.

    blender -b asset.blend -P validate_asset.py -- --max-tris 4000 --expect-pivot feet

Exit code 1 se un check fallisce: un asset che non passa non entra nel gioco.
"""

import os
import re
import sys

import bpy
import bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def arg(name, default=None):
    if name in argv:
        i = argv.index(name)
        return argv[i + 1] if i + 1 < len(argv) else True
    return default


MAX_TRIS = int(arg("--max-tris", 5000))
EXPECT_PIVOT = arg("--expect-pivot", "center")  # center | feet | origin
NEED_UV = "--no-uv" not in argv
NAME_RE = re.compile(r"^[a-z][a-z0-9_]*$")

checks = []


def check(name, ok, detail=""):
    checks.append((name, bool(ok), detail))


meshes = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith("PREVIEW_")]
check("almeno un mesh", len(meshes) > 0, "%d mesh" % len(meshes))

scene = bpy.context.scene
check("unita' metriche 1:1",
      scene.unit_settings.system == 'METRIC' and abs(scene.unit_settings.scale_length - 1.0) < 1e-6,
      "%s scale_length=%s" % (scene.unit_settings.system, scene.unit_settings.scale_length))

tris = 0
non_manifold = 0
uv_missing = []
bad_names = []
bad_scale = []
for obj in meshes:
    me = obj.data
    me.calc_loop_triangles()
    tris += len(me.loop_triangles)
    bm = bmesh.new()
    bm.from_mesh(me)
    non_manifold += sum(1 for e in bm.edges if len(e.link_faces) != 2)
    bm.free()
    if not me.uv_layers:
        uv_missing.append(obj.name)
    if "[" in obj.name or "." in obj.name or not NAME_RE.match(obj.name):
        bad_names.append(obj.name)
    if any(abs(v - 1.0) > 1e-5 for v in obj.scale):
        bad_scale.append(obj.name)

check("tris <= %d" % MAX_TRIS, tris <= MAX_TRIS, "%d tris" % tris)
check("mesh manifold (bordi aperti = 0)", non_manifold == 0, "%d bordi non manifold" % non_manifold)
if NEED_UV:
    check("UV presenti", not uv_missing, ", ".join(uv_missing) or "ok")
check("nomi tecnici (snake_case, senza .001)", not bad_names, ", ".join(bad_names) or "ok")
check("scale applicata (1,1,1)", not bad_scale, ", ".join(bad_scale) or "ok")

empty_slots = []
for obj in meshes:
    for slot in obj.material_slots:
        if slot.material is None:
            empty_slots.append(obj.name)
check("nessuno slot materiale vuoto", not empty_slots, ", ".join(sorted(set(empty_slots))) or "ok")

if meshes:
    lo = Vector((1e9, 1e9, 1e9))
    hi = Vector((-1e9, -1e9, -1e9))
    for obj in meshes:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            for i in range(3):
                lo[i] = min(lo[i], world[i])
                hi[i] = max(hi[i], world[i])
    size = hi - lo
    check("dimensioni plausibili in metri", all(0.02 <= s <= 30.0 for s in size),
          "%.2f x %.2f x %.2f m" % (size.x, size.y, size.z))

    origin = meshes[0].matrix_world.translation
    if EXPECT_PIVOT == "feet":
        check("pivot ai piedi (origine su z min, 1 cm)",
              abs(origin.z - lo.z) <= 0.01, "origin z=%.3f min z=%.3f" % (origin.z, lo.z))
    elif EXPECT_PIVOT == "origin":
        check("pivot sull'origine del mondo (1 cm)",
              origin.length <= 0.01, "origin=%s" % (tuple(round(v, 3) for v in origin),))
    else:
        cx, cy = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
        check("pivot al centro xy (5 mm)",
              abs(origin.x - cx) <= 0.005 and abs(origin.y - cy) <= 0.005,
              "origin=%s centro=%s" % (tuple(round(v, 3) for v in origin[:2]), (round(cx, 3), round(cy, 3))))

width = max(len(c[0]) for c in checks)
for name, ok, detail in checks:
    print("  %s  %-*s  %s" % ("PASS" if ok else "FAIL", width, name, detail))
failed = [c for c in checks if not c[1]]
print("VALIDATION %s (%d check, %d FAIL)" % ("OK" if not failed else "FAIL", len(checks), len(failed)))
sys.stdout.flush()
if failed:
    os._exit(1)
