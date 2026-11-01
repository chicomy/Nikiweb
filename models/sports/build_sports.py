"""Three independent Blender sports landmarks. Each has a centered base and separate content identity."""
import bpy, math, os, importlib.util
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
spec=importlib.util.spec_from_file_location('landmark_builder',os.path.join(ROOT,'../palo-alto/build_landmarks.py'))
lib=importlib.util.module_from_spec(spec);spec.loader.exec_module(lib);lib.ROOT=ROOT
b=None
def init():
 global b
 lib.reset();b=lib.Builder()
 for n,c in {'Lawn':(.26,.44,.20),'Putting Turf':(.12,.33,.20),'Fairway':(.32,.53,.25),'Court Clay':(.56,.26,.14),'Paint':(.16,.29,.26),'Ivory':(.91,.87,.72),'White':(.96,.96,.90),'Steel':(.11,.19,.18),'Orange':(.87,.29,.07),'Sand':(.73,.60,.35),'Wood':(.46,.29,.14),'Trim':(.62,.66,.53),'Glass':(.53,.69,.67),'Bag':(.63,.24,.20),'Metal':(.48,.54,.52),'Ball':(.93,.92,.82)}.items():b.material(n,c,rough=.75,metal=.5 if n=='Metal' else 0)

def tube(mat,points,r=.02,n=8):
 v=[]
 for i,p in enumerate(points):
  tangent=Vector(points[min(len(points)-1,i+1)])-Vector(points[max(0,i-1)])
  tangent.normalize();axis=tangent.cross(Vector((0,0,1)))
  if axis.length<.01:axis=tangent.cross(Vector((0,1,0)))
  axis.normalize();other=tangent.cross(axis)
  for j in range(n):v.append(tuple(Vector(p)+r*(axis*math.cos(j*math.tau/n)+other*math.sin(j*math.tau/n))))
 b.geom(mat,v,[(i*n+j,i*n+(j+1)%n,(i+1)*n+(j+1)%n,(i+1)*n+j)for i in range(len(points)-1)for j in range(n)])
def ring(mat,x,y,z,r,t=.02,start=0,end=math.tau):
 first=len(b.data[mat][0])
 tube(mat,[(x+r*math.cos(a),y+r*math.sin(a),z)for a in [start+(end-start)*i/64 for i in range(65)]],t)
 if mat=='Ivory' and z<.5:
  # Court paint is flat, not a raised tubular curb beneath the players' feet.
  for i in range(first,len(b.data[mat][0])):
   xx,yy,zz=b.data[mat][0][i];b.data[mat][0][i]=(xx,yy,z+(zz-z)*.17)
def stripe(x1,y1,x2,y2,z=.325,w=.025):tube('Ivory',[(x1,y1,z),(x2,y2,z)],w,6)
def bench(x,y,angle=0):
 def pos(xx,yy,z):return(x+xx*math.cos(angle)-yy*math.sin(angle),y+xx*math.sin(angle)+yy*math.cos(angle),z)
 for dy in [-.16,0,.16]:b.box('Wood',pos(0,dy,.65),(1.35,.13,.065),angle)
 for xx in [-.52,.52]:b.box('Steel',pos(xx,0,.44),(.07,.44,.42),angle)
 for zz in [.90,1.06]:b.box('Wood',pos(0,.21,zz),(1.35,.07,.12),angle)


def recenter(cx,cy):
 for verts,faces in b.data.values():
  for i,(x,y,z) in enumerate(verts):verts[i]=(x-cx,y-cy,z)
 for obj in bpy.context.scene.objects:
  if obj.type=='FONT':obj.location.x-=cx;obj.location.y-=cy

def finish(name,cx,cy,kind):
 recenter(cx,cy);objects=b.finish(name)
 import json
 metadata_path=os.path.join(ROOT,name+'-metadata.json');metadata=json.load(open(metadata_path))
 metadata['sport']=kind;metadata['original_to_gltf_offset']=[-cx,0,cy]
 with open(metadata_path,'w') as f:json.dump(metadata,f,indent=2)
 return objects

