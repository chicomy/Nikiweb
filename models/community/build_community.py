"""Detailed original community miniatures for Niki's World.
Run Blender --background --python models/community/build_community.py.
No photographic textures are used. Front faces Blender -Y / glTF +Z.
"""
import bpy, math, os, json, importlib.util, random
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
PROJECT=os.path.abspath(os.path.join(ROOT,'../..'))
spec=importlib.util.spec_from_file_location('landmark_helpers',os.path.join(ROOT,'mesh_helpers.py'))
helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers)
helpers.ROOT=ROOT;helpers.OUT=os.path.join(PROJECT,'dist/models')
random.seed(31)
class B(helpers.Builder):
 def __init__(self):
  super().__init__();self.smooth={}
 def sphere(self,mat,*args,**kwargs):
  start=len(self.data[mat][1]);super().sphere(mat,*args,**kwargs);self.smooth.setdefault(mat,set()).update(range(start,len(self.data[mat][1])))
 def finish(self,name):
  objects=super().finish(name)
  # Curved surfaces get smooth normals; stone edges and text stay crisp.
  for o in objects:
   mat=o.data.materials[0].name
   key=next((k for k,m in self.materials.items() if m.name==mat),None)
   for index in self.smooth.get(key,set()):
    if index<len(o.data.polygons):o.data.polygons[index].use_smooth=True
  bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,name+'.blend'))
  bpy.ops.export_scene.gltf(filepath=os.path.join(helpers.OUT,name+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
  return objects
 def rod(self,mat,a,b,r=.035,n=10):
  a,b=Vector(a),Vector(b);d=(b-a).normalized();u=d.cross(Vector((0,0,1)))
  if u.length<.01:u=d.cross(Vector((0,1,0)))
  u.normalize();v=d.cross(u);verts=[]
  for p in [a,b]:
   for i in range(n):
    q=p+r*(u*math.cos(i*math.tau/n)+v*math.sin(i*math.tau/n));verts.append(tuple(q))
  self.geom(mat,verts,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])
 def tube(self,mat,pts,r=.035,n=8):
  for a,b in zip(pts,pts[1:]):self.rod(mat,a,b,r,n)
 def torus(self,mat,center,R,r,axis='Z',n=48,m=8):
  verts=[];x,y,z=center
  for i in range(n):
   a=i*math.tau/n
   for j in range(m):
    t=j*math.tau/m;xx=(R+r*math.cos(t))*math.cos(a);yy=(R+r*math.cos(t))*math.sin(a);zz=r*math.sin(t)
    verts.append((x+xx,y+yy,z+zz)if axis=='Z' else(x+xx,y+zz,z+yy))
  self.geom(mat,verts,[(i*m+j,((i+1)%n)*m+j,((i+1)%n)*m+(j+1)%m,i*m+(j+1)%m)for i in range(n)for j in range(m)])
 def roundbox(self,mat,center,dim,r=.1,n=4):
  # Beveled edges are actual geometry, not a shader trick.
  bpy.ops.mesh.primitive_cube_add(size=1,location=center);o=bpy.context.object;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  mod=o.modifiers.new('Rounded miniature edges','BEVEL');mod.width=min(r,min(dim)/2.1);mod.segments=n;bpy.ops.object.modifier_apply(modifier=mod.name)
  self.geom(mat,[tuple(o.matrix_world@v.co)for v in o.data.vertices],[tuple(p.vertices)for p in o.data.polygons]);bpy.data.objects.remove(o,do_unlink=True)
 def heart(self,mat,center,s=.5,depth=.12):
  x,y,z=center;pts=[]
  for i in range(80):
   t=i*math.tau/80;pts.append((x+s*math.sin(t)**3,y,z+s*(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t))/16))
  verts=[(a,b+dy,c)for dy in [-depth/2,depth/2]for a,b,c in pts]
  self.geom(mat,verts,[tuple(range(79,-1,-1)),tuple(range(80,160))]+[(i,(i+1)%80,(i+1)%80+80,i+80)for i in range(80)])
 def plant(self,x,y,z,s=.5,pot=True):
  if pot:self.cyl('Clay',(x,y,z+.19*s),.24*s,.38*s,20,r2=.30*s)
  for i in range(7):
   a=i*2.4;rr=.24*s;self.rod('Leaf',(x,y,z+.35*s),(x+math.cos(a)*rr,y+math.sin(a)*rr,z+.7*s),.025*s,6)
   self.sphere('Leaf Light'if i%2 else'Leaf',(x+math.cos(a)*rr,y+math.sin(a)*rr,z+.66*s),.20*s,scale=(.65,.4,1.45),n=10,rings=6)
 def person(self,x,y,z,s=1,shirt='Coral',seated=False,child=False):
  # Soft articulated figures, with shoes, hands and facial features.
  base=z;hip=.43*s if not seated else .34*s;head=.95*s if not seated else .83*s
  for side in [-1,1]:
   xx=x+side*.105*s
   if seated:
    self.rod('Ink',(xx,y,base+hip),(xx,y-.22*s,base+.28*s),.065*s);self.rod('Ink',(xx,y-.22*s,base+.28*s),(xx,y-.22*s,base+.10*s),.06*s)
    self.roundbox('Cream',(xx,y-.27*s,base+.07*s),(.14*s,.25*s,.12*s),.04*s,2)
   else:
    self.rod('Ink',(xx,y,base+.10*s),(xx,y,base+hip),.065*s);self.roundbox('Cream',(xx,y-.04*s,base+.07*s),(.14*s,.23*s,.12*s),.04*s,2)
  self.roundbox(shirt,(x,y,base+hip+.16*s),(.40*s,.25*s,.37*s),.09*s,3)
  self.sphere('Skin',(x,y,base+head),.16*s,n=16,rings=10)
  self.sphere('Hair',(x,y+.025*s,base+head+.085*s),.165*s,scale=(1,.95,.55),n=16,rings=8)
  for side in [-1,1]:
   self.rod(shirt,(x+side*.22*s,y,base+hip+.27*s),(x+side*.29*s,y-.09*s,base+hip+.02*s),.06*s)
   self.sphere('Skin',(x+side*.29*s,y-.09*s,base+hip+.01*s),.07*s,n=10,rings=6)
   self.sphere('Ink',(x+side*.054*s,y-.149*s,base+head+.015*s),.018*s,n=8,rings=5)
 def bench(self,x,y,z,w=1.3):
  for yy in [-.20,-.06,.08]:self.roundbox('Wood',(x,y+yy,z+.34),(w,.11,.09),.035,2)
  for xx in [-w*.36,w*.36]:self.rod('Forest',(x+xx,y,z),(x+xx,y,z+.75),.035);self.rod('Forest',(x+xx,y-.19,z),(x+xx,y-.19,z+.34),.035)
  for zz in [.55,.71]:self.roundbox('Wood',(x,y+.08,z+zz),(w,.08,.13),.035,2)
 def window(self,x,y,z,w,h,side=False):
  if side:
   self.roundbox('Forest',(x,y,z),(.12,w+.18,h+.18),.05);self.box('Glass',(x+.075,y,z),(.03,w,h));self.box('Cream',(x+.10,y,z),(.05,.045,h));self.box('Cream',(x+.10,y,z),(.05,w,.045))
  else:
   self.roundbox('Forest',(x,y,z),(w+.18,.12,h+.18),.05);self.box('Glass',(x,y-.075,z),(w,.03,h));self.box('Cream',(x,y-.10,z),(.045,.05,h));self.box('Cream',(x,y-.10,z),(w,.05,.045))
 def book(self,x,y,z,w=.13,h=.4,mat='Coral'):
  self.roundbox(mat,(x,y,z+h/2),(w,.27,h),.015,2);self.box('Paper',(x,y-.14,z+h/2),(w*.65,.018,h*.86));self.box('Gold',(x,y-.155,z+h*.7),(w*.7,.012,.025))

