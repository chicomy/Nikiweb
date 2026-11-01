// Ground-plane rectangles use Three.js's Y-rotation convention.
export function containsPoint(rect,x,z,padding=0){
  const a=rect.rotation||0,c=Math.cos(a),s=Math.sin(a),dx=x-rect.x,dz=z-rect.z;
  return Math.abs(dx*c-dz*s)<rect.w/2+padding&&Math.abs(dx*s+dz*c)<rect.d/2+padding;
}

export function footprintsOverlap(a,b,padding=0){
  const axes=r=>{const t=r.rotation||0;return [[Math.cos(t),-Math.sin(t)],[Math.sin(t),Math.cos(t)]];};
  const aa=axes(a),bb=axes(b),dx=b.x-a.x,dz=b.z-a.z;
  for(const [x,z] of [...aa,...bb]){
    const radius=(r,ax)=>(r.w/2+padding/2)*Math.abs(ax[0][0]*x+ax[0][1]*z)+(r.d/2+padding/2)*Math.abs(ax[1][0]*x+ax[1][1]*z);
    if(Math.abs(dx*x+dz*z)>=radius(a,aa)+radius(b,bb))return false;
  }
  return true;
}
