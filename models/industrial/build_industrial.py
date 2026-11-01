"""Original detailed miniatures: accessible eyewear, Daqing pumpjack, 101 research gateway.
Run Blender --background --python models/industrial/build_industrial.py.
"""
import bpy, math, os, json, random
from mathutils import Vector
from collections import defaultdict
ROOT=os.path.dirname(os.path.abspath(__file__));OUT=os.path.abspath(os.path.join(ROOT,'../../dist/models'))
random.seed(51)
def rgb(h):
 h=h.lstrip('#');v=[int(h[i:i+2],16)/255 for i in (0,2,4)];return tuple(c/12.92 if c<.04045 else ((c+.055)/1.055)**2.4 for c in v)
class B:
 def __init__(self):self.data=defaultdict(lambda:[[],[],[]]);self.mats={};self.rigs={};self.rig='';self.origins={}
 def mat(self,name,color,rough=.6,metal=0):
  m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes['Principled BSDF'];p.inputs['Base Color'].default_value=(*rgb(color),1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;m.diffuse_color=(*rgb(color),1);self.mats[name]=m
 def addrig(self,name,origin):self.origins[name]=Vector(origin);self.rigs[name]=None
 def geom(self,mat,vs,fs,smooth=False):
  d=self.data[(self.rig,mat)];n=len(d[0]);origin=self.origins.get(self.rig,Vector((0,0,0)));d[0].extend([tuple(Vector(v)-origin)for v in vs]);d[1].extend([[n+i for i in f]for f in fs]);d[2].extend([smooth]*len(fs))
 def box(self,mat,p,dim,angle=0):
  x,y,z=p;w,d,h=dim;c,s=math.cos(angle),math.sin(angle);v=[]
  for a,b,t in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
   xx=a*w/2;yy=b*d/2;v.append((x+xx*c-yy*s,y+xx*s+yy*c,z+t*h/2))
  self.geom(mat,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
 def tube(self,mat,pts,r,n=10,closed=False):
  pts=[Vector(p)for p in pts]
  if len(pts)>2 and not closed:
   sampled=[]
   for i in range(len(pts)-1):
    p0,p1,p2,p3=pts[max(0,i-1)],pts[i],pts[i+1],pts[min(len(pts)-1,i+2)]
    for j in range(6):
     t=j/6;sampled.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
   pts=sampled+[pts[-1]]
  tangents=[]
  for i,p in enumerate(pts):
   t=(pts[(i+1)%len(pts)]-pts[i-1])if closed else (pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)])
   tangents.append(t.normalized())
  axes=[Vector((1,0,0)),Vector((0,1,0)),Vector((0,0,1))];ref=min(axes,key=lambda a:max(abs(t.dot(a))for t in tangents));vs=[]
  for p,t in zip(pts,tangents):
   a=t.cross(ref).normalized();c=t.cross(a).normalized()
   vs.extend([tuple(p+r*(a*math.cos(j*math.tau/n)+c*math.sin(j*math.tau/n)))for j in range(n)])
  fs=[(i*n+j,i*n+(j+1)%n,((i+1)%len(pts))*n+(j+1)%n,((i+1)%len(pts))*n+j)for i in range(len(pts)if closed else len(pts)-1)for j in range(n)];self.geom(mat,vs,fs,True)
 def cyl(self,mat,p,r,h,n=24,axis='Z',r2=None):
  x,y,z=p;r2=r if r2 is None else r2;vs=[]
  for zz,rad in [(-h/2,r),(h/2,r2)]:
   for i in range(n):
    a=math.tau*i/n;xx=math.cos(a)*rad;yy=math.sin(a)*rad;vs.append((x+xx,y+yy,z+zz)if axis=='Z'else(x+xx,y+zz,z+yy)if axis=='Y'else(x+zz,y+xx,z+yy))
  self.geom(mat,vs,[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)],True);self.geom(mat,vs,[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))])
 def annulus(self,mat,p,outer,inner,h,n=48):
  x,y,z=p;vs=[]
  for zz,r in [(-h/2,outer),(-h/2,inner),(h/2,outer),(h/2,inner)]:
   vs.extend([(x+r*math.cos(i*math.tau/n),y+r*math.sin(i*math.tau/n),z+zz)for i in range(n)])
  self.geom(mat,vs,[(i,(i+1)%n,2*n+(i+1)%n,2*n+i)for i in range(n)]+[(n+i,3*n+i,3*n+(i+1)%n,n+(i+1)%n)for i in range(n)],True)
  self.geom(mat,vs,[(i,n+i,n+(i+1)%n,(i+1)%n)for i in range(n)]+[(2*n+i,2*n+(i+1)%n,3*n+(i+1)%n,3*n+i)for i in range(n)])
 def sphere(self,mat,p,r,scale=(1,1,1),n=20,rings=12):
  x,y,z=p;vs=[]
  for j in range(rings+1):
   t=math.pi*j/rings
   for i in range(n):a=math.tau*i/n;vs.append((x+r*math.sin(t)*math.cos(a)*scale[0],y+r*math.sin(t)*math.sin(a)*scale[1],z+r*math.cos(t)*scale[2]))
  self.geom(mat,vs,[(j*n+i,(j+1)*n+i,(j+1)*n+(i+1)%n,j*n+(i+1)%n)for j in range(rings)for i in range(n)],True)
 def extrude(self,mat,profile,depth,y=0):
  vs=[(x,y+side*depth/2,z)for side in [-1,1]for x,z in profile];n=len(profile);self.geom(mat,vs,[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])
 def text(self,mat,txt,p,size=.3,rot=(math.pi/2,0,0)):
  c=bpy.data.curves.new('Lettering','FONT');c.body=txt;c.align_x='CENTER';c.size=size;c.extrude=.006;c.bevel_depth=.002;c.bevel_resolution=1;c.resolution_u=2;o=bpy.data.objects.new(txt,c);bpy.context.collection.objects.link(o);o.location=p;o.rotation_euler=rot;c.materials.append(self.mats[mat]);o['rig']=self.rig
 def finish(self,name):
  for rig,origin in self.origins.items():
   o=bpy.data.objects.new(rig,None);bpy.context.collection.objects.link(o);o.location=origin;self.rigs[rig]=o
  for (rig,mat),(v,f,sm)in self.data.items():
   me=bpy.data.meshes.new(mat);me.from_pydata(v,[],f);me.materials.append(self.mats[mat]);me.update();o=bpy.data.objects.new((rig+'_'if rig else'')+mat,me);bpy.context.collection.objects.link(o)
   for poly,s in zip(me.polygons,sm):poly.use_smooth=s
   if rig:o.parent=self.rigs[rig]
   if mat!='Glass':
    bevel=o.modifiers.new('Soft machined edges','BEVEL');bevel.width=.025;bevel.segments=2;bevel.limit_method='ANGLE';bevel.angle_limit=.6
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=bevel.name)
  for o in list(bpy.context.scene.objects):
   if o.type=='FONT':bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
  # Merge static type lettering into the same palette meshes; keep all moving rig parts separate.
  groups=defaultdict(list)
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and not o.parent:groups[o.data.materials[0].name].append(o)
  for mat,objs in groups.items():
   bpy.ops.object.select_all(action='DESELECT')
   for o in objs:o.select_set(True)
   bpy.context.view_layer.objects.active=objs[0]
   if len(objs)>1:bpy.ops.object.join()
   bpy.context.object.name=mat
  bpy.context.view_layer.update();objs=[o for o in bpy.context.scene.objects if o.type in ['MESH','EMPTY']];bbox=[o.matrix_world@Vector(c)for o in objs if o.type=='MESH'for c in o.bound_box];bounds={k:[min(p[i]for p in bbox),max(p[i]for p in bbox)]for i,k in enumerate('xyz')}
  tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons)for o in objs if o.type=='MESH');bpy.ops.object.select_all(action='DESELECT')
  for o in objs:o.select_set(True)
  os.makedirs(OUT,exist_ok=True);bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
  meta={'name':name,'gltf_bounds':{'x':bounds['x'],'y':bounds['z'],'z':[-bounds['y'][1],-bounds['y'][0]]},'triangles':tris,'meshes':sum(o.type=='MESH'for o in objs),'moving_nodes':list(self.rigs)};open(os.path.join(ROOT,name+'-metadata.json'),'w').write(json.dumps(meta,indent=2));print(json.dumps(meta));return objs

