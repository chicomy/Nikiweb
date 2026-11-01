"""Local mesh-authoring helpers shared by the community model build script."""
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
