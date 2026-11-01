import bpy, math, random, json
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent
OUT=ROOT.parents[1]/'dist/models/eurus-candle.glb'
random.seed(23)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
asset=[]
def rgb(h):
    h=h.lstrip('#');v=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(c/12.92 if c<.04045 else ((c+.055)/1.055)**2.4 for c in v)
def mat(name,color,rough=.42,metal=0,trans=0,alpha=1):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb(color),alpha);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;p.inputs['IOR'].default_value=1.46;p.inputs['Transmission Weight'].default_value=trans
    if 'Alpha' in p.inputs:p.inputs['Alpha'].default_value=alpha
    m.diffuse_color=(*rgb(color),alpha)
    if alpha<1:m.surface_render_method='DITHERED'
    return m
wax=[mat('Wax — deep sage','#42604c',.46),mat('Wax — pine green','#587961',.44),mat('Wax — soft sage','#75917a',.43),mat('Wax — pale sage','#b4c2a5',.43),mat('Wax — warm ivory','#eee9cc',.42)]
for m in wax:
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Subsurface Weight'].default_value=.055;p.inputs['Coat Weight'].default_value=.08
clear=mat('Glass — clear vessel','#f6fcfa',.025,0,1.0,1)
edge=mat('Glass — polished rim','#d5e2d9',.12,.14,.25,1)
frost=mat('Frost — sugar snow','#f0f2e9',.64,0,0,1)
leafmat=mat('Botanical — preserved leaf','#245b36',.7)
veinmat=mat('Botanical — leaf veins','#588253',.7)
cardmat=mat('Tag — ivory card','#faf7e9',.65)
ink=mat('Tag — forest ink','#2a653d',.66)
cordmat=mat('Tag — cotton cord','#ebe8d6',.75)
base=mat('Display — warm stone','#e4d7be',.58)
gold=mat('Display — brushed brass','#b7a373',.33,.48)
charcoal=mat('Wick — cotton tip','#685c49',.8)
def register(o,m=None):
    if m:o.data.materials.append(m)
    asset.append(o);return o
def smooth(o):
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    return o
def mesh(name,verts,faces,m):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update();o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);register(o,m);return o
def cyl(name,r,depth,z,m,verts=96,x=0,y=0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=(x,y,z));o=bpy.context.object;o.name=name;register(o,m);smooth(o);bevel=o.modifiers.new('Soft manufactured edges','BEVEL');bevel.width=.025;bevel.segments=3;return o
def uvball(name,loc,scale,m,segments=16,rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;register(o,m);smooth(o);return o
def tube(name,pts,r,m):
    d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=8;d.bevel_depth=r;d.bevel_resolution=2;s=d.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
    for b,p in zip(s.bezier_points,pts):b.co=p;b.handle_left_type='AUTO';b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);register(o,m);return o

def lathe(name,profile,m,n=128):
    vs=[];fs=[]
    for r,z in profile:
        for i in range(n):a=i*2*math.pi/n;vs.append((r*math.cos(a),r*math.sin(a),z))
    for j in range(len(profile)-1):
        for i in range(n):a=j*n+i;b=j*n+(i+1)%n;fs.append((a,b,b+n,a+n))
    return smooth(mesh(name,vs,fs,m))
