import * as THREE from 'three';

// Prototype only: distances refer to the viewer's normalized 2.7-unit body.
// This is a typical spatial patch, not a prediction of genetic white coverage.
export function attachWhiteStudy(material: THREE.Material, level: {value:number}) {
 if(!(material instanceof THREE.MeshStandardMaterial)||material.userData.whiteStudy)return;
 material.userData.whiteStudy=true;
 material.onBeforeCompile=shader=>{
  shader.uniforms.studyWhiteLevel=level;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 studyPosition;');
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nstudyPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 studyPosition;
   uniform float studyWhiteLevel;
   float studyEllipse(vec3 p,vec3 c,vec3 radius){return length((p-c)/radius);}
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(studyWhiteLevel>0.5){
    vec3 p=studyPosition;
    float chest=studyEllipse(p,vec3(-0.40,1.02,0.74),vec3(0.34,0.49,0.42));
    float paws=studyEllipse(p,vec3(-0.40,0.06,0.50),vec3(0.52,0.17,0.63));
    float muzzle=studyEllipse(p,vec3(-0.35,1.65,0.78),vec3(0.32,0.18,0.35))+0.7;
    float rank=min(chest,min(paws,muzzle));
    float limit=studyWhiteLevel<1.5?0.46:studyWhiteLevel<2.5?1.40:studyWhiteLevel<3.5?2.35:4.7;
    // Slight edge variation, anchored to the surface rather than the camera.
    rank+=0.023*sin(p.x*72.0)*sin(p.y*53.0)*sin(p.z*61.0);
    float mask=1.0-smoothstep(limit-0.055,limit+0.055,rank);
    float eyeL=studyEllipse(p,vec3(-0.545,1.988,0.786),vec3(0.115,0.108,0.13));
    float eyeR=studyEllipse(p,vec3(-0.149,1.845,0.783),vec3(0.115,0.108,0.13));
    float nose=studyEllipse(p,vec3(-0.372,1.747,0.949),vec3(0.077,0.059,0.09));
    float features=smoothstep(0.85,1.12,min(nose,min(eyeL,eyeR)));
    float earL=studyEllipse(p,vec3(-0.59,2.456,0.33),vec3(0.18,0.28,0.18));
    float earR=studyEllipse(p,vec3(0.154,2.215,0.335),vec3(0.18,0.23,0.18));
    float ears=smoothstep(0.8,1.12,min(earL,earR));
    float headLimit=studyWhiteLevel<3.5?1.93:2.63;
    float cap=1.0-smoothstep(headLimit-0.06,headLimit+0.04,p.y+0.22*p.x);
    mask*=features*ears*cap;
    // Preserve lighting/normal map. Lift baked dark pigment instead of tinting it gray.
    float luminance=dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722));
    vec3 white=vec3(0.86,0.82,0.74)*(0.84+0.16*sqrt(clamp(luminance,0.0,1.0)));
    diffuseColor.rgb=mix(diffuseColor.rgb,white,mask);
   }
  `);
 };
 material.customProgramCacheKey=()=> 'domestic-white-study-v1';material.needsUpdate=true;
}
