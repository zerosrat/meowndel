import * as THREE from 'three';
import {attachWhiteStudy} from './white-study';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

function release(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>(), materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  const bitmaps = new Set<ImageBitmap>();
  textures.forEach(texture => {
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) bitmaps.add(texture.image);
    texture.dispose();
  });
  bitmaps.forEach(bitmap => bitmap.close()); materials.forEach(material => material.dispose());
}
export function createComparisonScene(canvas: HTMLCanvasElement, host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,1,.01,100);
  const controls=new OrbitControls(camera,canvas);
  controls.enablePan=false; controls.minDistance=4; controls.maxDistance=10;
  const whiteLevel={value:0};
  let dead=false, generation=0, current: THREE.Object3D|undefined;
  const render=()=>{if(!dead)renderer.render(scene,camera);};
  controls.addEventListener('change',render);
  const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment(), env=pmrem.fromScene(room,.04);
  scene.environment=env.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfffaf0,0xa5a195,1.4));
  const light=new THREE.DirectionalLight(0xfff8eb,2.4);light.position.set(-3,5,5);scene.add(light);
  function angle(value:number){
    value-=Math.PI/12;camera.position.set(Math.sin(value)*6.1,1.7,Math.cos(value)*6.1);
    controls.target.set(0,1.35,0);controls.update();render();
  }
  const resize=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render();});
  resize.observe(host);angle(0);
  return {
    angle,
    setWhiteLevel(value:number){
      if(!current)return;
      whiteLevel.value=Math.max(0,Math.min(4,value));
      current.traverse(object=>{if(object instanceof THREE.Mesh){for(const material of Array.isArray(object.material)?object.material:[object.material])attachWhiteStudy(material,whiteLevel);}});
      render();
    },
    async replaceMaterial(url: string) {
      const ticket=++generation;
      const gltf=await new GLTFLoader().loadAsync(url);
      const material: THREE.Material=await gltf.parser.getDependency('material',0);
      const holder=new THREE.Mesh(new THREE.BufferGeometry(),material);
      if(dead||ticket!==generation||!current){release(holder);return false;}
      const old=new Set<THREE.Material>();
      current.traverse(object=>{if(object instanceof THREE.Mesh){
        for(const m of Array.isArray(object.material)?object.material:[object.material])old.add(m);
        object.material=material;
      }});
      for(const m of old)release(new THREE.Mesh(new THREE.BufferGeometry(),m));
      holder.geometry.dispose();render();return true;
    },
    async load(url:string, rotationY=0, style?: {flatShading:boolean;roughness:number}) {
      const ticket=++generation;
      if(current){scene.remove(current);release(current);current=undefined;}render();
      const started=performance.now();
      const gltf=await new GLTFLoader().loadAsync(url);
      if(dead||ticket!==generation){release(gltf.scene);return null;}
      current=gltf.scene;
      if(style)current.traverse(object=>{
        if(!(object instanceof THREE.Mesh))return;
        for(const material of Array.isArray(object.material)?object.material:[object.material]){
          if(material instanceof THREE.MeshStandardMaterial){material.flatShading=style.flatShading;material.roughness=style.roughness;material.needsUpdate=true;}
        }
      });
      current.rotation.y+=rotationY;
      const box=new THREE.Box3().setFromObject(current), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3()), scale=2.7/size.y;
      current.scale.setScalar(scale);current.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);scene.add(current);angle(0);
      // Render synchronously before reading the canvas; no permanent drawing-buffer retention.
      renderer.render(scene,camera);
      const thumbnail=canvas.toDataURL('image/png');
      return {thumbnail, milliseconds:Math.round(performance.now()-started), triangles:renderer.info.render.triangles};
    },
    dispose(){if(dead)return;dead=true;generation++;resize.disconnect();controls.dispose();if(current)release(current);env.dispose();renderer.dispose();renderer.forceContextLoss();},
  };
}