def reset():helpers.reset()
def palette(b):
 colors={'Cream':(.88,.80,.63),'Ivory':(.96,.91,.78),'Stone':(.62,.57,.45),'Stone Light':(.77,.71,.58),'Forest':(.085,.21,.16),'Ink':(.055,.085,.075),'Glass':(.22,.42,.39),'Coral':(.62,.24,.17),'Clay':(.50,.24,.13),'Clay Light':(.66,.32,.20),'Clay Shade':(.39,.16,.10),'Leaf':(.18,.34,.15),'Leaf Light':(.35,.50,.24),'Grass':(.42,.55,.29),'Wood':(.46,.29,.15),'Gold':(.64,.44,.14),'Paper':(.91,.84,.66),'Blue':(.22,.39,.43),'Skin':(.68,.42,.25),'Hair':(.12,.105,.065),'Rose':(.63,.34,.33)}
 for n,c in colors.items():b.material(n,c,.72 if n not in ['Glass','Gold']else .3,.3 if n=='Gold' else 0)
 # Opaque glazed color keeps small-scale models performant and windows legible.

def plinth(b,name):
 b.roundbox('Stone Light',(0,0,.14),(8,7,.28),.24,4);b.roundbox('Grass',(0,.05,.30),(7.7,6.7,.08),.24,3)
 b.roundbox('Cream',(0,-3.30,.48),(4.7,.22,.32),.08,3);b.text('Forest',name,(0,-3.421,.40),.23)

