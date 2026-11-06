// Chapter: The development. The Stalactite Table's block field and the Lath Bench's slats,
// rebuilt from the studio's own models. Beats are in docs/JOURNEY.md.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { smoothstep, type ChapterScene, type SceneContext } from './runtime';

type Box = { k: 'slab' | 'block' | 'leg'; c: [number, number, number]; s: [number, number, number] };

// Scroll ranges of the beats (progress 0..1 over the whole chapter).
const BEAT = {
  field: [0.0, 0.22],
  parameter: [0.22, 0.5],
  table: [0.5, 0.74],
  slats: [0.74, 1.0],
} as const;

// Camera keyframes: progress, position, target. Dolly and pan only.
// The text column sits left, so targets lean to negative x and the model sits right of centre.
const KEYS: [number, [number, number, number], [number, number, number]][] = [
  [0.0, [0.6, 3.0, 3.8], [-0.2, 0.0, 0.0]],
  [0.22, [0.7, 2.3, 3.1], [-0.3, 0.25, 0.0]],
  [0.5, [0.6, 1.9, 2.9], [-0.25, 0.45, 0.0]],
  [0.74, [-1.5, 1.05, 2.8], [-0.2, 0.5, -0.1]],
  [0.9, [0.3, 1.3, 4.2], [0.7, 0.4, -0.7]],
  [1.0, [0.9, 1.5, 4.8], [0.9, 0.4, -0.9]],
];

const BENCH_POS = new THREE.Vector3(1.2, 0, -1.6);

