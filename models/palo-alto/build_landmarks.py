"""Original Blender meshes inspired by official Stanford and HP archival references.
Run: Blender --background --python models/palo-alto/build_landmarks.py
"""
import bpy, math, os, json, random
from mathutils import Vector
from collections import defaultdict
ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.abspath(os.path.join(ROOT,'../../dist/models'))
random.seed(12)
class Builder:
 def __init__(self): self.data=defaultdict(lambda:[[],[]]); self.materials={}
 def material(self,name,color,rough=.8,metal=0):
  m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;self.materials[name]=m;return name
 def geom(self,mat,verts,faces):
  d=self.data[mat];n=len(d[0]);d[0].extend(verts);d[1].extend([[n+i for i in f] for f in faces])
 def box(self,mat,xyz,dim,angle=0):
  x,y,z=xyz;w,d,h=dim;c,s=math.cos(angle),math.sin(angle);v=[]
  for a,b,c0 in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]:
   xx=a*w/2;yy=b*d/2;v.append((x+xx*c-yy*s,y+xx*s+yy*c,z+c0*h/2))
  self.geom(mat,v,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
 def cyl(self,mat,center,r,h,n=20,r2=None,axis='Z'):
  r2=r if r2 is None else r2;x,y,z=center;v=[]
  for zz,rad in [(-h/2,r),(h/2,r2)]:
   for i in range(n):
    a=i*math.tau/n;xx=math.cos(a)*rad;yy=math.sin(a)*rad
    v.append((x+xx,y+yy,z+zz) if axis=='Z' else (x+xx,y+zz,z+yy) if axis=='Y' else (x+zz,y+xx,z+yy))
  self.geom(mat,v,[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])
 def sphere(self,mat,center,r,scale=(1,1,1),n=20,rings=12,theta_max=math.pi):
  x,y,z=center;v=[]
  for j in range(rings+1):
   t=theta_max*j/rings
   for i in range(n):
    a=math.tau*i/n;v.append((x+r*math.sin(t)*math.cos(a)*scale[0],y+r*math.sin(t)*math.sin(a)*scale[1],z+r*math.cos(t)*scale[2]))
  self.geom(mat,v,[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)for j in range(rings)for i in range(n)])
 def arch(self,mat,x,y,z,w,h,thick=.15,depth=.35,n=16,angle=0):
  # Semicircular arch resting at spring height z+h-w/2, with a real opening.
  r=w/2;zc=z+h-r;v=[]
  for yy in [-depth/2,depth/2]:
   for rad in [r,r+thick]:
    for i in range(n+1):
     a=math.pi*i/n;xx=math.cos(a)*rad;zz=zc+math.sin(a)*rad
     v.append((x+xx*math.cos(angle)-yy*math.sin(angle),y+xx*math.sin(angle)+yy*math.cos(angle),zz))
  stride=n+1;faces=[]
  for i in range(n):
   faces.extend([(i,i+1,stride+i+1,stride+i),(2*stride+i,3*stride+i,3*stride+i+1,2*stride+i+1),(i,2*stride+i,2*stride+i+1,i+1),(stride+i,stride+i+1,3*stride+i+1,3*stride+i)])
  self.geom(mat,v,faces)
  for side in [-1,1]:
   xx=side*(r+thick/2);self.box(mat,(x+xx*math.cos(angle),y+xx*math.sin(angle),z+(h-r)/2),(thick,depth,h-r),angle)
 def text(self,mat,txt,xyz,size=.3,rot=(math.pi/2,0,0),align='CENTER',extr=.006):
  c=bpy.data.curves.new('Inscription','FONT');c.body=txt;c.align_x=align;c.size=size;c.extrude=extr;c.resolution_u=2;c.bevel_depth=.002;c.bevel_resolution=1;o=bpy.data.objects.new(txt,c);bpy.context.collection.objects.link(o);o.location=xyz;o.rotation_euler=rot;c.materials.append(self.materials[mat])
 def roof(self,x,y,z,w,d,rise,mat='Roof Clay',tiles=True):
  # Ridge parallel with X. The half-round caps are visible individually.
  v=[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x-w/2,y,z+rise),(x+w/2,y,z+rise),(x-w/2,y+d/2,z),(x+w/2,y+d/2,z)]
  self.geom(mat,v,[(0,1,3,2),(2,3,5,4),(0,2,4),(1,5,3)])
  if tiles:
   rows=max(2,int(d/.26));cols=max(2,int(w/.25))
   for col in range(cols):
    xx=x-w/2+(col+.5)*w/cols
    for side in [-1,1]:
     for row in range(rows//2):
      t=(row+.5)/(rows/2);yy=y+side*d/2*t;zz=z+rise*(1-t)+.045;length=d/rows*.93
      # Short capped tile sections stepped down the roof.
      self.cyl(['Roof Clay','Roof Light','Roof Shade'][(row+col)%3],(xx,yy,zz),.068,length,n=7,axis='Y')
   self.cyl('Roof Light',(x,y,z+rise+.06),.11,w+.08,12,axis='X')
 def ellipse(self,mat,center,rx,ry,h,n=64):
  before=len(self.data[mat][0]);self.cyl(mat,center,rx,h,n)
  for i in range(before,len(self.data[mat][0])):
   xx,yy,zz=self.data[mat][0][i];self.data[mat][0][i]=(xx,center[1]+(yy-center[1])*ry/rx,zz)
 def roof_y(self,x,y,z,w,d,rise):
  before={mat:len(v[0])for mat,v in self.data.items()};self.roof(0,0,z,d,w,rise)
  for mat,(verts,faces)in self.data.items():
   for i in range(before.get(mat,0),len(verts)):
    xx,yy,zz=verts[i];verts[i]=(x-yy,y+xx,zz)
 def palm(self,x,y,height=2.4):
  self.cyl('Palm Trunk',(x,y,height/2),.10,height,10,r2=.065)
  for k in range(8):
   a=k*math.pi/4;v=[]
   for t in [0,.3,.65,1]:
    r=t*1.05;z=height+.15+.25*math.sin(t*math.pi)-.4*t;ww=.22*math.sin(t*math.pi)+.015
    v.extend([(x+math.cos(a)*r+math.sin(a)*ww,y+math.sin(a)*r-math.cos(a)*ww,z),(x+math.cos(a)*r-math.sin(a)*ww,y+math.sin(a)*r+math.cos(a)*ww,z)])
   self.geom('Palm Leaf',v,[(0,1,3,2),(2,3,5,4),(4,5,7,6)])
 def finish(self,name):
  for mat,(v,f) in self.data.items():
   me=bpy.data.meshes.new(mat+' Mesh');me.from_pydata(v,[],f);me.materials.append(self.materials[mat]);me.update();o=bpy.data.objects.new(mat,me);bpy.context.collection.objects.link(o)
  # Convert lettering and merge by material, keeping one draw call per palette swatch.
  for o in list(bpy.context.scene.objects):
   if o.type=='FONT':bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
  groups=defaultdict(list)
  for o in bpy.context.scene.objects:
   if o.type=='MESH':groups[o.data.materials[0].name].append(o)
  for mat,objs in groups.items():
   bpy.ops.object.select_all(action='DESELECT')
   for o in objs:o.select_set(True)
   bpy.context.view_layer.objects.active=objs[0]
   if len(objs)>1:bpy.ops.object.join()
   o=bpy.context.object;o.name=mat
  bpy.ops.object.select_all(action='DESELECT')
  objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
  for o in objects:o.select_set(True)
  bbox=[o.matrix_world@Vector(c)for o in objects for c in o.bound_box];bounds={k:[min(p[i]for p in bbox),max(p[i]for p in bbox)]for i,k in enumerate('xyz')};tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons)for o in objects)
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,name+'.blend'))
  bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
  meta={'name':name,'blender_bounds':bounds,'gltf_bounds':{'x':bounds['x'],'y':bounds['z'],'z':[-bounds['y'][1],-bounds['y'][0]]},'triangles':tris,'meshes':len(objects),'materials':list(groups)}
  open(os.path.join(ROOT,name+'-metadata.json'),'w').write(json.dumps(meta,indent=2));print(json.dumps(meta))
  return objects