def civic():
 reset();b=B();palette(b);plinth(b,'CIVIC HALL')
 cy=.5
 for r,z,h in [(2.85,.49,.22),(2.65,.67,.14),(2.45,.78,.12)]:b.cyl('Stone Light',(0,cy,z),r,h,64)
 # Stone drum, inset glazing and front door.
 b.cyl('Glass',(0,cy,2.14),2.0,2.65,64);b.cyl('Cream',(0,cy,3.42),2.19,.20,64)
 for i in range(14):
  a=(i+.5)*math.tau/14;x=math.cos(a)*2.36;y=cy+math.sin(a)*2.36
  # fluted shaft and layered capital/base rings
  verts=[]
  for z,r in [(.85,.15),(1,.145),(3.16,.12),(3.25,.13)]:
   for j in range(64):
    t=j*math.tau/64;rr=r+.012*math.cos(16*t);verts.append((x+math.cos(t)*rr,y+math.sin(t)*rr,z))
  b.geom('Ivory',verts,[(k*64+j,k*64+(j+1)%64,(k+1)*64+(j+1)%64,(k+1)*64+j)for k in range(3)for j in range(64)])
  for z,r,h in [(.89,.22,.11),(1.04,.18,.08),(3.18,.17,.08),(3.29,.24,.13)]:b.cyl('Cream',(x,y,z),r,h,20)
  b.roundbox('Ivory',(x,y,3.40),(.5,.5,.12),.03,2)
  b.torus('Gold',(x,y,3.22),.16,.018,n=20,m=6)
  # vertical muntin ribs visible on window drum
  xx=math.cos(a)*2.01;yy=cy+math.sin(a)*2.01;b.rod('Cream',(xx,yy,.95),(xx,yy,3.2),.045)
 for z in [1.58,2.53]:b.torus('Cream',(0,cy,z),2.01,.032,n=64,m=6)
 # entablature with small dentils below ribbed copper-green dome.
 for z,r,h in [(3.47,2.65,.20),(3.62,2.72,.10)]:b.cyl('Ivory',(0,cy,z),r,h,64)
 for i in range(52):
  a=i*math.tau/52;b.box('Cream',(math.cos(a)*2.62,cy+math.sin(a)*2.62,3.37),(.095,.14,.10),a)
 b.sphere('Glass',(0,cy,3.65),2.49,(1,1,.64),64,24,math.pi/2)
 for i in range(16):
  a=i*math.tau/16;pts=[]
  for j in range(21):
   t=j/20*math.pi/2;rr=2.51*math.sin(t);pts.append((rr*math.cos(a),cy+rr*math.sin(a),3.65+1.60*math.cos(t)))
  b.tube('Forest',pts,.025,7)
 b.cyl('Gold',(0,cy,5.29),.24,.18,20);b.cyl('Cream',(0,cy,5.56),.16,.4,16);b.sphere('Gold',(0,cy,5.85),.18,n=16,rings=10)
 # Glazed double portal and door hardware.
 b.arch('Cream',0,-1.58,.83,1.2,2.18,.14,.14,24);b.roundbox('Forest',(0,-1.65,1.73),(1.16,.12,1.79),.09,3)
 for x in [-.29,.29]:b.roundbox('Glass',(x,-1.73,1.75),(.48,.035,1.54),.05,3);b.rod('Gold',(x*.36,-1.78,1.55),(x*.36,-1.78,1.95),.025)
 for i in range(3):b.roundbox('Stone Light',(0,-2.22-i*.28,.68-i*.14),(2.2+i*.3,.45,.17),.045,2)
 for side in [-1,1]:
  for i in range(4):b.rod('Gold',(side*1.45,-2.15-i*.30,.50-i*.04),(side*1.45,-2.15-i*.30,1.04-i*.08),.023)
  b.rod('Gold',(side*1.45,-2.15,1.04),(side*1.45,-3.05,.80),.035)
 # Public testimony lectern and a speaker on the right forecourt.
 b.roundbox('Wood',(2.75,-2.14,.8),(.6,.43,.82),.06,3);b.roundbox('Forest',(2.75,-2.18,1.25),(.8,.56,.09),.04,2)
 b.rod('Ink',(2.95,-2.1,1.3),(2.90,-2.07,1.62),.018);b.sphere('Ink',(2.88,-2.08,1.63),.045,n=10,rings=6)
 b.person(2.75,-1.7,.37,1.12,'Blue');b.bench(-2.65,-1.8,.36,1.2);b.person(-2.65,-2.00,.54025,.65,'Coral',True)
 for x,y in [(-3.1,.9),(3.1,.9),(-2.6,2.5),(2.6,2.5)]:b.plant(x,y,.35,1.1)
 return b.finish('civic-hall')

