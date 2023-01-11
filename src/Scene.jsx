import React, { useRef, useState } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { Center, shaderMaterial, Plane } from "@react-three/drei";

// Shaders
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

const CustomMaterial = shaderMaterial({ uHovered: 1 }, vertexShader, fragmentShader);
extend({ CustomMaterial });

function Box(props) {
  const meshRef = useRef();
  const materialRef = useRef();

  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state, delta) => {
    meshRef.current.rotation.x += 0.01;
    materialRef.current.uniforms.uHovered.value = hovered ? 1 : 0.5;
  });

  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={clicked ? 1.5 : 1}
      onClick={(e) => setClicked(!clicked)}
      onPointerOver={(e) => setHovered(true)}
      onPointerOut={(e) => setHovered(false)}
    >
      <boxGeometry args={[2, 2, 2]} />
      <customMaterial ref={materialRef} transparent={true} />
      {/* <meshStandardMaterial color={hovered ? "hotpink" : "orange"} /> */}
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box position={[-3, 0, 0]} />
      <Box position={[3, 0, 0]} />
    </Canvas>
  );
}