def reset():bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def palette(b):
 for args in [('Ivory','#ede7d8',.58,0),('Stone','#cebea2',.7,0),('Deep teal','#305d56',.46,.3),('Teal light','#54897b',.46,.2),('Copper','#b86143',.45,.25),('Gold','#d7b16c',.3,.55),('Iron','#323e3c',.38,.55),('Steel','#a6b3b5',.25,.7),('Silver','#c5cdcd',.27,.65),('Glass','#111f2c',.13,.3),('Sensor','#183b4c',.12,.25),('Fabric','#c8c1b5',.92,0),('Fabric rib','#b2aa9d',.94,0),('Grass','#9fb38d',.86,0),('Clay','#d99270',.63,0),('Ink','#34594d',.8,0),('Red','#b85643',.5,.1)]:b.mat(*args)

def headset():
 reset();b=B();palette(b)
 b.box('Stone',(0,.2,.12),(8.1,7.0,.24));b.box('Ivory',(0,.2,.28),(7.8,6.7,.10));b.cyl('Silver',(0,0,.45),2.35,.22,80);b.cyl('Deep teal',(0,0,.59),2.12,.10,80)
 b.cyl('Silver',(0,-.45,1.5),.28,1.8,40);b.box('Silver',(0,-.55,2.25),(2.1,1.0,.22))
 # A continuously curved superelliptical face, with a nose relief in the lower edge.
 def point(t,r=1,depth=0):
  co,si=math.cos(t),math.sin(t);x=3.12*math.copysign(abs(co)**.62,co)*r;zz=1.35*math.copysign(abs(si)**.70,si)*r
  if si<0:zz+=.32*math.exp(-(x/.68)**2)*(-si)**4*r
  y=-1.42+.44*(x/3.12)**2+.12*(zz/1.35)**2+depth;return(x,y,3.84+zz)
 vs=[point(0,0)]+[point(i*math.tau/128,j/24)for j in range(1,25)for i in range(128)];fs=[(0,1+i,1+(i+1)%128)for i in range(128)]+[(1+j*128+i,1+(j+1)*128+i,1+(j+1)*128+(i+1)%128,1+j*128+(i+1)%128)for j in range(23)for i in range(128)];b.geom('Glass',vs,fs,True)
 b.tube('Silver',[point(i*math.tau/128,1,.04)for i in range(128)],.13,12,True)
 b.tube('Silver',[point(i*math.tau/128,.99,.31)for i in range(128)],.17,12,True)
 b.tube('Fabric',[point(i*math.tau/128,.96,.65)for i in range(128)],.21,12,True)
 # Small fabric ridges make the light seal legible even behind the polished frame.
 for i in range(72):
  a=i*math.tau/72;p=Vector(point(a,.96,.65));q=Vector(point(a,.96,.69));b.tube('Fabric rib',[tuple(p+Vector((0,-.08,-.10))),tuple(q+Vector((0,.08,.10)))],.018,5)
 for x in [-2.65,-1.65,1.65,2.65]:
  y=-1.42+.44*(x/3.12)**2+.12*((3.1-3.84)/1.35)**2;b.cyl('Iron',(x,y-.012,3.1),.18,.08,32,axis='Y');b.cyl('Sensor',(x,y-.066,3.1),.11,.055,32,axis='Y');b.sphere('Silver',(x-.035,y-.107,3.15),.032,n=10,rings=6)
 # Audio arms and a ribbed U-shaped knitted head strap.
 for side in [-1,1]:
  b.tube('Silver',[(side*3.0,-.5,3.9),(side*3.25,.2,3.85),(side*3.15,1.45,3.65)],.19,12)
  b.box('Ivory',(side*3.22,.5,3.82),(.28,1.08,.36));
  for i in range(10):b.box('Iron',(side*3.37,.15+i*.075,3.82),(.018,.025,.16))
 strap=[]
 for i in range(65):a=math.pi*i/64;strap.append((3.10*math.cos(a),1.25+1.0*math.sin(a),3.65))
 for zoff in [-.24,-.12,0,.12,.24]:b.tube('Fabric',[(x,y,z+zoff)for x,y,z in strap],.13,8)
 for i in range(44):
  a=math.pi*i/43;x=3.10*math.cos(a);y=1.25+math.sin(a);b.tube('Fabric rib',[(x,y,3.35),(x,y,3.94)],.018,6)
 # Top strap arches over the head opening; crown has radial knurling.
 b.tube('Fabric',[(-3.15,1.1,3.75),(-1.7,1.15,5.25),(0,1.2,5.7),(1.7,1.15,5.25),(3.15,1.1,3.75)],.18,12)
 b.cyl('Silver',(2.2,-.7,5.18),.28,.14,40)
 for i in range(28):a=math.tau*i/28;b.box('Steel',(2.2+.27*math.cos(a),-.7+.27*math.sin(a),5.18),(.026,.026,.14))
 b.box('Silver',(-2.12,-.72,5.17),(.66,.3,.12))
 # Battery, braided cable, and tactile route dots ground the accessible design project.
 b.box('Silver',(-2.45,1.45,.56),(1.3,1.9,.32));b.box('Ivory',(-2.45,1.45,.73),(1.1,1.65,.05));b.tube('Fabric rib',[(-2.42,.55,.62),(-3.48,.42,.8),(-3.48,1.1,1.6),(-3.15,1.48,3.65)],.042,8)
 for row in range(2):
  for i in range(8):b.sphere('Gold',(-1.35+i*.38,-2.25+row*.27,.42),.065,n=10,rings=6)
 b.box('Ivory',(0,-3.13,.55),(5.8,.18,.57));b.text('Ink','FEEL TO READ',(0,-3.23,.42),.36)
 return b.finish('feel-to-read')

