// Pen-drawing orbit viewer. Loads a glTF (meshopt-compressed), renders it as ink lines on the
// page background: silhouette and crease edges from a screen-space pass over normals + depth,
// with a faint tonal wash so the form reads. Orbit with the pointer, slow auto-rotate when idle.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export interface SketchOptions {
  url: string;
  ink?: string;        // line colour
  paper?: string;      // background colour
  wash?: number;       // 0..1 strength of the tonal wash
  autoRotate?: boolean;
  onLoad?: () => void;
}

const EDGE_VS = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const EDGE_FS = /* glsl */ `
precision highp float;
uniform sampler2D tNormal;   // view-space normals, rgb = n*0.5+0.5, a = 1 where geometry
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uWash;
uniform float uNear;
uniform float uFar;
varying vec2 vUv;

float linearDepth(float z){
  float zn = 2.0 * z - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - zn * (uFar - uNear)) / uFar;
}
void main(){
  vec4 c = texture2D(tNormal, vUv);
  float d = linearDepth(texture2D(tDepth, vUv).x);
  // Sobel over normals and depth. Silhouettes come from depth jumps, creases from normal turns.
  float nEdge = 0.0, dEdge = 0.0;
  vec3 n0 = c.rgb * 2.0 - 1.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
    if (i == 0 && j == 0) continue;
    vec2 o = vec2(float(i), float(j)) * uTexel;
    vec4 cs = texture2D(tNormal, vUv + o);
    vec3 n1 = cs.rgb * 2.0 - 1.0;
    nEdge = max(nEdge, 1.0 - dot(n0, n1));
    float d1 = linearDepth(texture2D(tDepth, vUv + o).x);
    dEdge = max(dEdge, abs(d - d1));
    // geometry/background boundary is always a line
    nEdge = max(nEdge, abs(c.a - cs.a));
  }
  float edge = smoothstep(0.08, 0.35, nEdge) + smoothstep(0.004, 0.02, dEdge);
  edge = clamp(edge, 0.0, 1.0);
  // Faint wash: lambert from a key light, only where geometry exists.
  vec3 L = normalize(vec3(-0.4, 0.6, 0.7));
  float lam = clamp(dot(n0, L), 0.0, 1.0);
  float wash = c.a * uWash * (0.35 + 0.65 * (1.0 - lam)) * 0.18;
  vec3 col = mix(uPaper, uInk, wash);
  col = mix(col, uInk, edge * 0.92);
  gl_FragColor = vec4(col, 1.0);
}`;

export function mountSketchViewer(el: HTMLElement, opts: SketchOptions) {
  const ink = new THREE.Color(opts.ink ?? '#efe9dc');
  const paper = new THREE.Color(opts.paper ?? '#0a0a0a');
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(paper, 1);
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.enablePan = false; controls.autoRotate = opts.autoRotate ?? true; controls.autoRotateSpeed = 0.5;
  controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI * 0.62;

  // Normal + depth pass.
  const normalMat = new THREE.MeshNormalMaterial();
  const rt = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType) });
  const edgeMat = new THREE.ShaderMaterial({
    vertexShader: EDGE_VS, fragmentShader: EDGE_FS,
    uniforms: {
      tNormal: { value: rt.texture }, tDepth: { value: rt.depthTexture }, uTexel: { value: new THREE.Vector2() },
      uInk: { value: ink }, uPaper: { value: paper }, uWash: { value: opts.wash ?? 1 },
      uNear: { value: camera.near }, uFar: { value: camera.far },
    },
    depthTest: false, depthWrite: false,
  });
  const quadScene = new THREE.Scene();
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), edgeMat));
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h); // also sets the CSS size; Astro's scoped styles don't reach this canvas
    const pr = renderer.getPixelRatio();
    rt.setSize(Math.floor(w * pr), Math.floor(h * pr));
    edgeMat.uniforms.uTexel.value.set(1 / (w * pr), 1 / (h * pr));
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(el);
  resize();

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  loader.load(opts.url, (gltf) => {
    const root = gltf.scene;
    root.traverse((o: any) => {
      if (o.isMesh) {
        if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); // some exports arrive without normals
        o.material = normalMat; o.frustumCulled = false;
      }
    });
    // Centre and frame it.
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3()); const centre = box.getCenter(new THREE.Vector3());
    root.position.sub(centre);
    scene.add(root);
    const radius = size.length() * 0.5;
    const dist = (radius / Math.sin((camera.fov * Math.PI) / 360)) * 0.92;
    camera.position.set(0.78, 0.38, 0.78).normalize().multiplyScalar(dist);
    camera.near = Math.max(0.01, dist * 0.05); camera.far = dist * 6; camera.updateProjectionMatrix();
    edgeMat.uniforms.uNear.value = camera.near; edgeMat.uniforms.uFar.value = camera.far;
    controls.target.set(0, 0, 0); controls.minDistance = dist * 0.5; controls.maxDistance = dist * 2.2; controls.update();
    opts.onLoad?.();
  });

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.05 }).observe(el);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) controls.autoRotate = false;

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    controls.update();
    renderer.setRenderTarget(rt);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.setClearColor(paper, 1);
    renderer.render(quadScene, quadCam);
  }
  frame();
  return { renderer, scene, camera, controls };
}