def reset():
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def palette(b):
 for n,c in {'Sandstone':(.67,.47,.25),'Stone Light':(.85,.69,.43),'Stone Trim':(.93,.79,.54),'Stone Dark':(.43,.31,.18),'Roof Clay':(.56,.18,.085),'Roof Light':(.7,.27,.13),'Roof Shade':(.43,.13,.065),'Glass Dark':(.12,.21,.20),'Lawn':(.43,.60,.30),'Grass Edge':(.35,.46,.25),'Paving':(.78,.72,.57),'Palm Trunk':(.4,.3,.17),'Palm Leaf':(.19,.36,.16),'Brass':(.65,.44,.12),'Mosaic Rose':(.48,.22,.16),'Mosaic Blue':(.18,.35,.38),'Ivory':(.93,.88,.72)}.items():b.material(n,c)

def campus():
 reset();b=Builder();palette(b)
 b.box('Paving',(0,0,.08),(21,16,.16));b.box('Grass Edge',(0,-.4,.17),(20.6,15.6,.12))
 # Quad paved courtyards, central cross paths and small garden squares.
 b.box('Paving',(-1,.3,.26),(13.6,9.8,.12));b.box('Lawn',(-1,.2,.34),(9,5.9,.10))
 b.box('Paving',(-1,.2,.40),(1.4,6.4,.05));b.box('Paving',(-1,.2,.407),(9.3,1.15,.05))
 # Side wings and rear range; front colonnade remains open.
 for x in [-7,5]:
  b.box('Sandstone',(x,.5,1.35),(1.6,8.5,2.1));b.roof_y(x,.5,2.42,2.1,8.95,.65)
 for y in [-4.1,4.8]:
  b.box('Stone Light',(-1,y,2.15),(13.9,.42,.58));b.box('Stone Trim',(-1,y,2.47),(14.3,.65,.14));b.roof(-1,y,2.53,14.5,1.9,.62)
  for i in range(12):
   x=-7.43+i*1.17;b.arch('Stone Light',x,y,.4,.85,1.75,.15,.48,n=16);b.box('Stone Trim',(x-.51,y,.55),(.25,.59,.28));b.box('Stone Trim',(x-.51,y,1.5),(.22,.55,.1))
 # Side inward arcades, actual holes with a shaded walkway behind.
 for x in [-5.95,3.95]:
  for i in range(7):b.arch('Stone Light',x,-3.1+i*1.18,.4,.86,1.75,.15,.45,n=16,angle=math.pi/2)
 # Church nave, distinctive ornate west front and rose window.
 b.box('Sandstone',(-1,3,1.9),(4.1,3.4,3.0));b.roof(-1,3,3.4,4.45,3.7,1.35)
 front=1.24
 verts=[(-3.15,front,.4),(1.15,front,.4),(1.15,front,3.65),(-1,front,5.15),(-3.15,front,3.65)]
 b.geom('Stone Light',verts,[(0,1,2,3,4)])
 # Layered portal, mosaic spandrels and two slender towers.
 for xx in [-2.45,-1,.45]:
  b.arch('Stone Trim',xx,front-.06,.42,.9,1.65,.16,.2,n=20);b.box('Glass Dark',(xx,front+.04,1.05),(.82,.10,1.26))
 for xx in [-3.02,1.02]:
  b.box('Stone Trim',(xx,front-.04,2.05),(.25,.32,3.35));b.cyl('Stone Trim',(xx,front-.04,4.0),.19,.4,8,r2=.06)
 # Rose window rings and stained-glass petals, all geometry.
 b.cyl('Stone Dark',(-1,front-.1,3.36),.68,.12,48,axis='Y');b.cyl('Brass',(-1,front-.18,3.36),.59,.035,48,axis='Y');b.cyl('Mosaic Blue',(-1,front-.205,3.36),.51,.035,48,axis='Y')
 for i in range(12):
  a=i*math.tau/12;b.cyl('Stone Trim',(-1+math.cos(a)*.40,front-.24,3.36+math.sin(a)*.40),.12,.05,12,axis='Y')
 b.cyl('Mosaic Rose',(-1,front-.27,3.36),.15,.05,20,axis='Y')
 for i in range(9):b.box('Mosaic Rose'if i%2 else'Brass',(-2.63+i*.4,front-.12,2.38),(.24,.04,.27))
 b.box('Brass',(-1,front,5.35),(.12,.16,.6));b.box('Brass',(-1,front,5.45),(.43,.16,.10))
 for step in range(3):b.box('Stone Trim',(-1,.85-step*.25,.44-step*.035),(4.1+step*.18,.3,.09))
 # Hoover Tower: long vertical shaft, octagonal observation stage, tiled red dome.
 hx,hy=8,2.6
 b.box('Paving',(hx,hy,.36),(4.15,4.3,.34));b.box('Sandstone',(hx,hy,4.25),(2.65,2.65,7.5))
 for xx in [-1.22,1.22]:b.box('Stone Light',(hx+xx,hy,4.65),(.13,2.75,6.1))
 for yy in [-1.22,1.22]:b.box('Stone Light',(hx,hy+yy,4.65),(2.75,.13,6.1))
 # Thin vertical window slits that make the tall shaft legible.
 for side in [-1,1]:
  for xx in [-.65,0,.65]:
   for z in [2.1,3.4,4.7,6.0]:b.box('Glass Dark',(hx+xx,hy+side*1.335,z),(.12,.025,.42))
  for yy in [-.65,0,.65]:
   for z in [2.1,3.4,4.7,6.0]:b.box('Glass Dark',(hx+side*1.335,hy+yy,z),(.025,.12,.42))
 b.box('Stone Trim',(hx,hy,7.46),(2.85,2.85,.21));b.cyl('Sandstone',(hx,hy,8.12),1.49,1.25,8)
 for i in range(8):
  a=i*math.tau/8;x=hx+math.sin(a)*1.39;y=hy-math.cos(a)*1.39
  b.arch('Stone Trim',x,y,7.58,.55,1.0,.11,.11,n=14,angle=a)
  # deep arched recess behind raised surrounds
  b.box('Glass Dark',(x,y,8.02),(.45,.08,.77),a)
 b.cyl('Stone Trim',(hx,hy,8.79),1.54,.15,32)
 b.sphere('Roof Clay',(hx,hy,8.8),1.43,scale=(1,1,.83),n=40,rings=12,theta_max=math.pi/2)
 for j in range(7):
  t=(j+.5)/8*math.pi/2;r=1.43*math.sin(t);z=8.8+1.43*math.cos(t)*.83
  for i in range(max(8,int(r*28))):
   a=i*math.tau/max(8,int(r*28));b.box('Roof Light' if (i+j)%4==0 else'Roof Shade',(hx+math.cos(a)*r,hy+math.sin(a)*r,z),(.09,.09,.035),a)
 b.cyl('Stone Trim',(hx,hy,10.07),.15,.37,12,r2=.1);b.sphere('Stone Trim',(hx,hy,10.32),.19,n=16,rings=8);b.cyl('Brass',(hx,hy,10.55),.025,.30,8)
 # Oval and Palm Drive foreground.
 b.ellipse('Paving',(-1,-6.5,.33),2.8,1.28,.12,64);b.ellipse('Lawn',(-1,-6.5,.4),2.48,1.05,.08,64)
 b.box('Paving',(-1,-6.3,.46),(1.25,3.2,.05))
 for x in [-4.1,2.1]:
  for y in [-5.8,-7.1]:b.palm(x,y,2.1)
 for x,y in [(-8.5,-5.9),(-8.7,4.9),(4.4,6.3),(8,6.5)]:b.sphere('Lawn',(x,y,.8),.6,n=12,rings=8)
 b.box('Stone Trim',(-1,-7.75,.51),(8.7,.25,.55));b.text('Stone Dark','STANFORD UNIVERSITY',(-1,-7.89,.36),.38,rot=(math.pi/2,0,0))
 return b.finish('stanford-campus')

