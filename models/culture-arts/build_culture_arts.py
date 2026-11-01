"""Original detailed culture and arts miniatures for Niki portfolio.
Run: Blender --background --python models/culture-arts/build_culture_arts.py
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
   if not mat.startswith(('Roof','Gold','Brass','Glass')):
    bevel=o.modifiers.new('Soft miniature edges','BEVEL');bevel.width=.018;bevel.segments=2;bevel.limit_method='ANGLE';bevel.angle_limit=.90
    bpy.ops.object.modifier_apply(modifier=bevel.name)
   bpy.ops.object.shade_smooth_by_angle(angle=.68,keep_sharp_edges=True)
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
 colors={'Ivory':(.84,.77,.59),'Porcelain':(.95,.91,.78),'Sand':(.55,.43,.29),'Dark':(.035,.055,.05),'Brass':(.54,.30,.075),'Gold':(.85,.59,.18),'Walnut':(.24,.09,.035),'Maple':(.53,.25,.095),'Maple Light':(.66,.35,.14),'Velvet':(.33,.025,.045),'Velvet Light':(.52,.065,.07),'Plum':(.23,.10,.19),'Sage':(.29,.42,.25),'Roof Jade':(.055,.18,.13),'Roof Light':(.10,.28,.20),'Roof Dark':(.035,.10,.075),'Terracotta':(.55,.16,.10),'Skin':(.69,.40,.22),'Teal':(.04,.24,.24),'Glass':(.20,.36,.34),'Paper':(.91,.85,.65)}
 for n,c in colors.items():b.material(n,c,.34 if n in ['Brass','Gold','Maple','Maple Light','Dark'] else .78,.6 if n in ['Brass','Gold'] else 0)

def tube(b,mat,points,r=.04,n=8,closed=False):
 ps=[Vector(p) for p in points];v=[]
 for i,p in enumerate(ps):
  tangent=(ps[min(i+1,len(ps)-1)]-ps[max(0,i-1)]).normalized()
  ref=Vector((0,0,1)) if abs(tangent.z)<.9 else Vector((0,1,0));u=tangent.cross(ref).normalized();w=tangent.cross(u).normalized()
  for j in range(n):v.append(tuple(p+r*(math.cos(j*math.tau/n)*u+math.sin(j*math.tau/n)*w)))
 f=[(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j)for i in range(len(ps)-1)for j in range(n)]
 f.extend([tuple(range(n-1,-1,-1)),tuple((len(ps)-1)*n+j for j in range(n))]);b.geom(mat,v,f)

def bezier(a,b,c,d,n=20):
 out=[]
 for i in range(n):
  t=i/n;out.append(tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k] for k in range(len(a))))
 return out

def path2d(points):
 out=[]
 for a,b,c,d in points:out.extend(bezier(a,b,c,d,14))
 return out

def extrude_xz(b,mat,outline,y,depth):
 v=[(x,y+dy,z)for dy in [-depth/2,depth/2]for x,z in outline];n=len(outline)
 b.geom(mat,v,[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])

def extrude_xy(b,mat,outline,z,depth):
 n=len(outline);v=[(x,y,z+dz)for dz in [-depth/2,depth/2]for x,y in outline]
 b.geom(mat,v,[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])

def torus(b,mat,center,r,t,axis='Z',n=40,m=8):
 x,y,z=center;v=[]
 for i in range(n):
  a=i*math.tau/n
  for j in range(m):
   q=j*math.tau/m;xx=math.cos(a)*(r+t*math.cos(q));yy=math.sin(a)*(r+t*math.cos(q));zz=t*math.sin(q)
   v.append((x+xx,y+yy,z+zz)if axis=='Z' else(x+xx,y+zz,z+yy))
 b.geom(mat,v,[(i*m+j,i*m+(j+1)%m,((i+1)%n)*m+(j+1)%m,((i+1)%n)*m+j)for i in range(n)for j in range(m)])

def person(b,x,y,z,shirt='Teal',s=.7,pose=0):
 # Rounded little figures with separate hands, shoes and hair.
 for side in [-1,1]:
  b.box('Dark',(x+side*.11*s,y-.025*s,z+.16*s),(.17*s,.22*s,.29*s));b.sphere('Dark',(x+side*.11*s,y-.09*s,z+.06*s),.105*s,scale=(.85,1.5,.5),n=10,rings=6)
 b.sphere(shirt,(x,y,z+.47*s),.26*s,scale=(.92,.70,1.25),n=12,rings=8)
 b.sphere('Skin',(x,y,z+.91*s),.21*s,n=16,rings=10);b.sphere('Dark',(x,y+.025*s,z+1.01*s),.205*s,scale=(1,1,.65),n=12,rings=8)
 for side in [-1,1]:
  points=[(x+side*.19*s,y,z+.64*s),(x+side*.31*s,y-.05*s,z+(.53+.34*pose)*s),(x+side*.38*s,y-.1*s,z+(.39+.56*pose)*s)]
  tube(b,shirt,points,.085*s,8);b.sphere('Skin',points[-1],.075*s,n=10,rings=6)

def base(b,w=7.8,d=6.7,mat='Sand'):
 # Rounded perimeter with inset top and a shallow bevel.
 outline=[]
 for cx,cy,start in [(w/2-.32,d/2-.32,0),(-w/2+.32,d/2-.32,math.pi/2),(-w/2+.32,-d/2+.32,math.pi),(w/2-.32,-d/2+.32,math.pi*1.5)]:
  for i in range(9):
   a=start+i*math.pi/16;outline.append((cx+.32*math.cos(a),cy+.32*math.sin(a)))
 extrude_xy(b,mat,outline,.13,.26)

def playhouse():
 reset();b=Builder();palette(b);base(b,8.4,7.4,'Plum')
 # Open vaulted theatre shell: solid ribs with a genuinely open interior.
 for y in [.0,.55,1.1,1.65,2.2]:
  b.arch('Porcelain',0,y,.40,6.3,5.5,.20,.17,n=36)
 # Roof barrel behind the proscenium, open front and rear.
 n=40;v=[]
 for y in [.25,2.4]:
  for i in range(n+1):
   a=i*math.pi/n;v.append((3.38*math.cos(a),y,2.6+3.38*math.sin(a)))
 b.geom('Ivory',v,[(i,i+1,n+2+i,n+1+i)for i in range(n)])
 for side in [-1,1]:b.box('Ivory',(side*3.35,1.25,1.52),(.30,2.6,2.55))
 # Stage raised over two audience terraces.
 b.box('Dark',(0,.65,.49),(6.5,3.65,.43))
 for i in range(24):b.box('Maple' if i%3 else'Maple Light',(-3.12+i*.27,.65,.73),(.255,3.6,.08))
 # Rear wall follows the barrel interior; rectangular corners must not pierce the roof.
 rear=[(-3.05,.78),(3.05,.78)]
 rear += [(3.05*math.cos(i*math.pi/40),2.60+math.sqrt(3.15**2-(3.05*math.cos(i*math.pi/40))**2)) for i in range(41)]
 extrude_xz(b,'Velvet',rear,2.33,.10)
 for side in [-1,1]:
  x=side*2.65
  # Curtains are sculpted continuous pleated fabric, not cylinders.
  verts=[];cols=50;rows=12
  for j in range(rows+1):
   z=.79+j*3.95/rows
   for i in range(cols+1):
    xx=x+(i/cols-.5)*1.08;yy=-.76-.12*math.cos(i/cols*math.tau*5);verts.append((xx,yy,z+.045*math.sin(i/cols*math.pi*10)))
  b.geom('Velvet Light',verts,[(j*(cols+1)+i,j*(cols+1)+i+1,(j+1)*(cols+1)+i+1,(j+1)*(cols+1)+i)for j in range(rows)for i in range(cols)])
  # Pullback rope and tassel, corner fluted pilasters.
  tube(b,'Gold',[(x-.5,-.84,2.2),(x,-.98,2.06),(x+.5,-.84,2.2)],.045,8)
  b.cyl('Gold',(x+side*.30,-.95,1.90),.08,.25,12,r2=.045)
  for xx in [-.15,0,.15]:b.cyl('Ivory',(side*3.22+xx,-.94,2.52),.065,4.1,12)
  b.box('Gold',(side*3.22,-.94,4.65),(.55,.5,.17));b.box('Porcelain',(side*3.22,-.94,.70),(.55,.55,.2))
 # Swag valance with layered scallops and gold scallop trim.
 for j in range(5):
  xx=-2.28+j*1.14
  for k in range(3):
   pts=[]
   for i in range(17):
    a=i*math.pi/16;pts.append((xx-.58+1.16*i/16,-.94-k*.018,4.70-(.36+k*.085)*math.sin(a)))
   tube(b,'Velvet Light' if k%2 else'Velvet',pts,.11,10)
  tube(b,'Gold',[(xx-.58+1.16*i/16,-1.06,4.70-.57*math.sin(i*math.pi/16))for i in range(17)],.025,7)
 # Celestial stage set, lights and two performers.
 b.cyl('Gold',(0,2.25,3.48),.69,.05,48,axis='Y');b.cyl('Velvet',(0.22,2.20,3.66),.59,.06,48,axis='Y')
 for x,z in [(-1.9,3.6),(-1,4.25),(1.75,3.8),(1.1,2.7)]:b.sphere('Gold',(x,2.17,z),.055,n=8,rings=6)
 person(b,-.95,.55,.78,'Teal',.95,1);person(b,1.0,.8,.78,'Terracotta',.95,0)
 tube(b,'Dark',[(-2.8,-.25,4.95),(2.8,-.25,4.95)],.075,10)
 for x in [-2.3,-1.15,0,1.15,2.3]:
  b.cyl('Dark',(x,-.25,4.72),.15,.37,14);b.cyl('Gold',(x,-.25,4.51),.12,.03,14)
 for i in range(14):b.sphere('Gold',(-2.9+i*.446,-1.13,.81),.055,n=10,rings=6)
 # Two rows of upholstered seats, wood arms, seated audience.
 for row in range(2):
  yy=-2.0-row*.87;b.box('Sand',(0,yy,.32+row*.12),(6.3,.83,.12))
  for col in range(8):
   xx=-2.70+col*.77;zz=.47+row*.12
   b.box('Velvet',(xx,yy,zz+.23),(.53,.43,.16));b.sphere('Velvet Light',(xx,yy-.24,zz+.49),.28,scale=(1,.27,1.15),n=12,rings=8)
   for side in [-1,1]:b.box('Maple',(xx+side*.29,yy,zz+.34),(.06,.46,.07))
   if(col+row)%3==0:person(b,xx,yy+.03,zz+.16,['Teal','Ivory','Terracotta'][col%3],.44,0)
 # Marquee raised above the stage front.
 b.box('Dark',(0,-.95,5.46),(4.9,.25,.76));b.text('Gold','THE PLAYHOUSE',(0,-1.087,5.31),.36)
 for i in range(17):b.sphere('Gold',(-2.27+i*.284,-1.105,5.12),.025,n=8,rings=6)
 for side in [-1,1]:
  for z in [5.23,5.42,5.61]:b.sphere('Gold',(side*2.34,-1.105,z),.025,n=8,rings=6)
 return b.finish('playhouse')

def music_studio():
 reset();b=Builder();palette(b);base(b,8.1,7.1,'Sand')
 # Original carved violin, front faces -Y; a slight sideways lean is part of the silhouette.
 outline=path2d([((0,-1.6),(-1.35,-1.65),(-1.6,-.35),(-.82,.25)),((-.82,.25),(-.40,.55),(-.9,.75),(-.96,1.15)),((-.96,1.15),(-1.24,2.25),(-.42,2.48),(0,2.48)),((0,2.48),(.42,2.48),(1.24,2.25),(.96,1.15)),((.96,1.15),(.9,.75),(.40,.55),(.82,.25)),((.82,.25),(1.6,-.35),(1.35,-1.65),(0,-1.6))])
 vx,vy,vz=-1.35,.9,2.18
 def vp(x,y,z):return(vx+x-.11*z,vy+y,vz+z)
 # Side ribs, domed top and back plates with graduated arching.
 pts=[vp(x,0,z)for x,z in outline];n=len(pts)
 verts=[vp(x,y,z)for y in [-.23,.23]for x,z in outline]
 b.geom('Walnut',verts,[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])
 for front in [-1,1]:
  verts=[]
  for ring in range(6):
   t=1-ring*.17
   for x,z in outline:verts.append(vp(x*t,front*(.25+.15*(1-t*t)),.43+(z-.43)*t))
  b.geom('Maple Light'if front<0 else'Maple',verts,[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i)for j in range(5)for i in range(n)]+[tuple(5*n+i for i in range(n))])
  # Double fine purfling follows the instrument body.
  for shrink in [.97,.925]:tube(b,'Walnut',[vp(x*shrink,front*.265,.43+(z-.43)*shrink)for x,z in outline]+[vp(outline[0][0]*shrink,front*.265,.43+(outline[0][1]-.43)*shrink)],.012,5)
 # F holes with curled terminals.
 for side in [-1,1]:
  pts=bezier((side*.58,1.2),(side*.98,1.45),(side*.76,.65),(side*.60,.47),16)+bezier((side*.60,.47),(side*.34,.2),(side*.56,-.22),(side*.81,-.07),16)
  tube(b,'Dark',[vp(x,-.405,z)for x,z in pts],.045,8)
  # The f-hole is a shallow dark inset, never a raised cable.
  for i in range(len(b.data['Dark'][0])-len(pts)*8,len(b.data['Dark'][0])):
   xx,yy,zz=b.data['Dark'][0][i];b.data['Dark'][0][i]=(xx,vy-.406+(yy-(vy-.405))*.08,zz)
  for xx,zz in [pts[0],pts[-1]]:b.sphere('Dark',vp(xx,-.41,zz),.065,scale=(1,.07,1),n=12,rings=8)
 # Fingerboard, neck and scroll.
 tube(b,'Maple',[vp(0,.02,1.65),vp(0,.02,4.15)],.15,12)
 for yy in [-.35,-.31]:
  p=[vp(-.12,yy,1.03),vp(.12,yy,1.03),vp(.10,yy,4.05),vp(-.10,yy,4.05)];b.geom('Dark',p,[(0,1,2,3)])
 b.sphere('Maple',vp(0,-.04,4.30),.24,scale=(.9,.65,1.28),n=20,rings=12)
 for r in [.18,.115,.052]:torus(b,'Walnut',vp(0,-.215,4.32),r,.018,'Y',28,7)
 for side in [-1,1]:
  for zz in [3.65,3.94]:
   tube(b,'Dark',[vp(0,.01,zz),vp(side*.34,.01,zz)],.04,8);b.sphere('Dark',vp(side*.36,.01,zz),.11,scale=(1,.6,.75),n=12,rings=8)
 # Bridge, four individually visible strings, tailpiece and chinrest.
 bridge=[(-.34,-.05),(-.29,.34),(0,.45),(.29,.34),(.34,-.05),(.15,-.05),(.11,.13),(-.11,.13),(-.15,-.05)]
 verts=[vp(x,-.48,z+.1)for x,z in bridge];b.geom('Ivory',verts,[tuple(range(len(verts)))])
 b.sphere('Dark',vp(.58,-.37,-1.10),.35,scale=(1.3,.27,.73),n=22,rings=12)
 tail=[(-.14,-1.2),(.14,-1.2),(.23,-.55),(-.23,-.55)]
 b.geom('Dark',[vp(x,-.42,z)for x,z in tail],[(0,1,2,3)])
 for x in [-.072,-.024,.024,.072]:tube(b,'Gold',[vp(x,-.44,-1.18),vp(x,-.51,.52),vp(x,-.38,4.03)],.009,5)
 # Bow with separate hair ribbon, frog and curved head.
 bx=-.15
 tube(b,'Walnut',[(bx,-.2,.58),(bx+.12,-.2,3.4),(bx+.28,-.2,6.30)],.042,10)
 tube(b,'Paper',[(bx-.13,-.2,.62),(bx+.04,-.2,6.25)],.020,7)
 b.box('Dark',(bx-.08,-.2,.76),(.24,.17,.40));b.box('Ivory',(bx-.12,-.3,.72),(.10,.035,.08));b.sphere('Walnut',(bx+.21,-.2,6.3),.10,scale=(1.4,1,.65),n=12,rings=8)
 # Separate bow cradle keeps the bow clear of the grand piano and anchored to the base.
 b.cyl('Brass',(bx-.08,-.2,.31),.22,.10,24)
 tube(b,'Dark',[(bx-.08,-.2,.36),(bx-.08,-.2,.61)],.038,8)
 # A brass instrument stand supports the violin rather than leaving it floating.
 b.cyl('Brass',(vx+.17,vy+.2,.48),.055,.45,12)
 for side in [-1,1]:
  tube(b,'Dark',[(vx+.17,vy+.2,.48),(vx+side*.43,vy+.08,.38)],.055,10)
  tube(b,'Brass',[(vx+side*.43,vy+.08,.38),(vx+side*.42,vy-.08,.68)],.045,10)
 # Grand piano, curved rim, raised lid, 28 white and 20 raised ebony keys.
 px,py=1.8,-1.0
 shape=path2d([((-1.15,-1.25),(-1.15,-.3),(-1.12,1.55),(-.42,1.7)),((-.42,1.7),(.12,1.85),(.75,1.52),(.75,.85)),((.75,.85),(.75,.34),(1.12,.15),(1.15,-.20)),((1.15,-.20),(1.2,-.55),(1.15,-1.0),(1.15,-1.25)),((1.15,-1.25),(.4,-1.25),(-.4,-1.25),(-1.15,-1.25))])
 outline=[(px+x,py+y)for x,y in shape];extrude_xy(b,'Dark',outline,1.14,.25)
 for x,y in [(-.89,-.92),(.89,-.92),(-.42,1.3)]:
  b.cyl('Dark',(px+x,py+y,.67),.075,.78,12,r2=.10);b.sphere('Brass',(px+x,py+y,.25),.095,n=12,rings=8)
 # Soundboard and exposed strings inside curved frame.
 extrude_xy(b,'Maple',[(px+x*.88,py+y*.88)for x,y in shape],1.29,.06)
 for i in range(21):
  x=px-.86+i*.075;tube(b,'Gold',[(x,py-1.03,1.34),(x,py+.55+(i%4)*.12,1.34)],.009,5)
 # Hinged lid tilts upward over the far side, rimmed with a gold edge.
 lid=[(px+x,py+y,1.43+.44*(x+1.15))for x,y in shape]
 b.geom('Dark',lid,[tuple(range(len(lid)))]);tube(b,'Brass',lid+[lid[0]],.022,6)
 tube(b,'Dark',[(px+.7,py+.55,1.30),(px+.7,py+.55,2.24)],.035,8)
 b.box('Dark',(px,py-1.40,1.22),(2.5,.53,.18))
 for i in range(28):b.box('Porcelain',(px-1.13+i*.084,py-1.43,1.34),(.079,.45,.10))
 for i in range(27):
  if i%7 not in [2,6]:b.box('Dark',(px-1.088+i*.084,py-1.30,1.43),(.043,.27,.11))
 for i in [-1,0,1]:b.sphere('Brass',(px+i*.16,py-1.1,.42),.075,scale=(.7,2,.5),n=12,rings=8)
 b.box('Velvet',(px,py-2.05,.74),(1.1,.48,.17))
 for x in [-.4,.4]:b.box('Dark',(px+x,py-2.05,.49),(.07,.37,.45))
 b.box('Ivory',(-1.2,-3.17,.48),(3.8,.12,.44));b.text('Walnut','MUSIC STUDIO',(-1.2,-3.24,.37),.26)
 return b.finish('music-studio')

def culture_pavilion():
 reset();b=Builder();palette(b);base(b,8.3,7.4,'Sage')
 # Pavilion offset left leaves a generous brush and inkstone courtyard.
 cx,cy=-1.25,.55
 for k in range(3):b.box('Sand'if k==0 else'Ivory',(cx,cy,.28+k*.13),(4.4-k*.24,4.05-k*.24,.14))
 # Tapered columns with plinths, collars and real layered dougong brackets.
 for x in [-1.52,1.52]:
  for y in [-1.27,1.27]:
   xx,yy=cx+x,cy+y;b.cyl('Sand',(xx,yy,.72),.25,.34,12);b.cyl('Terracotta',(xx,yy,2.05),.13,2.5,20,r2=.11)
   for zz in [.94,3.17]:b.cyl('Brass',(xx,yy,zz),.17,.08,20)
   for j in range(3):
    b.box('Walnut',(xx,yy,3.30+j*.11),(.33+j*.19,.16,.13));b.box('Maple',(xx,yy,3.35+j*.11),(.16,.35+j*.18,.12))
 for y in [-1.27,1.27]:b.box('Terracotta',(cx,cy+y,3.25),(3.45,.19,.23))
 for x in [-1.52,1.52]:b.box('Terracotta',(cx+x,cy,3.25),(.19,2.9,.23))
 # Open railings with lattice panels across sides and back.
 for side in [-1,1]:
  xx=cx+side*1.53
  for j in range(8):b.box('Walnut',(xx,cy-1.1+j*.32,1.24),(.07,.06,.69))
  b.box('Maple',(xx,cy,1.61),(.13,2.7,.12));b.box('Maple',(xx,cy,.91),(.13,2.7,.10))
 for i in range(11):b.box('Walnut',(cx-1.4+i*.28,cy+1.28,1.23),(.06,.07,.66))
 b.box('Maple',(cx,cy+1.28,1.61),(3.1,.13,.12))
 # A hipped roof with upturned edges, individual overlapping barrel tile courses.
 def roof_level(z,wx,dy,rise):
  def surf(u,v):
   r=max(abs(u),abs(v));return z+rise*(1-r)+.23*r**5+.16*(abs(u*v)**3)
  # Four roof slopes, each sampled enough to hold the concave silhouette.
  grid=18;verts=[]
  for j in range(grid+1):
   v=-1+2*j/grid
   for i in range(grid+1):
    u=-1+2*i/grid;verts.append((cx+u*wx/2,cy+v*dy/2,surf(u,v)))
  b.geom('Roof Jade',verts,[(j*(grid+1)+i,j*(grid+1)+i+1,(j+1)*(grid+1)+i+1,(j+1)*(grid+1)+i)for j in range(grid)for i in range(grid)])
  for side in [-1,1]:
   for col in range(20):
    u=-.95+col*.1
    for row in range(7):
     v=side*(.20+row*.12)
     if abs(v)<abs(u):continue
     yy=cy+v*dy/2;xx=cx+u*wx/2;zz=surf(u,v)+.045
     b.cyl('Roof Light'if (col+row)%4==0 else'Roof Jade',(xx,yy,zz),.052,.24,8,axis='Y')
   for col in range(16):
    v=-.94+col*.125
    for row in range(7):
     u=side*(.20+row*.12)
     if abs(u)<abs(v):continue
     xx=cx+u*wx/2;yy=cy+v*dy/2;zz=surf(u,v)+.045
     b.cyl('Roof Light'if(col+row)%4==0 else'Roof Jade',(xx,yy,zz),.052,.25,8,axis='X')
  for side in [-1,1]:
   tube(b,'Roof Dark',[(cx+wx/2*(-1+2*i/24),cy+side*dy/2,surf(-1+2*i/24,side))for i in range(25)],.075,10)
   tube(b,'Roof Dark',[(cx+side*wx/2,cy+dy/2*(-1+2*i/24),surf(side,-1+2*i/24))for i in range(25)],.075,10)
  for sx in [-1,1]:
   for sy in [-1,1]:
    tube(b,'Roof Light',[(cx+sx*wx/2*t,cy+sy*dy/2*t,surf(sx*t,sy*t)+.08)for t in [0,.2,.4,.6,.8,1]],.075,10)
    b.sphere('Gold',(cx+sx*wx/2,cy+sy*dy/2,surf(sx,sy)+.15),.075,n=10,rings=8)
 roof_level(3.53,4.7,4.05,1.1);roof_level(4.58,3.15,2.78,.83)
 b.cyl('Gold',(cx,cy,5.62),.11,.33,12,r2=.06);b.sphere('Gold',(cx,cy,5.85),.15,n=16,rings=10)
 # Two ribbed red lanterns beneath the eaves.
 for x in [cx-1.0,cx+1.0]:
  y=cy-1.35;b.cyl('Brass',(x,y,3.11),.018,.44,6);b.sphere('Velvet Light',(x,y,2.70),.28,scale=(1,1,1.25),n=24,rings=14)
  for i in range(12):
   a=i*math.tau/12;tube(b,'Gold',[(x+math.cos(a)*.28*math.sin(t),y+math.sin(a)*.28*math.sin(t),2.70+.35*math.cos(t))for t in [math.pi*j/16 for j in range(17)]],.008,5)
  b.cyl('Gold',(x,y,2.33),.09,.10,12)
  for dx in [-.04,0,.04]:tube(b,'Velvet',[(x+dx,y,2.29),(x+dx,y,2.10)],.014,5)
 # Brush: turned bamboo handle, rings and individually modeled tapered hairs.
 bx,by=2.45,.65
 b.cyl('Sand',(bx,by,.50),.62,.30,32)
 tube(b,'Maple',[(bx-.22,by,1.26),(bx+.18,by,5.23)],.16,24)
 for z in [1.42,1.57,4.85,5.02]:b.cyl('Brass',(bx-.22+(z-1.26)/3.97*.4,by,z),.175,.065,24)
 torus(b,'Walnut',(bx+.21,by,5.38),.17,.028,'Y',24,7)
 # Fine bristles taper into a wet ink tip.
 for j in range(30):
  a=j*2.39996;r=.25*math.sqrt((j+.5)/30)
  pts=[(bx-.22+r*math.cos(a),by+r*math.sin(a),1.32),(bx-.32+r*.65*math.cos(a),by+r*.65*math.sin(a),.94),(bx-.42+r*.10*math.cos(a),by+r*.10*math.sin(a),.60)]
  tube(b,'Dark'if j%4 else'Walnut',pts,.024,6)
 # Inkstone with recessed basin and a seal.
 b.box('Dark',(2.25,-.90,.45),(1.90,1.4,.28));b.box('Roof Jade',(2.25,-.90,.605),(1.48,.99,.025))
 for i in range(2):torus(b,'Glass',(2.25,-.9,.63),.30+i*.12,.012,'Z',32,5)
 b.box('Terracotta',(3.1,-2.55,.54),(.39,.39,.48));b.box('Brass',(3.1,-2.55,.80),(.30,.30,.04))
 # Scroll page laid open across the apron; visible paper curl rolls and ink strokes.
 b.box('Paper',(-.40,-2.5,.47),(4.5,1.36,.05))
 for x in [-2.7,1.90]:b.cyl('Maple',(x,-2.5,.52),.11,1.6,16,axis='Y');b.cyl('Paper',(x,-2.5,.52),.16,1.35,24,axis='Y')
 # Abstract calligraphic marks from brush movement, without fake Chinese lettering.
 for i in range(5):
  x=-2.0+i*.68
  tube(b,'Dark',[(x-.14,-2.82,.51),(x+.04,-2.55,.51),(x-.08,-2.18,.51)],.033,7)
  tube(b,'Dark',[(x-.24,-2.48,.515),(x+.23,-2.57,.515)],.023,7)
 b.box('Ivory',(-.3,-3.35,.43),(4.4,.14,.36));b.text('Dark','CULTURE & CALLIGRAPHY',(-.3,-3.43,.34),.22)
 return b.finish('culture-pavilion')

def preview(name,objects):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=28
 scene.render.resolution_x=1300;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
 scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.77,.72,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.55
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.035));m=bpy.data.materials.new('Studio');m.diffuse_color=(.72,.75,.67,1);bpy.context.object.data.materials.append(m)
 for pos,energy,size in [((-8,-10,14),1800,9),((8,3,9),1100,7)]:
  bpy.ops.object.light_add(type='AREA',location=pos);bpy.context.object.data.energy=energy;bpy.context.object.data.size=size
 bpy.ops.object.camera_add(location=(10,-15,11));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,2.65 if name=='music-studio' else 2.1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.7 if name=='music-studio' else 11.3;scene.camera=cam
 scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,name+'-preview.png');bpy.ops.render.render(write_still=True);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,name+'.blend'))

if __name__=='__main__':
 os.makedirs(OUT,exist_ok=True)
 import sys
 selected=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
 for name,fn in [('playhouse',playhouse),('music-studio',music_studio),('culture-pavilion',culture_pavilion)]:
  if not selected or name in selected:preview(name,fn())