def cottage():
 reset();b=B();palette(b);plinth(b,'CARE COTTAGE')
 # Warm small house, with an open porch and a side greenhouse.
 b.roundbox('Stone',(0,.65,.5),(4.8,3.6,.3),.12);b.roundbox('Ivory',(-.55,.65,1.86),(3.7,3.3,2.6),.16,4)
 # horizontal clapboard reveals
 for z in [.8+i*.22 for i in range(10)]:
  b.box('Cream',(-.55,-1.015,z),(3.67,.035,.055));b.box('Cream',(-2.42,.65,z),(.035,3.28,.055))
 # Sloping roof, individually overlapping terracotta shingles.
 w,d=4.35,3.88;cx,cy=-.55,.65;zb=3.12;rise=1.05
 b.geom('Clay',[(cx-w/2,cy-d/2,zb),(cx+w/2,cy-d/2,zb),(cx-w/2,cy,zb+rise),(cx+w/2,cy,zb+rise),(cx-w/2,cy+d/2,zb),(cx+w/2,cy+d/2,zb)],[(0,1,3,2),(2,3,5,4),(0,2,4),(1,5,3)])
 for col in range(18):
  x=cx-w/2+(col+.5)*w/18
  for side in [-1,1]:
   for row in range(8):
    t=(row+.5)/8;y=cy+side*t*d/2;z=zb+rise*(1-t)+.04
    b.cyl(['Clay','Clay Light','Clay Shade'][(col+row)%3],(x,y,z),.076,.255,8,axis='Y')
 b.cyl('Clay Light',(cx,cy,zb+rise+.08),.13,w+.08,14,axis='X')
 for yy in [cy-d/2,cy+d/2]:b.roundbox('Forest',(cx,yy,zb-.03),(w+.06,.14,.17),.04,2)
 # Chimney masonry courses, lip and rain cap.
 for row in range(9):
  for col in range(3):b.roundbox('Clay Light'if(row+col)%2 else'Clay Shade',(-1.7+(col-1)*.20,1.43,3.35+row*.17),(.185,.56,.155),.02,2)
 b.roundbox('Cream',(-1.7,1.43,4.93),(.79,.75,.14),.04,2);b.roundbox('Ink',(-1.7,1.43,5.02),(.48,.43,.04),.03,2)
 # Heart-window dormer makes the care motif visible above the porch.
 b.roundbox('Ivory',(-.4,-1.08,3.57),(1.13,.48,.75),.08,3)
 b.heart('Forest',(-.4,-1.332,3.59),.32,.07);b.heart('Rose',(-.4,-1.38,3.59),.24,.035)
 b.geom('Clay Light',[(-1.04,-1.41,3.91),(.24,-1.41,3.91),(-.4,-1.41,4.19),(-1.04,-.76,3.91),(.24,-.76,3.91),(-.4,-.76,4.19)],[(0,3,5,2),(2,5,4,1),(0,1,2)])
 # Heart motif over the entrance, framed in pale stone.
 b.heart('Coral',(-.4,-1.04,2.84),.38,.10);b.heart('Rose',(-.4,-1.106,2.84),.28,.04)
 b.roundbox('Forest',(-.4,-1.10,1.49),(1,.18,1.82),.13,4);b.roundbox('Glass',(-.4,-1.21,1.8),(.64,.025,.8),.08,3);b.sphere('Gold',(-.06,-1.25,1.30),.045,n=12,rings=8)
 b.window(-1.65,-1.08,1.88,.73,1.04);b.window(.82,-1.08,1.88,.73,1.04)
 for xx in [-1.65,.82]:
  b.roundbox('Wood',(xx,-1.24,1.26),(.92,.33,.19),.06,2)
  for j in range(4):b.plant(xx+(j-1.5)*.18,-1.28,1.30,.35,False)
 # Porch posts, curved handrails and rooflet.
 b.roundbox('Wood',(-.4,-1.65,.6),(2.05,1.18,.16),.06,3)
 for x in [-1.36,.56]:
  b.cyl('Cream',(x,-2.05,1.65),.065,2.1,16);b.cyl('Forest',(x,-2.05,.72),.11,.18,16)
 b.roundbox('Forest',(-.4,-1.65,2.72),(2.25,1.45,.20),.09,3)
 for i in range(14):b.cyl('Clay Light',(-1.43+i*.16,-1.65,2.85),.055,1.47,7,axis='Y')
 for i in range(2):b.roundbox('Stone Light',(-.4,-2.35-i*.20,.47-i*.08),(1.45+i*.18,.28,.12),.04,3)
 # Glazed conservatory at the right, a real little frame rather than a cube.
 b.roundbox('Stone Light',(2.12,.60,.52),(2.1,3.35,.22),.12,3)
 b.roundbox('Glass',(2.12,.62,1.54),(1.87,3.08,1.83),.13,4)
 for x in [1.19,2.12,3.05]:
  for y in [-.94,2.16]:b.rod('Cream',(x,y,.62),(x,y,2.46),.045)
 for y in [-.94,.1,1.12,2.16]:
  b.rod('Cream',(3.08,y,.62),(3.08,y,2.44),.045);b.rod('Cream',(1.16,y,2.46),(2.12,y,2.97),.055);b.rod('Cream',(2.12,y,2.97),(3.08,y,2.46),.055)
 b.geom('Glass',[(1.16,-.96,2.46),(2.12,-.96,2.97),(3.08,-.96,2.46),(1.16,2.18,2.46),(2.12,2.18,2.97),(3.08,2.18,2.46)],[(0,3,4,1),(1,4,5,2)])
 for x,z in [(1.16,2.46),(2.12,2.97),(3.08,2.46)]:b.rod('Cream',(x,-.98,z),(x,2.20,z),.05)
 for z in [1.18,1.80]:b.rod('Cream',(3.08,-.96,z),(3.08,2.18,z),.035)
 # Communal garden bench and two inhabitants.
 b.bench(1.72,-2.45,.35,1.8);b.person(1.35,-2.64,.5208,.68,'Blue',True);b.person(2.13,-2.64,.5271,.66,'Rose',True)
 b.cyl('Wood',(-2.73,-2.10,.73),.44,.10,28);b.cyl('Forest',(-2.73,-2.10,.55),.05,.34,12);b.book(-2.85,-2.10,.80,.17,.1,'Coral')
 for x,y in [(-3.25,-1),(-3.1,2.3),(3.3,-1.2),(3.1,2.6)]:b.plant(x,y,.34,1)
 b.roundbox('Stone Light',(-.2,-2.8,.38),(1.6,.35,.07),.12,3)
 return b.finish('care-cottage')

