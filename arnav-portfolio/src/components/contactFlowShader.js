// Original procedural shader: drifting red silk with a deformable liquid wake.
export const vertexShader = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.,1.);}
`;
export const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec4 trail[24];
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
 vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
void main(){
 vec2 uv=gl_FragCoord.xy/resolution;
 vec2 p=vec2(uv.x*resolution.x/resolution.y,uv.y);
 float nearest=100.,age=1.,side=0.,energy=0.;
 // Distance to a continuous, widening wake avoids separate circles/particles.
 for(int i=0;i<23;i++){
  vec4 a=trail[i],b=trail[i+1];vec2 ab=b.xy-a.xy;
  float t=clamp(dot(p-a.xy,ab)/max(dot(ab,ab),.000001),0.,1.);
  vec2 delta=p-(a.xy+ab*t);
  float life=(float(i)+t)/23.;
  float radius=.012+pow(sin(life*3.14159),.8)*.085;
  float d=length(delta)/radius;
  if(d<nearest && min(a.w,b.w)>.005){
   nearest=d;age=life;energy=min(a.w,b.w);
   side=(delta.x*ab.y-delta.y*ab.x)/max(length(ab)*radius,.000001);
  }
 }
 float influence=exp(-nearest*nearest*.18)*energy;
 vec2 q=p+vec2(sin(age*5.+side)*.018,side*.10)*influence;
 vec3 color=vec3(0.);
 for(int i=0;i<5;i++){
  float fi=float(i);
  float direction=mod(fi,2.)<.5?1.:-1.;
  float x=q.x+time*.19*direction+fi*3.7;
  float center=.22+fi*.045;
  if(i==3)center=.49;
  if(i==4)center=.43;
  center+=(noise(vec2(x*.8,fi*4.2))-.5)*.035;
  float width=.006+noise(vec2(x*1.4,fi*7.))*.010;
  float d=(q.y-center)/width;
  // Broad lit bands and softer trailing edges move even with no pointer.
  float segment=smoothstep(.28,.65,noise(vec2(x*1.25,fi*6.1)));
  float silk=exp(-d*d*1.4)*segment;
  float halo=exp(-d*d*.13)*segment;
  float grain=.88+.12*noise(vec2(x*95.,q.y*450.));
  color+=vec3(.93,.001,.016)*silk*grain+vec3(.19,0.,.009)*halo;
 }
 float surface=exp(-pow(nearest,4.)*.85)*energy;
 float rim=exp(-pow((nearest-.87)*9.,2.))*energy;
 float normal=clamp(side,-1.,1.);
 float specular=pow(max(0.,1.-abs(normal+.3)),12.);
 vec3 tint=mix(vec3(.9,.06,.003),vec3(.45,0.,.44),smoothstep(.06,.85,age));
 color*=1.-surface*.95;
 color+=tint*surface*(.13+specular*.6);
 color+=tint*rim*.55*(1.-age);
 float head=length(p-trail[0].xy);
 vec3 hot=mix(vec3(1.,.65,.015),vec3(1.,.005,.5),.5+.5*sin(time*.8));
 color+=hot*exp(-head*head/.001)*trail[0].w*.4;
 color+=mix(hot,vec3(1.,.98,.65),.75)*exp(-head*head/.00007)*trail[0].w*1.8;
 float fade=smoothstep(0.,.09,uv.y)*smoothstep(1.,.92,uv.y);
 gl_FragColor=vec4(color*(.97+hash(gl_FragCoord.xy)*.06)*fade,1.);
}
`;
