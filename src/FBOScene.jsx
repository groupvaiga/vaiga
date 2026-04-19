import { useFBO } from "@react-three/drei";
import { Canvas, useFrame, extend, createPortal } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import SimulationMaterial from "./SimulationMaterial";
import vertexShader from "./vertexShader";
import fragmentShader from "./fragmentShader";

extend({ SimulationMaterial: SimulationMaterial });

const FBOParticles = ({ volumeRef }) => {
  const size = 128;
  const points = useRef();
  const simulationMaterialRef = useRef();
  const groupRef = useRef();
  const currentScale = useRef(1);

  const scene  = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1), []);

  // Simulation mesh geometry — built once via useMemo into actual BufferGeometry
  const simGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array([-1,-1,0, 1,-1,0, 1,1,0, -1,-1,0, 1,1,0, -1,1,0])
    const uvs       = new Float32Array([0,1, 1,1, 1,0, 0,1, 1,0, 0,0])
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('uv',       new THREE.BufferAttribute(uvs, 2))
    return geo
  }, [])

  const renderTarget = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    type: THREE.FloatType,
  });

  // Particles geometry — built once
  const pointsGeometry = useMemo(() => {
    const length = size * size
    const particles = new Float32Array(length * 3)
    for (let i = 0; i < length; i++) {
      particles[i * 3 + 0] = (i % size) / size
      particles[i * 3 + 1] = i / size / size
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(particles, 3))
    return geo
  }, [size])

  const uniforms = useMemo(() => ({
    uPositions: { value: null },
    uVolume:    { value: 0 },
  }), [])

  useFrame(({ gl, clock }) => {
    gl.setRenderTarget(renderTarget)
    gl.clear()
    gl.render(scene, camera)
    gl.setRenderTarget(null)

    points.current.material.uniforms.uPositions.value = renderTarget.texture
    simulationMaterialRef.current.uniforms.uTime.value = clock.elapsedTime

    // Voice-reactive heartbeat
    const volume = volumeRef?.current || 0
    const targetScale = 1 + volume * 0.55
    const lerpSpeed = targetScale > currentScale.current ? 0.45 : 0.35
    currentScale.current += (targetScale - currentScale.current) * lerpSpeed

    if (groupRef.current) {
      groupRef.current.scale.setScalar(currentScale.current)
    }

    // Color: blue → red with voice
    points.current.material.uniforms.uVolume.value = volume
  })

  // Build simulation mesh manually and add to offscreen scene
  const simMesh = useMemo(() => {
    const mat = new SimulationMaterial(size)
    const mesh = new THREE.Mesh(simGeometry, mat)
    scene.add(mesh)
    simulationMaterialRef.current = mat
    return mesh
  }, [scene, simGeometry, size])

  return (
    <>
      <group ref={groupRef}>
        <points ref={points} geometry={pointsGeometry}>
          <shaderMaterial
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fragmentShader={fragmentShader}
            vertexShader={vertexShader}
            uniforms={uniforms}
          />
        </points>
      </group>
    </>
  )
}

const FBOScene = ({ containerSize = 340, volumeRef }) => {
  return (
    <Canvas
      camera={{ position: [1.5, 1.5, 2.5] }}
      style={{ width: containerSize, height: containerSize, background: 'transparent' }}
      gl={{ alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <FBOParticles volumeRef={volumeRef} />
    </Canvas>
  )
}

export default FBOScene