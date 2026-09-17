import { useEffect, useRef } from 'react';
import { fragmentShader, vertexShader } from './contactFlowShader';
import './ContactFlow.css';

export default function ContactFlow() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const host = canvas.parentElement;
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return;
    const program = gl.createProgram();
    const shaders = [];
    for (const [type, source] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);gl.compileShader(shader);shaders.push(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Contact flow shader:', gl.getShaderInfoLog(shader));
        shaders.forEach(item => gl.deleteShader(item));gl.deleteProgram(program);return;
      }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach(item => gl.deleteShader(item));gl.deleteProgram(program);return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const resolution = gl.getUniformLocation(program,'resolution');
    const time = gl.getUniformLocation(program,'time');
    const points = gl.getUniformLocation(program,'trail[0]');
    const data = new Float32Array(96);
    const history = Array.from({length:24},()=>({x:-5,y:-5,energy:0}));
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let width=1,height=1,frame=0,last=0,elapsed=12,visible=false,lost=false,pointer=null,lastMove=0;
    const draw = (dt=0) => {
      elapsed+=dt;
      const active=pointer && !reduced.matches && performance.now()-lastMove<100;
      const head=history[0];
      const movement=active?Math.hypot(pointer.x-head.x,pointer.y-head.y):0;
      history.pop();history.unshift({
        x:active?head.x+(pointer.x-head.x)*.5:head.x+dt*.03,
        y:active?head.y+(pointer.y-head.y)*.5:head.y,
        energy:active?Math.min(1,head.energy*.94+movement*14+.015):head.energy*.9,
      });
      history.forEach((p,i)=>{p.energy*=.985;data.set([p.x,p.y,i/23,reduced.matches?0:p.energy],i*4);});
      gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(time,elapsed);gl.uniform4fv(points,data);
      gl.drawArrays(gl.TRIANGLES,0,3);
    };
    const tick = now => {
      if(now-last>=1000/45){draw(Math.min((now-last)/1000,.05));last=now;}
      frame=requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);frame=0;
      if(lost)return;
      if(visible && !document.hidden && !reduced.matches){last=performance.now();frame=requestAnimationFrame(tick);}
      else draw();
    };
    const resize=new ResizeObserver(()=>{
      width=host.clientWidth;height=host.clientHeight;
      const ratio=Math.min(devicePixelRatio||1,1,Math.sqrt(750000/(width*height)));
      canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
      gl.viewport(0,0,canvas.width,canvas.height);if(!lost)draw();
    });resize.observe(host);
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});observer.observe(host);
    const move=event=>{
      if(event.pointerType!=='mouse'||reduced.matches)return;
      const rect=host.getBoundingClientRect();
      const next={x:(event.clientX-rect.left)/height,y:1-(event.clientY-rect.top)/height};
      if(!pointer)history.forEach(p=>{p.x=next.x;p.y=next.y;p.energy=0;});
      pointer=next;lastMove=performance.now();
    };
    const leave=()=>{pointer=null;};
    const contextLost=event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);};
    host.addEventListener('pointermove',move,{passive:true});host.addEventListener('pointerleave',leave);
    document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
    canvas.addEventListener('webglcontextlost',contextLost);
    return()=>{
      cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();
      host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);
      document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);
      canvas.removeEventListener('webglcontextlost',contextLost);
      gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(shader=>gl.deleteShader(shader));
    };
  },[]);
  return <canvas ref={ref} data-contact-flow="" data-audio-decoration="" aria-hidden="true" className="contact-flow" />;
}