def pumpjack():
 reset();b=B();palette(b)
 b.box('Stone',(0,0,.14),(8.9,6.8,.28));b.box('Ivory',(0,0,.32),(8.6,6.5,.12))
 # Concrete pads, steel skids, motor and guarded reduction gearbox.
 for y in [-.8,.8]:
  b.box('Stone',(-.4,y,.54),(5.4,.55,.25));b.box('Deep teal',(-.4,y,.74),(5.15,.25,.17))
 for x in [-2.8,-1.5,0,1.7]:b.box('Deep teal',(x,0,.77),(.23,2.05,.15))
 b.box('Copper',(-2.7,0,1.12),(1.42,1.26,.62));b.cyl('Iron',(-2.7,0,1.2),.4,1.45,40,axis='Y')
 for y in [-.7,.7]:
  b.cyl('Steel',(-2.7,y,1.2),.36,.08,40,axis='Y')
  for i in range(14):a=i*math.tau/14;b.cyl('Iron',(-2.7+math.cos(a)*.3,y,1.2+math.sin(a)*.3),.025,.1,8,axis='Y')
 b.box('Teal light',(-1.6,0,1.45),(1.1,1.2,1.25))
 for y in [-.66,.66]:b.cyl('Steel',(-1.6,y,1.75),.34,.45,36,axis='Y')
 # Tall A-frame, broad footplates and cross braces.
 for y in [-.56,.56]:
  for side in [-1,1]:
   b.tube('Deep teal',[(side*1.22,y,.85),(0,y,4.45)],.12,8)
   b.box('Steel',(side*1.22,y,.86),(.50,.44,.14))
   for xx in [-.16,.16]:b.cyl('Iron',(side*1.22+xx,y,.98),.045,.08,8)
  for z in [1.6,2.7,3.8]:
   w=1.22*(4.45-z)/3.6;b.tube('Teal light',[(-w,y,z),(w,y,z)],.07,8)
  b.tube('Teal light',[(-.95,y,1.55),(.57,y,2.8)],.055,8);b.tube('Teal light',[(.95,y,1.55),(-.57,y,2.8)],.055,8)
 b.cyl('Steel',(0,0,4.5),.27,1.65,40,axis='Y')
 for y in [-.9,.9]:b.cyl('Gold',(0,y,4.5),.18,.08,24,axis='Y')
 # Named hierarchy permits mechanical motion after glTF export.
 b.addrig('pump_beam',(0,0,4.5));b.rig='pump_beam'
 b.cyl('Steel',(-2.25,0,4.5),.11,2.05,24,axis='Y');b.box('Deep teal',(.25,0,4.5),(5.6,.47,.42));b.box('Teal light',(.25,0,4.76),(5.8,.65,.12));b.box('Teal light',(.25,0,4.24),(5.8,.65,.12))
 for x in [-2.4,-1.5,-.6,.3,1.2,2.1]:
  for y in [-.29,.29]:b.cyl('Gold',(x,y,4.5),.045,.035,8,axis='Y')
 # Curved horsehead rather than a generic box, layered steel plates and curved polished edge.
 profile=[(2.7,5.23),(3.10,5.10),(3.48,4.72),(3.63,4.1),(3.57,3.65),(3.13,3.65),(2.68,4.08)]
 b.extrude('Copper',profile,.7);b.extrude('Teal light',[(2.75,5.08),(3.02,4.97),(3.31,4.64),(3.44,4.15),(3.40,3.82),(3.20,3.82),(2.83,4.16)],.73)
 b.tube('Gold',[(2.76,0,5.24),(3.15,0,5.08),(3.49,0,4.70),(3.64,0,4.12),(3.58,0,3.65)],.045,10)
 for x,z in [(2.86,4.83),(3.10,4.62),(3.22,4.3),(3.22,4.0)]:
  for y in [-.39,.39]:b.cyl('Iron',(x,y,z),.055,.04,10,axis='Y')
 b.rig=''
 # Rear rotating crank, two counterweights and independent pitman rods.
 for side in [-1,1]:
  name='pump_crank_'+('front'if side<0 else'back');b.addrig(name,(-1.6,side*.9,1.75));b.rig=name
  b.cyl('Copper',(-1.6,side*.9,1.75),.73,.20,48,axis='Y');b.cyl('Steel',(-1.6,side*1.05,1.75),.18,.10,24,axis='Y')
  b.box('Deep teal',(-1.6,side*.9,1.31),(.85,.35,.44));b.box('Gold',(-1.6,side*1.10,1.25),(.60,.035,.13));b.rig=''
  name='pump_pitman_'+('front'if side<0 else'back');b.addrig(name,(-1.6,side*.9,2.38));b.rig=name
  b.tube('Steel',[(-1.6,side*.9,2.38),(-2.25,side*.9,4.5)],.073,12);b.rig=''
  b.rig='pump_beam';b.cyl('Gold',(-2.25,side*1.0,4.5),.13,.20,20,axis='Y');b.rig=''
 # Polished rod and wellhead at the front of the horsehead.
 b.addrig('pump_polished_rod',(3.57,0,3.68));b.rig='pump_polished_rod';b.cyl('Steel',(3.57,0,1.93),.045,3.50,12);b.box('Iron',(3.57,0,3.62),(.34,.20,.12));b.rig=''
 b.annulus('Deep teal',(3.57,0,.9),.34,.105,.9,40);b.annulus('Steel',(3.57,0,1.33),.46,.105,.10,48)
 for i in range(8):a=math.tau*i/8;b.cyl('Iron',(3.57+.34*math.cos(a),.34*math.sin(a),1.42),.04,.08,8)
 b.tube('Copper',[(3.57,0,.75),(3.57,1.4,.75),(2.2,1.65,.75),(1.8,2.4,.75),(-2.4,2.4,.75)],.12,12)
 b.cyl('Deep teal',(1.4,2.4,1.1),.065,.7,12);b.tube('Red',[(1.4+.33*math.cos(a*math.tau/40),2.4+.33*math.sin(a*math.tau/40),1.46)for a in range(40)],.035,8,True)
 for a in range(4):t=a*math.pi/2;b.tube('Red',[(1.4,2.4,1.46),(1.4+.32*math.cos(t),2.4+.32*math.sin(t),1.46)],.025,8)
 # Safety rails, ladder and a compact documentary plaque.
 for x in [-2.9,-1.7,-.5,.7]:
  b.cyl('Gold',(x,-1.35,1.1),.035,.9,10)
 b.tube('Gold',[(-2.9,-1.35,1.5),(.7,-1.35,1.5)],.045,10)
 for x in [-.35,.35]:b.tube('Steel',[(x,.84,.8),(x,.84,4.1)],.032,8)
 for i in range(10):b.tube('Steel',[(-.35,.84,1.0+i*.3),(.35,.84,1.0+i*.3)],.027,8)
 b.box('Deep teal',(0,-2.72,.67),(6.4,.24,.78));b.text('Ivory','RISE & DECLINE',(0,-2.86,.66),.42);b.text('Gold','DAQING  /  AN OIL CITY STORY',(0,-2.86,.38),.19)
 return b.finish('daqing-pumpjack')

