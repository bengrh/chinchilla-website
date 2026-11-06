// Shared runtime for the journey chapters: renderer, light rig, ground, fog, scroll binding,
// pointer drift and the fallbacks. The look is specified in docs/JOURNEY.md; scenes only place
// objects and move the camera through `view`.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface Palette {
  ground: string;
  object: string;
  accent: string;
  haze: string;
}

export interface View {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  palette: Palette;
  view: View;
  coarse: boolean;
  material(color: THREE.ColorRepresentation, extra?: Partial<THREE.MeshStandardMaterialParameters>): THREE.MeshStandardMaterial;
}

export interface ChapterScene {
  update(progress: number, time: number): void;
  dispose?(): void;
}

export interface MountOptions {
  canvas: HTMLCanvasElement;
  scrollRoot: HTMLElement;
  palette: Palette;
  build: (ctx: SceneContext) => Promise<ChapterScene>;
}

// Reduced motion keeps the scene (it is the content) but nothing moves except with the scroll:
// no easing toward the scroll position and no pointer drift.
export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function canRun(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export async function mountChapter(o: MountOptions): Promise<{ dispose(): void }> {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const reduced = reducedMotion();
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const haze = new THREE.Color(o.palette.haze);
  const scene = new THREE.Scene();
  // Sky: a vertical gradient, darker above, the haze at the horizon so the fogged ground meets it.
  const sky = document.createElement('canvas');
  sky.width = 2; sky.height = 256;
  const g = sky.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#' + haze.clone().multiplyScalar(0.55).getHexString());
  grad.addColorStop(0.62, '#' + haze.getHexString());
  grad.addColorStop(1, '#' + haze.clone().lerp(new THREE.Color(o.palette.ground), 0.6).getHexString());
  g.fillStyle = grad; g.fillRect(0, 0, 2, 256);
  const skyTex = new THREE.CanvasTexture(sky);
  skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  scene.fog = new THREE.Fog(haze, coarse ? 5 : 7, coarse ? 14 : 18);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 2, 6);

  // Light rig (docs/JOURNEY.md)
  const skyLight = haze.clone().lerp(new THREE.Color('#ffffff'), 0.2);
  scene.add(new THREE.HemisphereLight(skyLight, new THREE.Color(o.palette.ground), 0.9));
  const key = new THREE.DirectionalLight('#fff1e0', 1.6);
  key.position.set(-4, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(coarse ? 512 : 1024, coarse ? 512 : 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.radius = 2;
  key.shadow.bias = -0.0005;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#cfd8ff', 0.5);
  rim.position.set(4, 3, -4);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: o.palette.ground, roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const view: View = { position: new THREE.Vector3(0, 2, 6), target: new THREE.Vector3(0, 0.4, 0) };
  const ctx: SceneContext = {
    scene, camera, renderer, palette: o.palette, view, coarse,
    material: (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, metalness: 0, ...extra }),
  };

  const chapter = await o.build(ctx);

  // Size
  function resize() {
    const w = o.canvas.clientWidth || window.innerWidth;
    const h = o.canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Scroll → target progress; the loop eases toward it so the camera lags the scroll a little.
  let target = 0;
  let progress = 0;
  const trigger = ScrollTrigger.create({
    trigger: o.scrollRoot,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { target = self.progress; },
  });
  target = progress = trigger.progress;

  // Pointer drift: at most 2 percent of the frame, off on touch.
  const pointer = new THREE.Vector2();
  const drift = new THREE.Vector2();
  if (!coarse && !reduced) {
    window.addEventListener('pointermove', (e) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    });
  }

  // Run only while the chapter is on screen and the tab is visible.
  let visible = true;
  const io = new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); }, { threshold: 0 });
  io.observe(o.scrollRoot);

  const right = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  function applyView() {
    camera.position.copy(view.position);
    camera.lookAt(view.target);
    const dist = view.position.distanceTo(view.target);
    right.setFromMatrixColumn(camera.matrix, 0);
    pos.copy(view.position).addScaledVector(right, drift.x * dist * 0.02).addScaledVector(up, -drift.y * dist * 0.02);
    camera.position.copy(pos);
    camera.lookAt(view.target);
  }

  let last = performance.now();
  let raf = 0;
  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    progress = reduced ? target : progress + (target - progress) * (1 - Math.exp(-dt * 7));
    drift.lerp(pointer, 1 - Math.exp(-dt * 3));
    chapter.update(progress, now / 1000);
    applyView();
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // Dev hook for poster capture: window.__chapter.renderAt(0.5) returns a data URL.
  (window as any).__chapter = {
    renderAt(p: number, width?: number, height?: number) {
      if (width && height) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
      progress = target = p;
      drift.set(0, 0);
      chapter.update(p, performance.now() / 1000);
      applyView();
      renderer.render(scene, camera);
      const url = o.canvas.toDataURL('image/jpeg', 0.92);
      if (width && height) resize();
      return url;
    },
    get progress() { return progress; },
  };

  return {
    dispose() {
      cancelAnimationFrame(raf);
      trigger.kill();
      io.disconnect();
      window.removeEventListener('resize', resize);
      chapter.dispose?.();
      renderer.dispose();
    },
  };
}
