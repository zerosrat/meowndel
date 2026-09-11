import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import modelUrl from "./assets/cat-fripouille-v2.glb?url";

export type StudyCoat = "tuxedo" | "black";
export const STUDY_COATS = {
  tuxedo: { label: "黑白", color: "#272d2b", white: 1, description: "白色胸口 · 四只白袜" },
  black: { label: "纯黑", color: "#272d2b", white: 0, description: "同一张脸 · 深色被毛" },
} as const;

export interface StudyStats { triangles: number; calls: number; geometries: number; }
export interface StudyScene {
  setCoat(coat: StudyCoat): void;
  turn(direction: number): void;
  reset(): void;
  pet(): void;
  zoom(direction: number): void;
  dispose(): void;
}

function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    geometries.add(o.geometry);
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) materials.add(m);
  });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => {
    for (const value of Object.values(m)) if (value instanceof THREE.Texture) textures.add(value);
    m.dispose();
  });
  textures.forEach(t => t.dispose());
}

export function createStudyScene(
  canvas: HTMLCanvasElement,
  onReady: (stats: StudyStats) => void,
  onError: () => void,
): StudyScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  const scene = new THREE.Scene();
  const environmentSource = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentSource, .06);
  scene.environment = environment.texture;
  scene.environmentIntensity = .45;
  environmentSource.dispose();
  pmrem.dispose();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
  camera.position.set(4.5, 3.2, 8.3);
  const controls = new OrbitControls(camera, canvas);
  canvas.style.touchAction = "pan-y";
  controls.target.set(0, 1.8, .65);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI * .25;
  controls.maxPolarAngle = Math.PI * .59;
  controls.update();
  controls.saveState();
  scene.add(new THREE.HemisphereLight(0xfffaf0, 0x7e8174, 1.1));
  const key = new THREE.DirectionalLight(0xfff8ed, 2.4);
  key.position.set(-3, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .1, far: 18 });
  key.shadow.bias = -.0003;
  key.shadow.normalBias = .025;
  key.shadow.radius = 5;
  key.shadow.blurSamples = 8;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff8ea, 1.3);
  rim.position.set(3, 4, -3);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd9e7f3, .8);
  fill.position.set(4, 2, 4);
  scene.add(fill);

  // Small procedural contact shadow: no HDR environment/remote textures.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(73,55,38,.30)");
  gradient.addColorStop(.5, "rgba(73,55,38,.12)");
  gradient.addColorStop(1, "rgba(73,55,38,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 4.9), new THREE.MeshBasicMaterial({
    map: shadowTexture, transparent: true, depthWrite: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, .012, 0);
  scene.add(shadow);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .10 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  let disposed = false;
  let failed = false;
  let coat: StudyCoat = "tuxedo";
  let model: THREE.Group | undefined;
  const frameSubject = () => {
    const close = Math.max(0, (camera.zoom-1)/.8);
    controls.target.set(0, 1.8+close*.85, .65+close*2.2);
    if (model) controls.target.applyQuaternion(model.quaternion);
  };
  let head: THREE.Object3D | undefined;
  let tail: THREE.Object3D | undefined;
  const headRest = new THREE.Quaternion();
  const tailRest = new THREE.Quaternion();
  const gestureRotation = new THREE.Quaternion();
  let idleAt = -Infinity;
  let petAt = -Infinity;
  let activeUntil = 0;
  const whiteUniform = { value: 1 };
  const highlightUniform = { value: 0 };
  let changedCoatAt = -Infinity;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = reduced.matches;
  const repaint = () => {
    const palette = STUDY_COATS[coat];
    whiteUniform.value = palette.white;
    model?.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!(m instanceof THREE.MeshStandardMaterial)) continue;
        if (m.name === "SHD_frip" || m.name === "CoatFuzz") m.color.set(0xffffff);
      }
    });
    canvas.dataset.coat = coat;
  };
  const render = (time: number) => {
    if (disposed || failed) return;
    if (head) {
      const elapsed = (time-petAt)/1000;
      const gesture = !reduceMotion && elapsed >= 0 && elapsed < 1.8 ? Math.sin(elapsed/1.8*Math.PI) : 0;
      gestureRotation.setFromEuler(new THREE.Euler(gesture*.035, gesture*-.10, gesture*.08));
      head.quaternion.copy(headRest).multiply(gestureRotation);
    }
    const idleElapsed = (time-idleAt)/1000;
    const breath = !reduceMotion && idleElapsed >= 0 && idleElapsed < 2.8 ? Math.sin(idleElapsed/2.8*Math.PI)**2 : 0;
    if (tail) tail.quaternion.copy(tailRest).multiply(gestureRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), breath*.07));
    const coatElapsed = (time-changedCoatAt)/1000;
    highlightUniform.value = !reduceMotion && coatElapsed >= 0 && coatElapsed < .75 ? Math.sin(coatElapsed/.75*Math.PI)*.12 : 0;
    controls.update();
    renderer.render(scene, camera);
    if (time >= activeUntil) renderer.setAnimationLoop(null);
  };
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1 || disposed) return;
    renderer.setSize(width, height, false);
    camera.aspect = width/height;
    // Frame the full cat in narrow tablet columns, not just the DOM.
    camera.fov = THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(17))*Math.max(1, 1.16/camera.aspect)));
    camera.updateProjectionMatrix();
    render(performance.now());
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  let inView = true;
  const syncLoop = () => renderer.setAnimationLoop(
    !disposed && !failed && !reduceMotion && !document.hidden && inView && performance.now() < activeUntil ? render : null,
  );
  const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncLoop(); });
  visibility.observe(canvas);
  const changeMotion = () => {
    reduceMotion = reduced.matches;
    controls.enableDamping = !reduceMotion;
    syncLoop();
    render(performance.now());
  };
  const changedView = () => {
    if (reduceMotion) renderer.render(scene, camera);
    else { activeUntil = Math.max(activeUntil, performance.now()+250); syncLoop(); }
  };
  controls.addEventListener("change", changedView);
  reduced.addEventListener("change", changeMotion);
  document.addEventListener("visibilitychange", syncLoop);
  const contextLost = (e: Event) => {
    e.preventDefault();
    failed = true;
    syncLoop();
    onError();
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  controls.enableDamping = !reduceMotion;
  resize();
  syncLoop();

  new GLTFLoader().load(modelUrl, gltf => {
    if (disposed) { disposeModel(gltf.scene); return; }
    model = gltf.scene;
    head = model.getObjectByName("HeadPivot");
    tail = model.getObjectByName("TailPivot");
    if (head) headRest.copy(head.quaternion);
    if (tail) tailRest.copy(tail.quaternion);
    model.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = o.name !== "CoatFuzz";
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!(m instanceof THREE.MeshStandardMaterial)) continue;
        m.vertexColors = false;
        if (m.map) m.map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        if (m.name === "SHD_eye") { m.roughness = .28; m.envMapIntensity = .65; }
        if (m.name === "SHD_frip" || m.name === "CoatFuzz") {
          m.roughness = .88;
          m.envMapIntensity = .55;
          m.onBeforeCompile = shader => {
            shader.uniforms.studyWhite = whiteUniform;
            shader.uniforms.studyHighlight = highlightUniform;
            shader.vertexShader = `varying vec3 studyPosition;\n${shader.vertexShader}`.replace(
              "#include <begin_vertex>", "#include <begin_vertex>\nstudyPosition = position;",
            );
            shader.fragmentShader = `uniform float studyWhite;\nuniform float studyHighlight;\nvarying vec3 studyPosition;\n${shader.fragmentShader}`.replace(
              "#include <map_fragment>",
              `#include <map_fragment>
              #ifdef USE_MAP
                vec3 original = diffuseColor.rgb;
                float warmMask = smoothstep(.08, .18, (original.r-original.b)/max(original.r,.001));
                float skinMask = smoothstep(.006, .035, original.b-original.g) * smoothstep(.025, .1, original.r-original.g);
                float whiteMask = 1.0-warmMask;
                float value = dot(original, vec3(.2126,.7152,.0722));
                // This individual's hand-directed facial blaze, not a genetic rule.
                float front = smoothstep(3.03,3.20,studyPosition.z);
                float muzzle = 1.0-smoothstep(.65,1.0,pow((studyPosition.x+.04)/.28,2.0)+pow((studyPosition.y-2.72)/.22,2.0));
                float blaze = (1.0-smoothstep(.035,.12,abs(studyPosition.x+.04)))*smoothstep(2.90,3.00,studyPosition.y)*(1.0-smoothstep(3.19,3.32,studyPosition.y));
                float facialWhite = max(muzzle,blaze)*front;
                float nose = (1.0-smoothstep(.6,1.0,pow((studyPosition.x+.048)/.085,2.0)+pow((studyPosition.y-2.75)/.09,2.0)))*smoothstep(3.34,3.365,studyPosition.z);
                vec3 darkFur = vec3(.82,.88,.92) * (.010 + value*.095);
                diffuseColor.rgb = mix(darkFur, original, whiteMask*studyWhite);
                diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.72,.70,.65)*(.65+value*.7),facialWhite*studyWhite);
                diffuseColor.rgb = mix(diffuseColor.rgb, original, max(skinMask,nose));
                diffuseColor.rgb += vec3(.12,.17,.08)*whiteMask*studyHighlight;
              #endif`,
            );
          };
          m.customProgramCacheKey = () => "fripouille-coat-v2";
          m.needsUpdate = true;
        }
        m.needsUpdate = true;
      }
    });
    scene.add(model);
    repaint();
    render(performance.now());
    canvas.dataset.ready = "true";
    onReady({ triangles: renderer.info.render.triangles, calls: renderer.info.render.calls, geometries: renderer.info.memory.geometries });
  }, undefined, () => { if (!disposed) { failed = true; syncLoop(); onError(); } });

  // Short idle bursts with a sleeping renderer between them, and no work when
  // hidden, offscreen or reduced motion is requested.
  const idleTimer = window.setInterval(() => {
    if (!model || disposed || failed || reduceMotion || document.hidden || !inView) return;
    idleAt = performance.now();
    activeUntil = Math.max(activeUntil, idleAt+2900);
    syncLoop();
  }, 6500);

  return {
    setCoat(value) {
      coat = value; repaint(); changedCoatAt = performance.now();
      activeUntil = Math.max(activeUntil, changedCoatAt+800);
      render(changedCoatAt); syncLoop();
    },
    turn(direction) { if (model) model.rotation.y += direction*Math.PI/8; frameSubject(); render(performance.now()); },
    reset() { controls.reset(); camera.zoom = 1; camera.updateProjectionMatrix(); if (model) model.rotation.y = 0; render(performance.now()); },
    pet() { petAt = performance.now(); activeUntil = petAt+1900; render(petAt); syncLoop(); },
    zoom(direction) {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom+direction*.2, .8, 1.8);
      frameSubject();
      camera.updateProjectionMatrix(); render(performance.now());
    },
    dispose() {
      disposed = true;
      window.clearInterval(idleTimer);
      renderer.setAnimationLoop(null);
      observer.disconnect(); visibility.disconnect();
      reduced.removeEventListener("change", changeMotion);
      document.removeEventListener("visibilitychange", syncLoop);
      canvas.removeEventListener("webglcontextlost", contextLost);
      controls.removeEventListener("change", changedView);
      controls.dispose();
      disposeModel(scene);
      environment.dispose();
      key.shadow.map?.dispose();
      renderer.resetState();
      renderer.dispose();
      // React StrictMode can immediately reuse this canvas. Explicit context
      // loss here would asynchronously invalidate the replacement renderer.
    },
  };
}
