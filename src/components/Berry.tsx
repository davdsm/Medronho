import { Component, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { createNoise3D } from "simplex-noise";
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  MathUtils,
  Mesh,
  PMREMGenerator,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type Group,
  type Material,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { scene } from "../scene";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noise = createNoise3D(mulberry32(20261002));

/** Irregular conical papillae — closer to a real Arbutus unedo skin. */
function papilla(v: Vector3, offset: number) {
  const warp = noise(v.x * 3.6 + offset, v.y * 3.6, v.z * 3.6) * 0.14;
  const px = v.x + warp;
  const py = v.y + warp * 0.75;
  const pz = v.z - warp * 0.55;

  const f = 19.5;
  const lattice =
    Math.sin(px * f + offset) *
    Math.sin(py * f * 1.11 + 0.9) *
    Math.sin(pz * f * 0.93 + offset * 0.25);
  // Soft base, sharper tip — like real medronho warts.
  const cone = Math.pow(Math.max(0, lattice), 1.55);

  const micro = Math.pow(
    Math.max(0, noise(px * 42 + offset, py * 42, pz * 42)),
    2.8,
  );
  const amp = 0.72 + 0.28 * noise(v.x * 2.2 + offset, v.y * 2.2, v.z * 2.2);
  return (cone * 0.82 + micro * 0.28) * amp;
}

function makeBerry(offset: number, ripe: number) {
  const fine = window.innerWidth >= 760;
  const geo = new SphereGeometry(1, fine ? 168 : 104, fine ? 128 : 78);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const v = new Vector3();
  const c = new Color();
  const valley = new Color("#1f0706");
  const deep = new Color("#5c100c");
  const flesh = new Color("#a51f14");
  const tip = new Color("#e24a28");
  const blush = new Color("#f07848");
  const gold = new Color("#c9943a");
  const leaf = new Color("#6f8530");

  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i).normalize();
    const bumps = papilla(v, offset);
    const lump =
      noise(v.x * 1.8 + offset, v.y * 1.8, v.z * 1.8) * 0.028 +
      noise(v.x * 5 + offset, v.y * 5, v.z * 5) * 0.01;
    const crown = Math.max(0, v.y - 0.52);
    let radius = 1 + lump + bumps * 0.09;
    radius -= crown * crown * 0.78;
    if (v.y < -0.68) radius -= (v.y + 0.68) * -0.1;
    // Slightly squat, like a real medronho.
    pos.setXYZ(i, v.x * radius * 1.03, v.y * radius * 0.92, v.z * radius * 1.03);

    const point = Math.min(1, bumps * 2.8);
    const shade = 0.5 + v.y * 0.12 + noise(v.x * 6, v.y * 6, v.z * 6) * 0.08;
    c.copy(valley).lerp(deep, 0.45);
    c.lerp(flesh, clamp01(0.35 + ripe * 0.5 + shade * 0.15));
    c.lerp(tip, point * (0.35 + ripe * 0.45));
    c.lerp(blush, point * point * ripe * 0.35);
    if (ripe < 0.85) c.lerp(gold, (0.85 - ripe) * (0.75 - point * 0.4));
    if (ripe < 0.55 && v.y > 0.2) c.lerp(leaf, (0.55 - ripe) * (v.y - 0.2) * 1.2);
    // Soft AO in valleys between papillae.
    c.multiplyScalar(0.78 + (1 - point) * 0.08 + point * 0.2);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute("color", new BufferAttribute(colors, 3));
  const welded = mergeVertices(geo, 8e-4);
  welded.computeVertexNormals();
  return welded;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function makeSepal() {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.22, 0.03, 0.18, 0.24, 0.01, 0.5);
  shape.bezierCurveTo(-0.16, 0.24, -0.22, 0.03, 0, 0);
  return new ExtrudeGeometry(shape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.007,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 12,
  });
}

function makeStem() {
  const curve = new CatmullRomCurve3([
    new Vector3(0, 0.72, 0),
    new Vector3(0.02, 0.92, 0.015),
    new Vector3(-0.015, 1.1, -0.01),
    new Vector3(0.01, 1.28, 0.02),
  ]);
  return new TubeGeometry(curve, 12, 0.02, 6, false);
}

function Fruit({
  offset,
  ripe,
  position,
  scale,
  rotation,
}: {
  offset: number;
  ripe: number;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
}) {
  const berry = useMemo(() => makeBerry(offset, ripe), [offset, ripe]);
  const sepal = useMemo(() => makeSepal(), []);
  const stem = useMemo(() => makeStem(), []);

  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh geometry={berry}>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.9}
          metalness={0}
          clearcoat={0.045}
          clearcoatRoughness={0.88}
          sheen={0.62}
          sheenColor={ripe > 0.7 ? "#d45a40" : "#c9a05a"}
          sheenRoughness={0.82}
          envMapIntensity={0.4}
          ior={1.35}
          specularIntensity={0.25}
        />
      </mesh>
      <mesh geometry={stem}>
        <meshStandardMaterial color="#4a3224" roughness={0.95} />
      </mesh>
      <group position={[0, 0.62, 0]} scale={1.2}>
        {Array.from({ length: 5 }, (_, index) => {
          const angle = (index / 5) * Math.PI * 2 + 0.18;
          return (
            <mesh
              key={index}
              geometry={sepal}
              position={[Math.cos(angle) * 0.045, 0.015, Math.sin(angle) * 0.045]}
              rotation={[0.95, -angle, 0.08]}
              scale={[1, 1, 0.7 + (index % 2) * 0.15]}
            >
              <meshStandardMaterial
                color={index % 2 === 0 ? "#8a9a42" : "#5e742c"}
                roughness={0.88}
                side={DoubleSide}
              />
            </mesh>
          );
        })}
        <mesh position={[0, 0.015, 0]}>
          <sphereGeometry args={[0.065, 20, 16]} />
          <meshStandardMaterial color="#5c6e2a" roughness={0.84} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.007, 0.011, 0.11, 7]} />
          <meshStandardMaterial color="#5a3e28" roughness={0.92} />
        </mesh>
      </group>
    </group>
  );
}

