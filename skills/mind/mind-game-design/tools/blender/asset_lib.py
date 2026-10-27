"""Helper per generatori di asset Blender -> Unity.

Verificato su Blender 5.2.3 LTS il 2026-10-27:
- l'engine EEVEE in 5.x si chiama BLENDER_EEVEE (BLENDER_EEVEE_NEXT e' 4.2-4.5: li' va usato quello);
- i parametri di export_scene.fbx usati qui esistono e hanno questi identificatori;
- un cubo da 1 m esportato con questi parametri torna indietro con dimensioni 1.0.

Uso: `blender -b --factory-startup --python gen_<asset>.py`
Un asset e' un file .py versionato: lo script e' il sorgente, il .fbx e' un artefatto.
"""

import bpy
import math
import os

from mathutils import Vector

# --- costanti di convenzione (Unity) -----------------------------------------
UNIT = 1.0  # 1 unita' Blender = 1 metro


def reset_scene():
    """Scena vuota, unita' metriche, scala 1:1."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 1.0
    return sc


def material(name, color, roughness=0.45, metallic=0.0, emission=None, strength=6.0):
    """Materiale Principled. `color` in lineare 0..1 (non sRGB)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    if principled is None:
        raise RuntimeError("Principled BSDF non trovato: il nodo di default e' cambiato")
    principled.inputs["Base Color"].default_value = (*color, 1.0)
    principled.inputs["Roughness"].default_value = roughness
    principled.inputs["Metallic"].default_value = metallic
    if emission is not None and "Emission Color" in principled.inputs:
        principled.inputs["Emission Color"].default_value = (*emission, 1.0)
        principled.inputs["Emission Strength"].default_value = strength
    return mat


def bevel(obj, width=0.01, segments=3):
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = 'ANGLE'
    mod.harden_normals = True
    return mod


def weighted_normals(obj):
    mod = obj.modifiers.new("wn", "WEIGHTED_NORMAL")
    mod.keep_sharp = True
    return mod


def apply_modifiers(obj):
    bpy.context.view_layer.objects.active = obj
    for mod in list(obj.modifiers):
        try:
            bpy.ops.object.modifier_apply(modifier=mod.name)
        except RuntimeError:
            pass  # preserva il modificatore se non applicabile (es. subsurf su facce degeneri)
    return obj


def assign_materials(obj, materials, per_face=None):
    """per_face: lista di indici lunga quanto le facce. None = tutto il primo materiale."""
    obj.data.materials.clear()
    for mat in materials:
        obj.data.materials.append(mat)
    if per_face:
        for poly, idx in zip(obj.data.polygons, per_face):
            poly.material_index = min(idx, len(materials) - 1)


def export_unity(filepath, objects=None, armature=False, triangulate=True):
    """FBX per Unity: -Z forward, Y up, trasformazione cotta, scala 1:1.

    `objects` None = selezione corrente. La sonda assi (vedi blender.md) va fatta
    UNA volta per progetto in Unity: rotazione 0, scala 1,1,1, marcatore su -Z.
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    if objects is not None:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
    extra = {"use_triangles": True} if triangulate else {}
    bpy.ops.export_scene.fbx(
        filepath=filepath,
        use_selection=True,
        object_types={'MESH', 'ARMATURE'},
        axis_forward='-Z',
        axis_up='Y',
        apply_scale_options='FBX_SCALE_ALL',
        bake_space_transform=not armature,
        mesh_smooth_type='FACE',
        add_leaf_bones=False,
        path_mode='COPY',
        **extra,
    )
    return filepath


def _aim(obj, target):
    """Orienta l'oggetto verso target: -Z guarda il bersaglio (convenzione camera/luci)."""
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return obj


def _look_at(target, distance, elevation_deg, azimuth_deg):
    """Posizione camera su sfera attorno a target (gradi)."""
    el = math.radians(elevation_deg)
    az = math.radians(azimuth_deg)
    x = math.sin(az) * math.cos(el) * distance
    y = -math.cos(az) * math.cos(el) * distance
    z = math.sin(el) * distance
    return (target[0] + x, target[1] + y, target[2] + z)


def render_preview(filepath, target=(0, 0, 0.5), distance=3.4, elevation=26, azimuth=38,
                   resolution=(560, 420), samples=24, ground=True, keep_lights=False):
    """Render di verifica e lo restituisce come path. Va GUARDATO, non solo prodotto."""
    sc = bpy.context.scene
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    created = []

    if ground and not any(o.name == "PREVIEW_ground" for o in bpy.data.objects):
        bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
        plane = bpy.context.active_object
        plane.name = "PREVIEW_ground"
        plane.data.materials.append(material("PREVIEW_ground_mat", (0.02, 0.02, 0.025), 0.9))
        created.append(plane)

    cam_data = bpy.data.cameras.new("PREVIEW_cam")
    cam_data.lens = 62
    cam = bpy.data.objects.new("PREVIEW_cam", cam_data)
    sc.collection.objects.link(cam)
    cam.location = _look_at(target, distance, elevation, azimuth)
    _aim(cam, target)
    sc.camera = cam
    created.append(cam)

    key = bpy.data.lights.new("PREVIEW_key", "AREA")
    key.energy = 420
    key.size = 3.2
    key_obj = bpy.data.objects.new("PREVIEW_key", key)
    sc.collection.objects.link(key_obj)
    key_obj.location = _look_at(target, distance * 0.9, 55, 30)
    _aim(key_obj, target)
    created.append(key_obj)

    rim = bpy.data.lights.new("PREVIEW_rim", "AREA")
    rim.energy = 280
    rim.size = 2.2
    rim.color = (0.55, 0.75, 1.0)
    rim_obj = bpy.data.objects.new("PREVIEW_rim", rim)
    sc.collection.objects.link(rim_obj)
    rim_obj.location = _look_at(target, distance * 0.9, 30, 210)
    _aim(rim_obj, target)
    created.append(rim_obj)

    sc.render.resolution_x, sc.render.resolution_y = resolution
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = filepath
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT", "BLENDER_WORKBENCH"):
        try:
            sc.render.engine = engine
            break
        except TypeError:
            continue
    try:
        sc.eevee.taa_render_samples = samples
    except AttributeError:
        pass
    bpy.ops.render.render(write_still=True)

    if not keep_lights:
        for obj in created:
            data = obj.data
            bpy.data.objects.remove(obj, do_unlink=True)
            if isinstance(data, bpy.types.Mesh):
                bpy.data.meshes.remove(data)
    return filepath


def save_blend(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=filepath)
    return filepath


def report(objects, label="asset"):
    """Riga di riepilogo per la console: la usi per l'evidenza, non per l'occhio."""
    total_v = total_t = 0
    for obj in objects:
        if obj.type != 'MESH':
            continue
        me = obj.data
        me.calc_loop_triangles()
        total_v += len(me.vertices)
        total_t += len(me.loop_triangles)
    dims = [round(v, 3) for v in objects[0].dimensions] if objects else []
    print("ASSET_REPORT %s | verts=%d | tris=%d | dims=%s | objects=%d"
          % (label, total_v, total_t, tuple(dims), len(objects)))
    return total_v, total_t
