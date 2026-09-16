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
let spinning=false;
const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const delta=clock.getDelta();if(overview&&spinning){for(const model of models.values())if(model.visible)model.rotation.y+=delta*.35;}controls.update(delta);renderer.render(scene,camera);});
const sources={orange:'cat-80k-2k.glb',tabby:'cat-tabby-80k-2k.glb',tuxedo:'cat-tuxedo-80k-2k.glb',calico:'cat-calico-80k-2k.glb'};
const names={orange:'橘猫',tabby:'狸花',tuxedo:'黑白',calico:'三花',all:'四猫对比'};
const models=new Map(),pending=new Map();
let request=0,overview=false;
async function fetchModel(key){
 if(models.has(key))return models.get(key);
 if(pending.has(key))return pending.get(key);
 const promise=new GLTFLoader().loadAsync('./'+sources[key]).then(gltf=>{
  const mesh=gltf.scene,box=new THREE.Box3().setFromObject(mesh),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=2.7/size.y;
  mesh.scale.setScalar(scale);mesh.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
  const group=new THREE.Group();group.add(mesh);group.visible=false;scene.add(group);models.set(key,group);return group;
 }).finally(()=>pending.delete(key));
 pending.set(key,promise);return promise;
}
function fitOverview(){
 const grid=camera.aspect<1.3;
 Object.keys(sources).forEach((key,i)=>{const m=models.get(key);if(m)m.position.set(grid?(i%2-.5)*3:(i-1.5)*2.65,grid?(i<2?3.1:0):0,0);});
 const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 const distance=Math.max((grid?6.6:3.6)/(2*halfFov),(grid?6.2:12)/(2*halfFov*camera.aspect));
 const targetY=grid?2.9:1.3;
 controls.maxDistance=distance*1.6;camera.position.set(0,targetY+.6,distance);controls.target.set(0,targetY,0);controls.update();
 status.textContent=grid?'上排：橘猫 · 狸花　下排：黑白 · 三花':'左起：橘猫 · 狸花 · 黑白 · 三花';
}
async function selectCat(key){
 const ticket=++request;stop();
 document.querySelector('#error').textContent='';status.textContent='正在载入'+names[key]+'…';
 // Hide the previous cat while loading so labels never identify the wrong asset.
 for(const model of models.values())model.visible=false;
 document.querySelectorAll('[data-cat]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cat===key)));
 try{
  const keys=key==='all'?Object.keys(sources):[key];
  await Promise.all(keys.map(fetchModel));if(ticket!==request)return;
  const wasOverview=overview;overview=key==='all';
  for(const model of models.values())model.visible=false;
  keys.forEach((k,i)=>{const m=models.get(k);m.rotation.y=0;m.position.set(overview?(i-1.5)*2.65:0,0,0);m.visible=true;});
  shadow.visible=!overview;
  if(overview)fitOverview();else if(wasOverview){controls.maxDistance=10;view(0);}
  if(!overview)status.textContent=names[key]+' · 独立贴图样板';
  document.querySelectorAll('[data-view],#rotate,#reset').forEach(b=>b.disabled=false);
 }catch(error){if(ticket!==request)return;status.textContent=names[key]+'暂时未载入';document.querySelector('#error').textContent=' 请检查本地素材，点击花色可重试。';console.error(error);}
}
const overviewResize=new ResizeObserver(()=>{if(overview)fitOverview();});overviewResize.observe(stage);
const rotate=document.querySelector('#rotate');
function stop(){spinning=false;controls.autoRotate=false;rotate.setAttribute('aria-pressed','false');}
document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>selectCat(b.dataset.cat));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{
 stop();
 const angle={front:0,side:Math.PI/2,back:Math.PI}[b.dataset.view];
 if(overview){for(const m of models.values())m.rotation.y=-angle;fitOverview();}
 else{for(const m of models.values())m.rotation.y=0;view(angle);}
});
rotate.onclick=()=>{spinning=!spinning;controls.autoRotate=spinning&&!overview;rotate.setAttribute('aria-pressed',String(spinning));};
document.querySelector('#reset').onclick=()=>{stop();for(const m of models.values())m.rotation.y=0;if(overview)fitOverview();else view(0);};
selectCat('orange');
