import React, { useRef, useState } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

// Controls
import { useControls } from "leva";

// Shaders
import vertexShader from "@/shaders/vertex.glsl";
import fragmentShader from "@/shaders/fragment.glsl";

const uniforms = { uHovered: 0 };
const CustomMaterial = shaderMaterial(uniforms, vertexShader, fragmentShader);
extend({ CustomMaterial });

function Box(props) {
  const meshRef = useRef();
  const materialRef = useRef();

  // Controls
  const { hoveredValue } = useControls({ hoveredValue: { value: 0.5, min: 0, max: 1 } });

  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state, delta) => {
    meshRef.current.rotation.x += 0.01;
    materialRef.current.uniforms.uHovered.value = hoveredValue;
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