# A quiet gallery plinth keeps the model's actual product silhouette clear.
cyl('Circular stone display',2.10,.16,.08,base)
lathe('Brass perimeter trim',[(2.02,.15),(2.03,.17),(2.02,.19),(2.0,.19),(2.0,.15),(2.02,.15)],gold)
# Closed hollow vessel: outer wall, rounded lip, inner wall and a thick bottom.
profile=[(0,.20),(1.59,.20),(1.66,.22),(1.70,.28),(1.71,.36),(1.71,3.62),(1.70,3.68),(1.66,3.71),(1.62,3.68),(1.61,3.62),(1.61,.38),(1.57,.32),(0,.32)]
lathe('Hollow glass vessel',profile,clear)
lathe('Visible rolled glass rim',[(1.66+.045*math.cos(a*math.pi/12),3.67+.045*math.sin(a*math.pi/12)) for a in range(25)],edge)
lathe('Heavy glass heel',[(1.64+.04*math.cos(a*math.pi/12),.29+.055*math.sin(a*math.pi/12)) for a in range(25)],edge)
# Pine wax sculpture with scalloped, rolled branch tips rather than stacked cones.
cyl('Wax trunk',.27,.6,.76,wax[0],48)
tiers=[(.75,1.40,1.30,0),(1.48,1.30,1.18,0),(2.16,1.17,1.12,1),(2.91,1.01,1.08,2),(3.66,.80,1.05,3),(4.38,.57,1.18,4)]
for tier,(z0,R,H,mi) in enumerate(tiers):
    vs=[];fs=[];seg=80;rings=21;lobes=12
    for j in range(rings):
        t=j/(rings-1)
        # Broad drooping scallops roll into a smooth neck near each tier's tip.
        envelope=.12+.88*(1-t)**1.78
        edge_round=.90+.10*math.sin(min(t/.15,1)*math.pi/2)
        for i in range(seg):
            a=i*2*math.pi/seg;wave=math.cos(lobes*a+t*.34)
            flute=(.12+.07*(1-t))*wave
            r=R*envelope*edge_round*(1+flute)
            z=z0+H*t-.13*(1-t)**6*(.5+.5*wave)
            vs.append((r*math.cos(a),r*math.sin(a),z))
    for j in range(rings-1):
        for i in range(seg):a=j*seg+i;b=j*seg+(i+1)%seg;fs.append((a,b,b+seg,a+seg))
    vs.append((0,0,z0+.11));bottom=len(vs)-1
    for i in range(seg):fs.append((bottom,(i+1)%seg,i))
    vs.append((0,0,z0+H));top=len(vs)-1
    for i in range(seg):fs.append((top,(rings-1)*seg+i,(rings-1)*seg+(i+1)%seg))
    smooth(mesh('Fluted wax pine — tier %02d'%tier,vs,fs,wax[mi]))
# Slightly bent unlit wick and cotton fibers.
tube('Unlit cotton wick',[(0,0,5.52),(.03,-.02,5.70),(.15,-.05,5.78)],.035,cordmat)
tube('Dark wick end',[(.12,-.05,5.77),(.16,-.05,5.79)],.025,charcoal)
# Preserve botanical leaves against the lower glass, with serrated edges and veins.
def leaf(cx,cy,cz,length,width,angle):
    vs=[];faces=[];rows=19
    def point(t,side):
        yy=t*length;ww=math.sin(math.pi*t)**.8*width*(1+.08*math.cos(t*math.pi*18))*side
        x=cx+ww*math.cos(angle)+yy*math.sin(angle);z=cz-ww*math.sin(angle)+yy*math.cos(angle)
        x=max(-1.54,min(1.54,x)); y=-math.sqrt(max(.1,1.585**2-x*x))+.025*abs(side)
        return (x,y,z)
    for i in range(rows):
        t=i/(rows-1)
        for side in [-1,0,1]:vs.append(point(t,side))
    for j in range(rows-1):
        for k in range(2):a=j*3+k;faces.append((a,a+1,a+4,a+3))
    mesh('Preserved serrated leaf',vs,faces,leafmat)
    tube('Leaf midrib',[point(t,0) for t in [0,.25,.5,.75,1]],.012,veinmat)
    for t in [.2,.35,.5,.65,.8]:
        for side in [-1,1]:tube('Leaf vein',[point(t,0),point(min(t+.13,.96),side*.88)],.006,veinmat)
leaf(-.35,-1.50,.47,1.55,.45,-.65)
leaf(.35,-1.49,.50,1.72,.40,.4)
leaf(.85,-1.21,.48,1.45,.34,.45)
leaf(-1.1,-1.13,.53,1.29,.32,-.4)
# Snow crystals on the lower glass. One merged mesh keeps rendering inexpensive.
verts=[];faces=[]
for n in range(560):
    a=random.uniform(0,2*math.pi);z=random.uniform(.30,2.35)
    snowline=1.75+.3*math.sin(3*a)+.25*math.sin(7*a)
    if z>snowline and random.random()<.85:continue
    radius=1.718+random.uniform(.004,.027);size=random.uniform(.012,.038)
    center=Vector((radius*math.cos(a),radius*math.sin(a),z))
    # Irregular octahedral crystalline bead, with softened glints at map scale.
    basei=len(verts)
    verts.extend([tuple(center+Vector(p)*size) for p in [(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1.35),(0,0,-1.1)]])
    faces.extend([tuple(basei+i for i in f) for f in [(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)]])