function loadGltf(url: string): Promise<THREE.Group> {
  const draco = new DRACOLoader();
  draco.setDecoderPath('/draco/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  return new Promise((res, rej) => loader.load(url, (g) => res(g.scene), undefined, rej));
}

export async function build(ctx: SceneContext): Promise<ChapterScene> {
  const [data, bench] = await Promise.all([
    fetch('/journey/stalactite-blocks.json').then((r) => r.json() as Promise<{ boxes: Box[] }>),
    loadGltf('/models/lowpoly/lath-bench-parts.glb'),
  ]);
  const object = new THREE.Color(ctx.palette.object);
  const objectDark = object.clone().multiplyScalar(0.72);
  const accent = new THREE.Color(ctx.palette.accent);

  // Table: slab, blocks, legs as boxes. Blocks and legs are instanced so each can move alone.
  const table = new THREE.Group();
  ctx.scene.add(table);
  const unit = new THREE.BoxGeometry(1, 1, 1);

  const slabBox = data.boxes.find((b) => b.k === 'slab')!;
  const slab = new THREE.Mesh(unit, ctx.material(objectDark));
  slab.scale.set(slabBox.s[0], slabBox.s[1], slabBox.s[2]);
  slab.castShadow = slab.receiveShadow = true;
  table.add(slab);

  const blocks = data.boxes.filter((b) => b.k === 'block');
  const legs = data.boxes.filter((b) => b.k === 'leg');
  const xMin = Math.min(...blocks.map((b) => b.c[0]));
  const xMax = Math.max(...blocks.map((b) => b.c[0]));

  // Instance colours multiply the material colour, so the material is white and the colour lives per block.
  const blockMesh = new THREE.InstancedMesh(unit, ctx.material('#ffffff'), blocks.length);
  blockMesh.castShadow = blockMesh.receiveShadow = true;
  blockMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(blocks.length * 3), 3);
  table.add(blockMesh);
  const legMesh = new THREE.InstancedMesh(unit, ctx.material(objectDark), legs.length);
  legMesh.castShadow = legMesh.receiveShadow = true;
  table.add(legMesh);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const col = new THREE.Color();
  const FLAT_H = 0.05;

  // Bench: slats fan in from a spread; ribs appear once the slats have settled.
  bench.position.copy(BENCH_POS);
  bench.rotation.y = Math.PI / 2;
  bench.visible = false;
  ctx.scene.add(bench);
  const slats: THREE.Mesh[] = [];
  const ribs: THREE.Mesh[] = [];
  const oak = ctx.material(object);
  const oakDark = ctx.material(objectDark);
  bench.traverse((n) => {
    if (!(n instanceof THREE.Mesh)) return;
    n.castShadow = n.receiveShadow = true;
    n.geometry.computeVertexNormals();
    if (n.name.startsWith('slat')) { slats.push(n); n.material = slats.length % 2 ? oak : oakDark; }
    else { ribs.push(n); n.material = oakDark; }
  });
  slats.sort((a, b) => a.name.localeCompare(b.name));
  const restPos = slats.map((n) => n.position.clone());
  const restRot = slats.map((n) => n.rotation.clone());

  function camera(progress: number) {
    let i = 0;
    while (i < KEYS.length - 2 && progress > KEYS[i + 1][0]) i++;
    const [p0, a0, t0] = KEYS[i];
    const [p1, a1, t1] = KEYS[i + 1];
    const t = smoothstep(p0, p1, progress);
    ctx.view.position.set(a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t, a0[2] + (a1[2] - a0[2]) * t);
    ctx.view.target.set(t0[0] + (t1[0] - t0[0]) * t, t0[1] + (t1[1] - t0[1]) * t, t0[2] + (t1[2] - t0[2]) * t);
  }

  return {
    update(progress, time) {
      camera(progress);

      // Beat 2: the parameter sweeps along x; each block lifts from the flat plan to its hanging height.
      const sweep = (progress - BEAT.parameter[0]) / (BEAT.parameter[1] - BEAT.parameter[0]);
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const xn = (b.c[0] - xMin) / (xMax - xMin);
        const f = smoothstep(0, 1, sweep * 1.5 - xn * 0.5);
        const h = FLAT_H + (b.s[1] - FLAT_H) * f;
        const y = FLAT_H / 2 + (b.c[1] - FLAT_H / 2) * f;
        p.set(b.c[0], y, b.c[2]);
        s.set(b.s[0] * 0.96, h, b.s[2] * 0.96);
        m.compose(p, q, s);
        blockMesh.setMatrixAt(i, m);
        const glow = Math.sin(Math.PI * f) * 0.9;
        col.copy(object).lerp(accent, glow);
        blockMesh.setColorAt(i, col);
      }
      blockMesh.instanceMatrix.needsUpdate = true;
      blockMesh.instanceColor!.needsUpdate = true;

      // Beat 3: legs rise from the floor and the slab lands on the field.
      const land = smoothstep(BEAT.table[0], BEAT.table[0] + 0.6 * (BEAT.table[1] - BEAT.table[0]), progress);
      for (let i = 0; i < legs.length; i++) {
        const b = legs[i];
        const h = FLAT_H + (b.s[1] - FLAT_H) * land;
        p.set(b.c[0], h / 2, b.c[2]);
        s.set(b.s[0] * 0.98, h, b.s[2] * 0.98);
        m.compose(p, q, s);
        legMesh.setMatrixAt(i, m);
      }
      legMesh.instanceMatrix.needsUpdate = true;
      const drop = 1 - land;
      slab.position.set(slabBox.c[0], slabBox.c[1] + drop * drop * 2.2 + (land < 1 ? 0 : 0), slabBox.c[2]);
      slab.visible = progress > BEAT.parameter[1] - 0.02;

      // Beat 4: the slats fan in and settle; the ribs follow.
      const fan = (progress - (BEAT.slats[0] - 0.03)) / (BEAT.slats[1] - BEAT.slats[0]);
      bench.visible = fan > 0;
      if (bench.visible) {
        const n = slats.length;
        for (let i = 0; i < n; i++) {
          const k = i / (n - 1) - 0.5;
          const f = smoothstep(0, 1, fan * 1.6 - Math.abs(k) * 0.9);
          const open = 1 - f;
          const sl = slats[i];
          sl.position.copy(restPos[i]);
          sl.position.y += open * (0.9 + Math.abs(k) * 0.4);
          sl.position.x += open * k * 1.6;
          sl.rotation.set(restRot[i].x, restRot[i].y, restRot[i].z + open * k * 1.1);
          sl.visible = f > 0.001 || open < 1;
        }
        const ribIn = smoothstep(0.75, 1, fan);
        for (const r of ribs) { r.scale.setScalar(Math.max(0.001, ribIn)); r.visible = ribIn > 0; }
      }
      void time;
    },
    dispose() {
      unit.dispose();
    },
  };
}