def basketball():
 init()
 b.box('Trim',(-2.75,1.125,.1),(6.7,6.55,.2));b.box('Lawn',(-2.75,1.125,.23),(6.48,6.33,.10))
 # One true half-court. The former foreground half remains lawn. The front line
 # leaves clearance for the existing dribbler and ball without changing motion.
 cx=-2.75;court_front=-1.85;court_back=3.825;line_front=-1.60;line_back=3.55
 b.box('Court Clay',(cx,(court_front+court_back)/2,.30),(5.2,court_back-court_front,.05))
 b.box('Paint',(cx,2.45,.332),(1.65,1.95,.012))
 for x in [cx-2.35,cx+2.35]:stripe(x,line_front,x,line_back)
 for y in [line_front,line_back]:stripe(cx-2.35,y,cx+2.35,y)
 # Half of the center circle sits inside the new front boundary; no mid-court line.
 ring('Ivory',cx,line_front,.342,.66,.017,0,math.pi)
 for sign in [1]:
  for x in [cx-.82,cx+.82]:stripe(x,sign*3.55,x,sign*1.47)
  stripe(cx-.82,sign*1.47,cx+.82,sign*1.47)
  ring('Ivory',cx,sign*1.47,.343,.82,.017,0 if sign<0 else math.pi,math.pi if sign<0 else math.tau)
  ring('Ivory',cx,sign*2.65,.344,1.95,.017,0 if sign<0 else math.pi,math.pi if sign<0 else math.tau)
  for x in [cx-1.95,cx+1.95]:stripe(x,2.65,x,line_back)
  # Weighted stanchion, padded support, glass backboard, rim, woven basket net.
  y=sign*3.4;b.box('Steel',(cx,y,.42),(.65,.58,.18));b.cyl('Steel',(cx,y,1.56),.075,2.3,12)
  b.box('Glass',(cx,y-sign*.12,2.69),(1.18,.07,.72))
  for x in [cx-.61,cx+.61]:b.box('White',(x,y-sign*.17,2.69),(.04,.04,.76))
  for zz in [2.31,3.07]:b.box('White',(cx,y-sign*.17,zz),(1.26,.04,.04))
  for x in [cx-.22,cx+.22]:b.box('White',(x,y-sign*.19,2.64),(.025,.025,.29))
  for zz in [2.49,2.79]:b.box('White',(cx,y-sign*.19,zz),(.46,.025,.025))
  hy=y-sign*.47;ring('Orange',cx,hy,2.48,.29,.031)
  for i in range(12):
   a=i*math.tau/12
   for direction in [-1,1]:tube('White',[(cx+(.28-.06*t)*math.cos(a+direction*t*.65),hy+(.28-.06*t)*math.sin(a+direction*t*.65),2.46-t*.40)for t in [j/7 for j in range(8)]],.009,5)
  ring('White',cx,hy,2.06,.22,.010)
 bench(-5.60,0,math.pi/2)
 for x,y in [(-5.6,-1.9),(-5.4,3.85)]:
  b.cyl('Steel',(x,y,1.65),.055,2.7,10);b.box('Steel',(x,y,3.04),(.60,.22,.14));b.box('Ivory',(x,y-.10,3.0),(.51,.035,.08))
 # Low rail around the rear of the court; its openings keep the little athletes visible.
 for x in [-5.4,-4.5,-3.6,-2.7,-1.8,-.9,-.1]:b.cyl('Steel',(x,4.05,.76),.026,.88,8)
 for z in [.45,.90,1.15]:tube('Steel',[(-5.4,4.05,z),(-.1,4.05,z)],.018)
 b.text('Steel','BASKETBALL',(-2.75,-2.15,.13),.25)
 return finish('basketball-court',-2.75,1.125,'basketball')