def gateway():
 reset();b=B();palette(b)
 # Two foundations with an intentionally unobstructed 8.4-unit opening beneath the sign.
 for side in [-1,1]:
  x=side*4.55;b.box('Stone',(x,0,.12),(1.35,2.25,.24));b.box('Silver',(x,0,.30),(.9,1.45,.12));b.cyl('Deep teal',(x,0,3.3),.19,6.0,24)
  for xx in [-.32,.32]:
   for yy in [-.50,.50]:b.cyl('Iron',(x+xx,yy,.41),.055,.08,8)
  b.cyl('Teal light',(x,0,3.28),.23,.18,24);b.cyl('Teal light',(x,0,6.08),.23,.18,24)
  for zz in [5.6,6.35]:b.cyl('Steel',(x,0,zz),.12,.94,16,axis='Y')
  # Small map plinth and pavement tactile studs outside the roadway.
  b.box('Stone',(x,1.25,.57),(1.12,.8,.9));b.box('Deep teal',(x,.82,.70),(.98,.05,.58))
  for i in range(5):b.box('Gold',(x-.36+i*.18,.78,.70),(.035,.03,.42))
 # Triangulated highway gantry, upper chord and lower chord.
 for y in [-.37,.37]:
  for z in [5.6,6.35]:b.tube('Deep teal',[(-4.65,y,z),(4.65,y,z)],.09,10)
  for i in range(12):
   x=-4.55+i*.76;b.tube('Teal light',[(x,y,5.6),(x+.76,y,6.35)],.045,8);b.tube('Teal light',[(x,y,6.35),(x+.76,y,5.6)],.045,8)
 b.box('Deep teal',(0,-.44,5.62),(8.7,.25,1.70));b.box('Ivory',(0,-.585,5.62),(8.48,.035,1.48));b.box('Deep teal',(0,-.61,5.62),(8.34,.035,1.34))
 b.text('Ivory','DIVIDED BY 101',(0,-.65,5.78),.64);b.text('Ivory','TWO CITIES. ONE QUESTION.',(0,-.65,5.24),.27)
 # Tiny recessed lamps, a catwalk and inspection ladder read as actual infrastructure.
 for x in [-3.6,-2.4,-1.2,0,1.2,2.4,3.6]:
  b.box('Silver',(x,-.85,6.62),(.30,.28,.17));b.box('Gold',(x,-.89,6.51),(.24,.18,.05));b.tube('Silver',[(x,-.74,6.57),(x,-.24,6.3)],.035,8)
 b.box('Steel',(0,.74,5.45),(9.05,.75,.09))
 for x in [-4.4,-3.3,-2.2,-1.1,0,1.1,2.2,3.3,4.4]:b.cyl('Silver',(x,1.0,5.95),.03,.98,8)
 b.tube('Silver',[(-4.5,1,6.4),(4.5,1,6.4)],.035,8)
 for y in [-.27,.27]:b.tube('Silver',[(4.89,y,.5),(4.89,y,5.7)],.027,8)
 for i in range(17):b.tube('Silver',[(4.89,-.27,.7+i*.29),(4.89,.27,.7+i*.29)],.027,8)
 for zz in [1.4,3.4,5.4]:
  for side in [-1,1]:b.tube('Silver',[(4.55,side*.17,zz),(4.89,side*.27,zz)],.035,8)
 return b.finish('divided-101')

def preview(name,objs):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1250;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
 scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.70,.76,.72,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.035));floor=bpy.context.object;m=bpy.data.materials.new('Studio');m.diffuse_color=(.68,.73,.66,1);floor.data.materials.append(m)
 bpy.ops.object.light_add(type='AREA',location=(-7,-10,13));bpy.context.object.data.energy=2000;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=9
 bpy.ops.object.light_add(type='AREA',location=(8,3,9));bpy.context.object.data.energy=1300;bpy.context.object.data.size=8
 bpy.ops.object.camera_add(location=(10,-15,10));cam=bpy.context.object;target=Vector((0,0,2.5));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=12.5;scene.camera=cam
 scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,name+'-preview.png');bpy.ops.render.render(write_still=True);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,name+'.blend'))
if __name__=='__main__':
 for name,fn in [('feel-to-read',headset),('daqing-pumpjack',pumpjack),('divided-101',gateway)]:objs=fn();preview(name,objs)