mesh('Individual snow crystals',verts,faces,frost)
# The ribbon-like product tag sits fully inside the glass inner radius, clear of the vessel wall.
bpy.ops.mesh.primitive_cube_add(size=1,location=(.80,-1.08,4.15));tag=bpy.context.object;tag.name='Hanging ivory product tag';tag.scale=(.49,.045,2.95);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);register(tag,cardmat);bev=tag.modifiers.new('Card edge rounding','BEVEL');bev.width=.045;bev.segments=3
# English lettering is in geometry, so it stays crisp without a remote font.
def text(name,body,location,size,m,rotation=(math.pi/2,0,0),align='CENTER'):
    d=bpy.data.curves.new(name,'FONT');d.body=body;d.align_x=align;d.align_y='CENTER';d.size=size;d.extrude=.001;d.bevel_depth=.0005;d.resolution_u=5;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=location;o.rotation_euler=rotation;register(o,m);return o
for i,ch in enumerate('MERRYXMAS'):text('Tag letter '+ch,ch,(.885,-1.108,5.22-i*.275),.16,ink)
for z in [5.35,4.55,3.75,2.95]:
    v=[(.585,-1.111,z-.18),(.67,-1.111,z+.12),(.755,-1.111,z-.18)]
    mesh('Tag pine motif',v,[(0,1,2)],ink)
tube('Cotton hanging loop',[(0,0,5.58),(.33,-.31,5.87),(.63,-.86,5.78),(.81,-1.11,5.55)],.025,cordmat)
text('EUROS display plaque','EUROS  /  WINTER BOTANICAL', (0,-1.83,.22),.145,ink,rotation=(0,0,0))
# Apply geometry modifiers and convert curves, then join by material for a compact web asset.
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.context.view_layer.objects.active=asset[0]
bpy.ops.object.convert(target='MESH')
asset=[o for o in bpy.context.selected_objects if o.type=='MESH']
for o in asset:
    bpy.context.view_layer.objects.active=o
    for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
by_material={}
for o in asset:
    key=o.data.materials[0].name if o.data.materials else 'None';by_material.setdefault(key,[]).append(o)
merged=[]
for name,objects in by_material.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();o=bpy.context.object;o.name=name;merged.append(o)
asset=merged
# Set the exported model's bottom at zero and retain a clean origin.
for o in asset:
    bpy.context.view_layer.objects.active=o;o.select_set(True)
bpy.ops.object.select_all(action='DESELECT')
for o in asset:o.select_set(True)
bpy.context.view_layer.objects.active=asset[0]
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'eurus-winter-candle.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in asset)
(ROOT/'model-info.json').write_text(json.dumps({'reference':'resource/niki23号分享的资料/candle1.jpg','model':'EURUS winter botanical pine candle','dimensions':{'width':4.2,'height':5.9,'depth':4.2},'meshes':len(asset),'triangles':triangles,'materials':[m.name for m in bpy.data.materials],'notes':'Blender hand-built geometric reconstruction from a single product photograph; no flame. GLB uses closed glass with physical transmission, fluted wax, botanical inclusions, frost, label and cord.'},indent=2))
# Studio preview: not included in the web GLB.
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));floor=bpy.context.object;floor.name='Studio floor';floor.data.materials.append(mat('Studio backdrop','#e8e7de',.85))
def aim(o,p):o.rotation_euler=(Vector(p)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(8,-12,8));cam=bpy.context.object;aim(cam,(0,0,2.8));cam.data.type='ORTHO';cam.data.ortho_scale=8.1;bpy.context.scene.camera=cam
for name,loc,energy,size in [('Key',(-5,-6,10),1200,7),('Rim',(4,3,8),1600,5),('Fill',(3,-5,5),500,5)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;aim(o,(0,0,2.5))
scene=bpy.context.scene;scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.7,.7,.7,1);scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.7;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'candle-studio-preview.png');scene.view_settings.view_transform='AgX';scene.render.film_transparent=False
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'eurus-winter-candle-studio.blend'))
bpy.ops.render.render(write_still=True)
print('CANDLE_MODEL_COMPLETE',len(asset),triangles,OUT)
