"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type GuidePose =
  | "idle" // soft bobbing
  | "speaking" // jaw opens/closes (lip-sync)
  | "listening" // leans in, gentle tilt
  | "thinking" // tilts head up, slower
  | "happy"; // quick happy bounce

interface MascotProps {
  pose: GuidePose;
}

/** Spring-like easing used to settle the body toward a target compactly. */
const damp = THREE.MathUtils.damp;

function Ellipse({
  color,
  ...props
}: { color: string } & ComponentPropsWithoutRef<"mesh">) {
  return (
    <mesh {...props}>
      {/* An ellipsoid of any dimensions is just a scaled sphere. */}
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
    </mesh>
  );
}

/**
 * A friendly procedural study-buddy (blob bot) mascot. No external assets —
 * everything is composed from Three.js primitives so it stays tiny and loads
 * instantly. The jaw is driven by per-frame oscillation during "speaking" so
 * lip-sync locks to the TTS boundary ticks from `useSpeech`.
 */
function Mascot({ pose }: MascotProps) {
  const root = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = root.current;
    if (!g) return;

    // Base idle: slow drift + breathing scale.
    g.position.y = Math.sin(t * 0.8) * 0.03;
    const breathe = 1 + Math.sin(t * 2.2) * 0.012;
    if (bodyRef.current) bodyRef.current.scale.set(breathe * 1, 1 / breathe, 1);

    let targetTilt = 0;
    let targetLean = 0;
    let bounce = 0;
    let wave = 0;
    let jawOpen = 0.02;

    if (pose === "speaking") {
      // Fast, chatty oscillation while talking — reset on each boundary via phase.
      jawOpen = 0.06 + Math.max(0, Math.sin(t * 14)) * 0.12;
      targetTilt = Math.sin(t * 3) * 0.04; // animated crystal
      bounce = Math.sin(t * 8) * 0.01;
    } else if (pose === "listening") {
      targetLean = 0.18; // leans toward the mic
      targetTilt = 0.12;
      wave = Math.sin(t * 5) * 0.04;
    } else if (pose === "thinking") {
      targetTilt = 0.35; // head cocked up in thought
      targetLean = -0.08;
      bounce = 0;
    } else if (pose === "happy") {
      bounce = Math.abs(Math.sin(t * 5)) * 0.16 + 0.05;
    }

    // Arms: gentle sway; wave when listening.
    if (leftArm.current) leftArm.current.rotation.z = wave * 0.4 + Math.sin(t * 2) * 0.05;
    if (rightArm.current) rightArm.current.rotation.z = -wave * 0.4 - Math.sin(t * 2) * 0.05;

    if (g) g.position.y += bounce;
    if (headRef.current) {
      headRef.current.rotation.z = damp(headRef.current.rotation.z, targetTilt, 4, delta);
      headRef.current.rotation.x = damp(headRef.current.rotation.x, targetLean, 4, delta);
    }
    if (jawRef.current) {
      jawRef.current.scale.y =
        pose === "speaking" ? jawOpen : damp(jawRef.current.scale.y, 1, 6, delta);
    }
  });

  return (
    <group ref={root} position={[0, 0, 0]}>
      <group ref={bodyRef}>
        {/* Body */}
        <Ellipse color="#6366f1" scale={[0.95, 0.95, 0.8]} position={[0, -0.15, 0]} />
        {/* Belly patch */}
        <mesh position={[0, -0.18, -0.62]}>
          <sphereGeometry args={[0.42, 24, 24]} />
          <meshStandardMaterial color="#eef1ff" roughness={0.7} metalness={0} />
        </mesh>
        {/* Arms */}
        <group ref={leftArm} position={[-0.86, 0.38, 0]} rotation={[0, 0, 0.18]}>
          <Ellipse color="#6366f1" scale={[0.34, 0.34, 0.34]} position={[-0.18, 0.02, 0]} />
        </group>
        <group ref={rightArm} position={[0.86, 0.38, 0]} rotation={[0, 0, -0.18]}>
          <Ellipse color="#6366f1" scale={[0.34, 0.34, 0.34]} position={[0.18, 0.02, 0]} />
        </group>
        {/* Feet */}
        <Ellipse color="#4338ca" scale={[0.4, 0.22, 0.5]} position={[-0.3, -0.95, 0.08]} />
        <Ellipse color="#4338ca" scale={[0.4, 0.22, 0.5]} position={[0.3, -0.95, 0.08]} />

        {/* Head */}
        <group ref={headRef} position={[0, 0.95, 0]} rotation={[0, 0, 0]}>
          <Ellipse color="#8b5cf6" scale={[1.05, 1.0, 0.95]} />
          {/* Face panel */}
          <mesh position={[0, 0.05, 0.9]}>
            <sphereGeometry args={[0.48, 24, 24]} />
            <meshStandardMaterial color="#f8faff" roughness={0.9} metalness={0} />
          </mesh>
          {/* Eyes */}
          <Ellipse color="#1e1b4b" scale={[0.13, 0.17, 0.08]} position={[-0.32, 0.28, 1.06]} />
          <Ellipse color="#1e1b4b" scale={[0.13, 0.17, 0.08]} position={[0.32, 0.28, 1.06]} />
          {/* Eye glints */}
          <Ellipse color="#ffffff" scale={[0.05, 0.05, 0.03]} position={[-0.37, 0.32, 1.14]} />
          <Ellipse color="#ffffff" scale={[0.05, 0.05, 0.03]} position={[0.27, 0.32, 1.14]} />
          {/* Mouth / jaw (scales along Y for lip-sync) */}
          <group position={[0, -0.1, 0.98]} rotation={[0.2, 0, 0]}>
            <mesh ref={jawRef}>
              <boxGeometry args={[0.34, 0.08, 0.05]} />
              <meshStandardMaterial color="#e7718c" roughness={0.4} metalness={0} />
            </mesh>
          </group>
          {/* Cheeks */}
          <Ellipse color="#ffd7e3" scale={[0.16, 0.11, 0.05]} position={[-0.5, -0.18, 0.95]} />
          <Ellipse color="#ffd7e3" scale={[0.16, 0.11, 0.05]} position={[0.5, -0.18, 0.95]} />
          {/* Antenna */}
          <mesh position={[0, 1.08, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 12]} />
            <meshStandardMaterial color="#4338ca" />
          </mesh>
          <mesh position={[0, 1.32, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.6} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

interface GuideSceneProps {
  pose: GuidePose;
  className?: string;
}

/**
 * The 3D canvas hosting Aina the mascot. Mounted only while the widget is open;
 * frameloop="demand" is picked up lazily after speaking so battery stays low.
 */
export function GuideScene({ pose, className }: GuideSceneProps) {
  return (
    <div className={className ?? "relative h-full w-full"}>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0.2, 5.2], fov: 42 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 6]} intensity={1.4} />
        <directionalLight position={[-4, 3, -4]} intensity={0.5} color="#8b5cf6" />
        <pointLight position={[0, 2, 3]} intensity={6} distance={10} color="#ffffff" />
        <Mascot pose={pose} />
      </Canvas>
    </div>
  );
}