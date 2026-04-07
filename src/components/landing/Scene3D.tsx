import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import * as THREE from "three";

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.15;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1.2}>
      <Sphere ref={meshRef} args={[1.8, 128, 128]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#7c3aed"
          attach="material"
          distort={0.35}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function FloatingRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = t * 0.3;
      ring1Ref.current.rotation.z = t * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = t * 0.25;
      ring2Ref.current.rotation.x = t * 0.15;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z = t * 0.2;
      ring3Ref.current.rotation.y = t * 0.1;
    }
  });

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.8, 0.02, 16, 100]} />
        <meshStandardMaterial color="#a78bfa" transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.2, 0.015, 16, 100]} />
        <meshStandardMaterial color="#ec4899" transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[3.6, 0.01, 16, 100]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

function ParticleField() {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3] + Math.sin(t * 0.3 + i) * 0.3,
        positions[i * 3 + 1] + Math.cos(t * 0.2 + i) * 0.3,
        positions[i * 3 + 2]
      );
      dummy.scale.setScalar(0.02 + Math.sin(t + i) * 0.01);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#a78bfa" transparent opacity={0.6} />
    </instancedMesh>
  );
}

export function Scene3D() {
  return (
    <div className="scene3d-container">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        style={{ position: "absolute", inset: 0 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#a78bfa" />
        <pointLight position={[-10, -5, 5]} intensity={0.6} color="#ec4899" />
        <pointLight position={[0, -10, -5]} intensity={0.4} color="#3b82f6" />

        <AnimatedSphere />
        <FloatingRings />
        <ParticleField />
        <Stars radius={50} depth={50} count={1000} factor={3} fade speed={1} />
      </Canvas>
    </div>
  );
}