def learning():
 reset();b=B();palette(b);plinth(b,'LEARNING GARDEN')
 # Reading house with a large open book as its folded roof. Pages layered along eaves.
 b.roundbox('Wood',(-.65,.7,.51),(5.1,3.3,.25),.2,4)
 # Genuine open front with a back wall, side wing and slim columns.
 # Walls and posts reach the curved roof instead of ending below it.
 roof_height=lambda x:3.2+.45*(abs(x+.65)/2.6)**1.45
 outline=[(-3.05,.565),(1.75,.565)]+[(1.75-i*4.8/32,roof_height(1.75-i*4.8/32))for i in range(33)]
 n=len(outline);verts=[(x,y,z)for y in [2.06,2.24]for x,z in outline]
 b.geom('Ivory',verts,[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n)for i in range(n)])
 top=roof_height(-2.96);b.roundbox('Ivory',(-2.96,.7,(top+.565)/2),(.18,3.0,top-.565),.06,3)
 for x in [-2.95,1.65]:
  top=roof_height(x);bottom=.605;b.cyl('Forest',(x,-.82,(top+bottom)/2),.08,top-bottom,16);b.cyl('Gold',(x,-.82,.65),.13,.20,14)
 b.tube('Forest',[(x,-.82,roof_height(x)-.07)for x in [-2.95+i*4.60/32 for i in range(33)]],.07,10)
 # Sweeping book cross-section: high outer covers and soft valley at spine.
 cx=-.65
 def zz(x):return 3.2+.45*(abs(x)/2.6)**1.45
 for layer in range(6):
  zoff=layer*.055;mat='Paper'if layer<5 else'Coral';verts=[]
  for y in [-1.08,2.38]:
   for i in range(33):
    x=-2.6+i*5.2/32;verts.append((cx+x,y,zz(x)+zoff))
  b.geom(mat,verts,[(i,i+1,33+i+1,33+i)for i in range(32)])
  # Each paper leaf has a thin rounded edge that reads at close range.
  for y in [-1.1,2.40]:b.tube(mat,[(cx-2.6+i*5.2/32,y,zz(-2.6+i*5.2/32)+zoff)for i in range(33)],.018,6)
 for side in [-1,1]:b.rod('Coral',(cx+side*2.65,-1.12,3.93),(cx+side*2.65,2.43,3.93),.07,12)
 # Book spine; covers, crease and bookmark ribbon.
 b.rod('Coral',(cx,-1.13,3.48),(cx,2.44,3.48),.12,20)
 b.geom('Gold',[(cx-.09,-1.14,3.52),(cx+.09,-1.14,3.52),(cx+.09,-1.25,2.75),(cx, -1.25,2.85),(cx-.09,-1.25,2.75)],[(0,1,2,3,4)])
 # Back shelves with many visible individual books.
 for sx in [-1.9,.35]:
  b.roundbox('Wood',(sx,1.97,1.56),(1.85,.28,1.7),.04,2)
  for z in [.82,1.33,1.86]:b.box('Cream',(sx,1.76,z),(1.79,.40,.08))
  for row in range(3):
   for j in range(9):b.book(sx-.74+j*.18,1.70,.88+row*.51,.13,.30+(j%3)*.045,['Coral','Blue','Forest','Gold'][j%4])
 # An alphabet banner suspended over the front and inset circular windows.
 for i,ch in enumerate('READ'):
  x=-1.55+i*.61;b.roundbox(['Coral','Blue','Forest','Gold'][i],(x,-.95,2.68),(.48,.1,.48),.08,3);b.text('Ivory',ch,(x,-1.011,2.53),.33)
 b.cyl('Forest',(-3.08,.60,1.93),.48,.09,40,axis='X');b.cyl('Glass',(-3.14,.60,1.93),.39,.08,40,axis='X')
 # Low circular reading table with three books and children on colorful stools.
 b.cyl('Wood',(-.65,.15,1.03),.78,.13,40);b.cyl('Forest',(-.65,.15,.76),.08,.48,12)
 for x,y,c in [(-1.68,-.05,'Coral'),(.38,.03,'Blue'),(-.66,-.77,'Gold')]:
  b.cyl(c,(x,y,.65),.25,.30,20);b.person(x,y-.18,.630,.55,c,True,True)
 b.roundbox('Paper',(-.65,.15,1.12),(.43,.35,.035),.025,2);b.box('Coral',(-.65,.15,1.15),(.02,.34,.012))
 b.person(-2.20,-.45,.63,.88,'Rose')
 # Slide: sculpted chute with raised lips and a real ladder.
 x,y=2.55,.4
 b.roundbox('Blue',(x,y,1.60),(1.05,.95,.12),.09,3)
 for xx in [x-.42,x+.42]:
  b.rod('Forest',(xx,y-.3,.35),(xx,y-.3,1.59),.05);b.rod('Forest',(xx,y+.3,.35),(xx,y+.3,2.02),.05)
  b.rod('Forest',(xx,y-.33,1.66),(xx,y-.33,2.03),.035)
 for z in [.55,.84,1.12,1.40]:b.rod('Wood',(x-.42,y+.36,z),(x+.42,y+.36,z),.055)
 pts=[(x,y-.40,1.65),(x,y-.73,1.62),(x,y-1.1,1.35),(x,y-1.50,.76),(x,y-1.9,.47),(x,y-2.2,.43)]
 verts=[]
 for xx in [-.43,.43]:verts.extend([(px+xx,py,pz)for px,py,pz in pts])
 b.geom('Gold',verts,[(i,i+1,6+i+1,6+i)for i in range(5)])
 for side in [-1,1]:b.tube('Clay Light',[(px+side*.43,py,pz+.11)for px,py,pz in pts],.06,10)
 b.person(2.55,.47,1.68,.48,'Coral')
 # Alphabet blocks and a tiny planted edge.
 for x,y,c,ch in [(-2.6,-2.1,'Blue','A'),(-1.8,-2.65,'Gold','B'),(-.9,-2.20,'Coral','C')]:
  b.roundbox(c,(x,y,.71),(.63,.63,.65),.08,3);b.roundbox('Ivory',(x,y-.329,.71),(.48,.03,.49),.04,2);b.text(c,ch,(x,y-.35,.53),.39)
 for x,y in [(3.4,2.3),(-3.4,2.55),(3.35,-2.4)]:b.plant(x,y,.35,.8)
 for i in range(9):
  x=-2.9+i*.65;b.roundbox('Cream',(x,3,.68),(.10,.14,.67),.035,2)
 b.roundbox('Wood',(-.3,3,.65),(5.5,.09,.1),.03,2)
 return b.finish('learning-garden')

def preview(name,objects):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32
 scene.render.resolution_x=1200;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
 scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.72,.77,.72,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.035));o=bpy.context.object;m=bpy.data.materials.new('Studio Floor');m.diffuse_color=(.68,.72,.63,1);o.data.materials.append(m)
 bpy.ops.object.light_add(type='AREA',location=(-8,-10,16));bpy.context.object.data.energy=1600;bpy.context.object.data.size=9
 bpy.ops.object.light_add(type='AREA',location=(8,2,8));bpy.context.object.data.energy=1000;bpy.context.object.data.size=8
 bpy.ops.object.camera_add(location=(10,-14,11));cam=bpy.context.object;target=Vector((0,0,1.8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.1;scene.camera=cam
 scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,name+'-preview.png');bpy.ops.render.render(write_still=True);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,name+'.blend'))
if __name__=='__main__':
 os.makedirs(helpers.OUT,exist_ok=True)
 for name,fn in [('civic-hall',civic),('care-cottage',cottage),('learning-garden',learning)]:
  objects=fn();preview(name,objects)