function Cluster() {
  const group = useRef<Group>(null);
  const damp = useRef({
    x: scene.x,
    y: scene.y,
    s: scene.scale,
    ry: scene.ry,
    lx: 0,
    ly: 0,
  });
  const reduce = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    const live = scene.idle && !reduce.current;
    const snap = scene.opacity < 0.04;
    const follow = snap ? 18 : 3.8;
    damp.current.x = MathUtils.damp(damp.current.x, scene.x, follow, delta);
    damp.current.y = MathUtils.damp(damp.current.y, scene.y, follow, delta);
    damp.current.s = MathUtils.damp(damp.current.s, scene.scale, follow, delta);
    damp.current.ry = MathUtils.damp(damp.current.ry, scene.ry, follow, delta);
    damp.current.lx = MathUtils.damp(damp.current.lx, scene.lookX, 5, delta);
    damp.current.ly = MathUtils.damp(damp.current.ly, scene.lookY, 5, delta);
    if (snap) {
      damp.current.x = scene.x;
      damp.current.y = scene.y;
      damp.current.s = scene.scale;
      damp.current.ry = scene.ry;
    }
    const time = state.clock.elapsedTime;
    node.position.set(
      damp.current.x,
      damp.current.y + (live ? Math.sin(time * 0.85) * 0.03 : 0),
      0,
    );
    // Keep spinning during the drop and while idle — the hero needs that 3D turn.
    const spin = reduce.current ? 0 : time * 0.22;
    node.rotation.y = damp.current.ry + spin + damp.current.lx * 0.85;
    node.rotation.x = damp.current.ly * 0.55;
    node.rotation.z = live ? Math.sin(time * 0.45) * 0.03 : damp.current.lx * 0.08;
    node.scale.setScalar(Math.max(0.001, damp.current.s));
    node.visible = scene.opacity > 0.02;
    node.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat: Material) => {
        mat.opacity = scene.opacity;
        mat.transparent = scene.opacity < 0.995;
        mat.depthWrite = scene.opacity > 0.85;
      });
    });
  });

  return (
    <group ref={group}>
      <Fruit offset={0.4} ripe={1} position={[0.02, -0.02, 0.28]} scale={1} rotation={[0.2, 0.55, 0.04]} />
      <Fruit
        offset={4.2}
        ripe={0.86}
        position={[-0.74, -0.2, -0.42]}
        scale={0.56}
        rotation={[0.38, 1.2, 0.18]}
      />
      <Fruit
        offset={8.6}
        ripe={0.62}
        position={[0.55, 0.12, -0.72]}
        scale={0.36}
        rotation={[-0.25, -0.7, -0.2]}
      />
    </group>
  );
}

function Stage() {
  return (
    <>
      <hemisphereLight args={["#ffe8cf", "#2a100e", 0.42]} />
      <ambientLight intensity={0.14} />
      <directionalLight position={[3.2, 5.4, 4.4]} intensity={1.55} color="#fff3e4" />
      <directionalLight position={[-3.8, 1.4, 2.4]} intensity={0.45} color="#ff9a7a" />
      <directionalLight position={[-0.2, 1.8, -4.2]} intensity={0.85} color="#fff8ee" />
      <directionalLight position={[0.6, -2.2, 1.2]} intensity={0.2} color="#6a2018" />
      <Cluster />
    </>
  );
}

function PointerLook() {
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        target.current.x = 0;
        target.current.y = 0;
        return;
      }
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      target.current.x = MathUtils.clamp(nx, -1, 1);
      target.current.y = MathUtils.clamp(ny, -1, 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(() => {
    scene.lookX = target.current.x;
    scene.lookY = target.current.y;
  });

  return null;
}

export function BerryCanvas({ inline = false }: { inline?: boolean }) {
  return (
    <div
      className={
        inline
          ? "pointer-events-none absolute inset-x-0 top-[12%] h-[52dvh]"
          : "pointer-events-none fixed inset-0 z-10"
      }
      aria-hidden="true"
    >
      <Canvas
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.05, 6.6], fov: 30, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene: threeScene }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
          const pmrem = new PMREMGenerator(gl);
          threeScene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
          pmrem.dispose();
        }}
      >
        <PointerLook />
        <Stage />
      </Canvas>
    </div>
  );
}

export class BerryGuard extends Component<{ children: ReactNode }, { bad: boolean }> {
  state = { bad: false };

  static getDerivedStateFromError() {
    return { bad: true };
  }

  render() {
    if (this.state.bad) return null;
    return this.props.children;
  }
}