def garage():
 reset();b=Builder();palette(b)
 for n,c in {'Cedar':(.43,.31,.19),'Cedar Light':(.56,.42,.26),'Cedar Shade':(.34,.25,.16),'Green Trim':(.13,.24,.15),'Door Green':(.22,.34,.21),'Roof Cedar':(.30,.27,.21),'Iron':(.12,.14,.13),'Workshop Wood':(.5,.33,.16),'Oscillator':(.42,.46,.43),'Gravel':(.69,.66,.53)}.items():b.material(n,c)
 b.box('Grass Edge',(0,.3,.08),(6.9,8.1,.16));b.box('Gravel',(0,-1.0,.19),(4.5,5.4,.12))
 b.box('Stone Dark',(0,.7,.28),(4.15,5.5,.18))
 # Three walls leave the double-door opening genuinely open.
 b.box('Cedar',(0,3.2,1.5),(3.9,.18,2.4));b.box('Cedar',(-1.93,.7,1.5),(.18,5.1,2.4));b.box('Cedar',(1.93,.7,1.5),(.18,5.1,2.4))
 # Uneven overlapping cedar shingles with staggered seams.
 for side in [-1,1]:
  for row in range(12):
   for col in range(16):
    yy=-1.8+(col+.5)*.315+(row%2)*.10
    if yy>3.15:continue
    m=['Cedar','Cedar Light','Cedar Shade'][(row*7+col*3)%3]
    b.box(m,(side*2.035,yy,.44+row*.192),(.05,.30,.22))
 for row in range(12):
  for col in range(12):b.box(['Cedar','Cedar Light','Cedar Shade'][(row+col)%3],(-1.85+(col+.5)*.31,3.31,.44+row*.192),(.30,.05,.22))
 # End gables, green edge rafters, and many separate cedar roof courses.
 for yy in [-1.96,3.32]:b.geom('Cedar Light',[(-2.04,yy,2.7),(2.04,yy,2.7),(0,yy,3.75)],[(0,1,2)])
 # Ridge parallel Y; roof as two actual sloping planes.
 b.geom('Roof Cedar',[(-2.22,-2.18,2.69),(0,-2.18,3.85),(2.22,-2.18,2.69),(-2.22,3.55,2.69),(0,3.55,3.85),(2.22,3.55,2.69)],[(0,3,4,1),(1,4,5,2)])
 for side in [-1,1]:
  for row in range(9):
   t=(row+.5)/9;xx=side*2.2*t;zz=3.85-1.16*t
   for col in range(19):
    yy=-2.05+col*.3;verts=[(xx-side*.14,yy,zz+.08),(xx+side*.14,yy,zz-.065),(xx+side*.14,yy+.28,zz-.065),(xx-side*.14,yy+.28,zz+.08)]
    b.geom('Roof Cedar' if(row+col)%3 else'Cedar Shade',verts,[(0,1,2,3)])
 b.cyl('Cedar Shade',(0,.68,3.88),.085,5.85,12,axis='Y')
 for side in [-1,1]:
  b.box('Green Trim',(side*1.97,-1.98,1.52),(.16,.16,2.6));b.box('Green Trim',(side*1.99,3.32,1.52),(.13,.13,2.6));b.box('Green Trim',(side*2.18,.68,2.69),(.13,5.82,.13))
 b.box('Green Trim',(0,-2.02,2.70),(4.18,.17,.19))
 # Front trim follows the roof pitch.
 for side in [-1,1]:
  a=Vector((0,-2.19,3.86));c=Vector((side*2.25,-2.19,2.67));d=(c-a).normalized();n=Vector((-d.z,0,d.x))*.055
  b.geom('Green Trim',[tuple(a+n),tuple(a-n),tuple(c-n),tuple(c+n)],[(0,1,2,3)])
 # Left leaf mostly closed, right leaf swung outward to reveal the workbench.
 def door(side,angle):
  hinge=Vector((side*1.84,-2.08,0));ca,sa=math.cos(angle),math.sin(angle)
  def pt(x,y,z):return(hinge.x+x*ca-y*sa,hinge.y+x*sa+y*ca,z)
  cx=-side*.86;b.box('Door Green',pt(cx,0,1.42),(1.72,.12,2.18),angle)
  for xx in [cx-.77,cx+.77]:b.box('Green Trim',pt(xx,-.09,1.42),(.12,.10,2.2),angle)
  for zz in [.39,1.43,2.47]:b.box('Green Trim',pt(cx,-.10,zz),(1.7,.11,.12),angle)
  for i in range(7):b.box('Cedar Shade',pt(cx-.66+i*.22,-.067,1.41),(.014,.014,1.93),angle)
  for zz in [.70,2.10]:b.box('Iron',pt(-side*.18,-.16,zz),(.30,.045,.055),angle)
  b.cyl('Iron',pt(-side*1.54,-.18,1.4),.065,.10,12,axis='Y')
 door(-1,0);door(1,.53)
 # Interior bench and 200A-inspired instrument, seen through the open leaf.
 b.box('Workshop Wood',(.4,2.2,1.1),(2.8,.8,.16))
 for x in [-.8,1.6]:b.box('Workshop Wood',(x,2.2,.65),(.12,.55,.9))
 b.box('Oscillator',(.4,2.1,1.54),(.95,.46,.72));b.box('Stone Light',(.4,1.84,1.54),(.90,.04,.66))
 for x in [.15,.65]:b.cyl('Iron',(x,1.80,1.56),.105,.04,16,axis='Y')
 b.cyl('Iron',(.4,1.78,1.79),.08,.04,16,axis='Y');b.box('Workshop Wood',(-.85,2.15,1.4),(.22,.4,.50));b.cyl('Iron',(-.85,2.15,1.87),.035,.6,8)
 # Side window and visible green mullions.
 b.box('Green Trim',(2.09,1.2,1.67),(.10,1.1,1.05));b.box('Glass Dark',(2.15,1.2,1.67),(.04,.93,.87))
 for yy in [.96,1.44]:b.box('Green Trim',(2.19,yy,1.67),(.06,.04,.9))
 b.box('Green Trim',(2.19,1.2,1.67),(.06,1,.04))
 # Low white-green boundary, flagstone path and historical plaque.
 for side in [-1,1]:
  x=side*3.15
  for i in range(10):
   y=-3.1+i*.65;b.box('Ivory',(x,y,.65),(.14,.20,.88));b.cyl('Ivory',(x,y,1.14),.12,.16,4,r2=0)
  b.box('Ivory',(x,-.18,.60),(.10,6.4,.10))
 for i in range(4):b.box('Paving',(.1,-3.45+i*.34,.30),(2.2,.28,.04))
 b.box('Stone Dark',(-2.2,-3.12,.6),(1.05,.62,.9));b.box('Brass',(-2.2,-3.45,.72),(.83,.035,.54))
 # Lettering is mounted on the solid historical plaque, not floating beyond the base.
 b.text('Stone Dark','HP GARAGE',(-2.2,-3.474,.79),.14)
 b.text('Stone Dark','367 ADDISON',(-2.2,-3.474,.62),.075)
 b.text('Stone Dark','AVENUE',(-2.2,-3.474,.51),.075)
 for x,y in [(-2.85,2.1),(2.8,2.6),(-2.9,-1.8)]:b.sphere('Lawn',(x,y,.6),.45,n=12,rings=8)
 return b.finish('hp-garage')

def preview(name,objs):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32
 scene.render.resolution_x=1300;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
 scene.world.color=(.5,.5,.5);scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.77,.72,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.035));floor=bpy.context.object;m=bpy.data.materials.new('Studio');m.diffuse_color=(.72,.75,.67,1);floor.data.materials.append(m)
 bpy.ops.object.light_add(type='AREA',location=(-10,-12,20));bpy.context.object.data.energy=2400;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=12
 bpy.ops.object.light_add(type='AREA',location=(10,2,10));bpy.context.object.data.energy=1600;bpy.context.object.data.size=10
 bpy.ops.object.camera_add(location=(24,-32,24) if name=='stanford-campus' else (9,-12,8));cam=bpy.context.object;target=Vector((0,0,2 if name=='stanford-campus' else 1.2));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=25 if name=='stanford-campus' else 10.2;scene.camera=cam
 scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,name+'-preview.png');bpy.ops.render.render(write_still=True);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,name+'.blend'))

if __name__=='__main__':
 os.makedirs(OUT,exist_ok=True)
 for name,fn in [('stanford-campus',campus),('hp-garage',garage)]:
  objects=fn();preview(name,objects)
