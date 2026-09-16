import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const canvas=document.querySelector('canvas'), stage=document.querySelector('#stage'), status=document.querySelector('#status');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,1,.01,100);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=3;controls.maxDistance=10;controls.autoRotateSpeed=1;
controls.maxPolarAngle=Math.PI*.85;
const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xfffaf0,0xa5a195,1.4));
const light=new THREE.DirectionalLight(0xfff8eb,2.4);light.position.set(-3,5,5);scene.add(light);
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(128,128,10,128,128,125);
gradient.addColorStop(0,'rgba(80,62,35,.22)');gradient.addColorStop(1,'rgba(80,62,35,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.005;scene.add(shadow);
function view(angle){angle-=Math.PI/12;camera.position.set(Math.sin(angle)*5.8,1.9,Math.cos(angle)*5.8);controls.target.set(0,1.35,0);controls.update();}
view(0);
const resize=new ResizeObserver(()=>{const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();});resize.observe(stage);
const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{controls.update(clock.getDelta());renderer.render(scene,camera);});
const coatUniform={value:0}, whiteUniform={value:1}, stripeUniform={value:0};
const models=new Map();
let request=0;
function applyCoat(material){
 material.onBeforeCompile=shader=>{
  shader.uniforms.catCoat=coatUniform;
  shader.uniforms.catWhite=whiteUniform;shader.uniforms.catStripes=stripeUniform;
  shader.vertexShader='varying vec3 catWorldPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\ncatWorldPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader='uniform float catCoat; uniform float catWhite; uniform float catStripes; varying vec3 catWorldPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   if(catCoat > 0.5){
    vec3 c=diffuseColor.rgb;
    float hi=max(c.r,max(c.g,c.b)), lo=min(c.r,min(c.g,c.b));
    float saturation=(hi-lo)/max(hi,0.001);
    // Select orange pigment in linear RGB. This is a prototype, not a semantic mask.
    float warm=smoothstep(0.02,0.12,(c.r-c.g)/max(hi,0.001))*smoothstep(0.01,0.10,(c.g-c.b)/max(hi,0.001));
    float mask=warm*smoothstep(0.15,0.38,saturation)*smoothstep(0.015,0.065,hi);
    // Fixed landmarks belong only to this normalized, static cat mesh.
    float eyeA=length((catWorldPosition-vec3(-.562,2.019,.779))/vec3(.085,.105,.12));
    float eyeB=length((catWorldPosition-vec3(-.199,1.916,.790))/vec3(.085,.105,.12));
    float eyeProtection=(1.0-smoothstep(.85,1.20,min(eyeA,eyeB)))*(1.0-smoothstep(.18,.45,hi));
    mask*=1.0-eyeProtection;
    float luminance=dot(c,vec3(.2126,.7152,.0722));
    vec3 replacement=catCoat<1.5 ? mix(c,vec3(1.0,.82,.56)*sqrt(max(luminance,0.0)),.70) : vec3(.55,.40,.26)*pow(luminance,.75);
    diffuseColor.rgb=mix(c,replacement,mask);
    if(catCoat>2.5){
      vec3 p=catWorldPosition;
      // Continuous fields in normalized world coordinates: no UV seam crossings.
      float wave=sin(p.x*5.1+p.y*2.2+sin(p.z*4.0))*sin(p.z*4.2-p.y*3.1)+.3*sin(p.y*8.0+p.x*2.0);
      float patchMask=smoothstep(-.12,.12,wave);
      vec3 black=vec3(.025,.030,.033), orange=vec3(.72,.29,.065);
      vec3 base=catCoat<3.5?black:(catCoat<4.5?mix(black,orange,patchMask):vec3(.32,.23,.135));
      float bands=sin(p.y*27.0+p.z*7.0+2.5*sin(p.x*5.0+p.y*3.0));
      float stripe=smoothstep(.48,.73,bands);
      base*=1.0-catStripes*stripe*.62;
      float chest=1.0-length((p-vec3(-.23,.95,.60))/vec3(.48,.96,.46));
      float paws=(.22-p.y)*3.5;
      float face=1.0-length((p-vec3(-.40,1.83,.83))/vec3(.115,.28,.28));
      float field=max(chest,max(paws,face))+.075*wave;
      float threshold=catWhite<1.5?.06:(catWhite<2.5?-.38:-.90);
      float white=catWhite<.5?0.0:smoothstep(threshold-.035,threshold+.035,field);
      base=mix(base,vec3(.88,.83,.73),white);
      // Retain painted eyes, pink skin and fine dark facial features only.
      float pink=(1.0-smoothstep(.025,.09,abs(c.g-c.b)))*smoothstep(.10,.22,c.r-c.g);
      float faceDetails=(1.0-smoothstep(.035,.075,hi))*smoothstep(1.55,1.75,p.y)*smoothstep(.55,.70,p.z);
      float skinRegion=max(smoothstep(2.20,2.35,p.y),1.0-smoothstep(.07,.14,length(p-vec3(-.424,1.839,.946))));
      float eyeFeature=1.0-smoothstep(.72,.93,min(eyeA,eyeB));
      float noseFeature=1.0-smoothstep(.65,1.05,length((p-vec3(-.424,1.839,.946))/vec3(.075,.050,.075)));
      float protect=max(max(eyeFeature,noseFeature),max(pink*skinRegion,faceDetails));
      diffuseColor.rgb=mix(base,c,protect);
    }
   }
  `);
 };
 material.customProgramCacheKey=()=> 'tripo-coat-study-v2';
}
function selectButtons(group,value){document.querySelectorAll(`[data-${group}]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[group]===value)));}
function showModel(key,model){
 for(const m of models.values()) m.visible=false;
 model.visible=true;selectButtons('model',key);
 status.textContent=key==='light'?'轻量版 · 约 8 万面':'原始版 · 约 199 万面';
 document.querySelectorAll('button').forEach(b=>b.disabled=false);
}
async function loadModel(key){
 const ticket=++request;
 document.querySelector('#error').textContent='';
 if(models.has(key)){showModel(key,models.get(key));return;}
 document.querySelectorAll('[data-model]').forEach(b=>b.disabled=true);
 try{
  const gltf=await new GLTFLoader().loadAsync(key==='light'?'./cat-80k-2k.glb':'./cat-original-4k.glb',p=>{if(ticket===request)status.textContent=p.total?`正在载入猫咪… ${Math.round(p.loaded/p.total*100)}%`:'正在载入猫咪…';});
  const model=gltf.scene,box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=2.7/size.y;
  model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  model.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])applyCoat(m);});
  model.visible=false;scene.add(model);models.set(key,model);
  if(ticket===request)showModel(key,model);
 }catch(error){if(ticket!==request)return;status.textContent='模型未载入';document.querySelector('#error').textContent=' 请恢复本地模型文件后重试。';document.querySelectorAll('[data-model]').forEach(b=>b.disabled=false);console.error(error);}
}
document.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>loadModel(b.dataset.model));
document.querySelectorAll('[data-coat]').forEach(b=>b.onclick=()=>{coatUniform.value={original:0,cream:1,brown:2,tuxedo:3,calico:4,layered:5}[b.dataset.coat];selectButtons('coat',b.dataset.coat);document.querySelector('#white').disabled=coatUniform.value<3;document.querySelector('#stripes').disabled=coatUniform.value<3;stripeUniform.value=coatUniform.value===5?1:0;document.querySelector('#stripes').checked=!!stripeUniform.value;});
document.querySelector('#white').onchange=e=>whiteUniform.value=Number(e.target.value);
document.querySelector('#stripes').onchange=e=>stripeUniform.value=Number(e.target.checked);
loadModel('light');
const rotate=document.querySelector('#rotate');
function stop(){controls.autoRotate=false;rotate.setAttribute('aria-pressed','false');}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{stop();view({front:0,side:Math.PI/2,back:Math.PI}[b.dataset.view]);});
rotate.onclick=()=>{controls.autoRotate=!controls.autoRotate;rotate.setAttribute('aria-pressed',String(controls.autoRotate));};
document.querySelector('#reset').onclick=()=>{stop();view(0);};