def golf():
 init()
 b.box('Trim',(3.15,0,.1),(5.7,8.3,.2));b.box('Lawn',(3.15,0,.23),(5.48,8.08,.10))
 # Gently sculpted putting lawn: layered perimeter, sand bunker and a single playable hole.
 b.ellipse('Fairway',(3.05,0,.315),2.42,3.75,.09,72)
 b.ellipse('Putting Turf',(3.02,.10,.377),2.05,3.28,.06,72)
 b.ellipse('Ivory',(4.05,-1.75,.413),.81,1.17,.035,48)
 b.ellipse('Sand',(4.05,-1.75,.435),.70,1.04,.025,48)
 for i in range(5):tube('Trim',[(3.66+j*.09,-2.2+i*.2+.05*math.sin(j),.454)for j in range(10)],.008,5)
 # Blender +Y exports to glTF -Z, the hole is behind the golfer.
 hole=(2.75,2.35)
 b.cyl('Steel',(*hole,.422),.17,.015,32);b.cyl('White',(*hole,1.26),.023,1.65,10)
 b.geom('Orange',[(hole[0],hole[1],1.9),(hole[0]+.65,hole[1]-.035,1.77),(hole[0]+.65,hole[1]-.035,1.43),(hole[0],hole[1],1.55)],[(0,1,2,3)])
 # A stitched golf bag, clustered clubs and an extra rack of balls.
 bx,by=4.75,1.45
 b.cyl('Bag',(bx,by,.85),.24,.88,24,r2=.29)
 for z in [.48,1.16]:ring('Ivory',bx,by,z,.25,.025)
 b.box('Bag',(bx,by-.24,.75),(.30,.12,.35));tube('Ivory',[(bx+.26,by,1.1),(bx+.4,by,.9),(bx+.26,by,.66)],.024)
 for i in range(5):
  xx=bx+(i%3-1)*.13;yy=by+(i//3-.5)*.17
  tube('Metal',[(xx,yy,1.05),(xx+.08,yy,1.7+(i%2)*.17)],.018)
  b.box('Steel',(xx+.15,yy,1.73+(i%2)*.17),(.22,.10,.10),.2)
 for i in range(3):b.sphere('Ball',(4.7+i*.13,.78,.49),.058,n=12,rings=8)
 bench(4.7,-3.4)
 x,y=5.4,3.8
 b.cyl('Steel',(x,y,1.65),.055,2.7,10);b.box('Steel',(x,y,3.04),(.60,.22,.14));b.box('Ivory',(x,y-.10,3.0),(.51,.035,.08))
 b.text('Steel','GOLF / FIRST TEE',(3.15,-4.15,.13),.24)
 return finish('golf-green',3.15,0,'golf')

def football():
 init()
 b.material('Jersey Blue',(.10,.27,.37));b.material('Jersey Coral',(.64,.19,.10));b.material('Skin',(.68,.43,.27));b.material('Hair',(.09,.065,.045))
 b.box('Trim',(0,0,.10),(8.2,5.5,.20));b.box('Lawn',(0,0,.23),(7.98,5.28,.10))
 for i in range(10):b.box('Fairway'if i%2 else'Putting Turf',(-3.24+i*.72,0,.305),(.72,4.40,.05))
 for x in [-3.50,3.50]:stripe(x,-2.12,x,2.12,.338,.018)
 for y in [-2.12,2.12]:stripe(-3.50,y,3.50,y,.338,.018)
 stripe(0,-2.12,0,2.12,.339,.018);ring('Ivory',0,0,.340,.66,.018)
 b.cyl('Ivory',(0,0,.342),.055,.012,12)
 for side in [-1,1]:
  for yy in [-1.25,1.25]:stripe(side*3.50,yy,side*2.27,yy,.34,.018)
  stripe(side*2.27,-1.25,side*2.27,1.25,.34,.018)
  for yy in [-.65,.65]:stripe(side*3.50,yy,side*2.92,yy,.34,.018)
  stripe(side*2.92,-.65,side*2.92,.65,.34,.018)
  # Framed goals with clear net interiors and an inset back mesh.
  x=side*3.5;back=side*3.91
  for yy in [-.83,.83]:
   tube('White',[(x,yy,.35),(x,yy,1.55)],.045,10);tube('White',[(x,yy,1.55),(back,yy,1.35),(back,yy,.35)],.035,8);tube('White',[(x,yy,.35),(back,yy,.35)],.025,8)
  tube('White',[(x,-.83,1.55),(x,.83,1.55)],.045,10)
  for yy in [j*.16-.8 for j in range(11)]:tube('Ivory',[(x,yy,1.53),(back,yy,1.33),(back,yy,.35)],.008,5)
  for zz in [.38+j*.14 for j in range(8)]:tube('Ivory',[(back,-.83,zz),(back,.83,zz)],.008,5)
  for yy in [-.83,.83]:
   for zz in [.38+j*.14 for j in range(8)]:tube('Ivory',[(x,yy,zz),(back,yy,zz)],.008,5)
 # Original static miniature players; these are a separate football destination.
 def person(x,y,shirt,angle=0):
  def at(xx,yy,z):return(x+xx*math.cos(angle)-yy*math.sin(angle),y+xx*math.sin(angle)+yy*math.cos(angle),z)
  for side in [-1,1]:
   b.box('Steel',at(side*.11,-.035,.414),(.14,.23,.12),angle);b.cyl('Skin',at(side*.11,0,.64),.055,.37,12)
  b.box(shirt,at(0,0,.87),(.38,.22,.30),angle);b.box('White',at(0,0,.72),(.39,.23,.07),angle)
  b.sphere('Skin',at(0,0,1.22),.17,n=16,rings=10);b.sphere('Hair',at(0,.018,1.30),.17,scale=(1,1,.55),n=16,rings=10)
  for side in [-1,1]:tube(shirt,[at(side*.23,0,.98),at(side*.31,-.04,.82)],.065,8);b.sphere('Skin',at(side*.31,-.04,.80),.06,n=10,rings=8)
 person(-.75,.32,'Jersey Blue',-.45);person(.75,-.65,'Jersey Coral',2.1);person(2.88,.03,'Jersey Blue',math.pi/2)
 b.sphere('White',(0,-.30,.495),.12,n=24,rings=16)
 for angle in [0,math.pi/2,math.pi]:
  tube('Steel',[(.121*math.cos(t),-.30+.121*math.sin(t)*math.cos(angle),.495+.121*math.sin(t)*math.sin(angle))for t in [j*math.tau/40 for j in range(41)]],.008,5)
 for x in [-3.44,3.44]:
  for y in [-2.08,2.08]:b.cyl('White',(x,y,.65),.014,.60,8);b.geom('Orange',[(x,y,.94),(x+.20,y,.86),(x,y,.79)],[(0,1,2)])
 b.text('Steel','FOOTBALL',(0,-2.75,.13),.25)
 return finish('football-pitch',0,0,'football')

def preview(name,objects):
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
 scene.render.resolution_x=1300;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
 scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.74,.79,.73,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.6
 bpy.ops.object.light_add(type='AREA',location=(-8,-10,16));bpy.context.object.data.energy=2100;bpy.context.object.data.size=9
 bpy.ops.object.camera_add(location=(10,-14,15));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.7))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.3 if name=='golf-green' else 10.2;scene.camera=cam
 scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(ROOT,name+'-preview.png')
 bpy.ops.render.render(write_still=True);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,name+'.blend'))

if __name__=='__main__':
 import sys
 selected=sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else[]
 for name,fn in [('basketball-court',basketball),('golf-green',golf),('football-pitch',football)]:
  if not selected or name in selected:preview(name,fn())
