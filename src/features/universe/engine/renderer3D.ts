// features/universe/engine/renderer3D.ts
// Three.js InstancedMesh renderer for particle universe v2.1

import * as THREE from 'three'
import type { ParticleData, FusionEvent } from '../types/universe.types'
import { hueToColor } from './forceMap'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let mesh: THREE.InstancedMesh
let dummy: THREE.Object3D
let animFrameId: number | null = null
let loopFn: ((dt: number) => void) | null = null
let lastTime = 0

// HUD elements refs
let hudCallbacks: {
  onStats?: (p: number, c: number) => void
  onFusion?: (name: string) => void
} = {}

export interface RenderContext {
  particles: ParticleData[]
  fusions: FusionEvent[]
  viewMode: 'orbit' | 'inspect'
  selectedParticleId: string | null
}

/**
 * Initialize Three.js scene, camera, renderer.
 */
export function initRenderer(
  canvas: HTMLCanvasElement,
  onLoop: (dt: number) => void,
  huds: typeof hudCallbacks = {},
): void {
  loopFn = onLoop
  hudCallbacks = huds

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0a0a14')

  // Camera — isometric view of the galactic disk
  camera = new THREE.PerspectiveCamera(50, width / height, 10, 10000)
  camera.position.set(0, -600, 400)
  camera.lookAt(0, 0, 0)

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Lighting
  scene.add(new THREE.AmbientLight(0x222244, 0.5))
  const dir = new THREE.DirectionalLight(0xffffff, 0.3)
  dir.position.set(0, 0, 500)
  scene.add(dir)

  // InstancedMesh for particles
  const geometry = new THREE.SphereGeometry(5, 12, 8)
  const material = new THREE.MeshBasicMaterial({
    // Unlit — always visible regardless of lighting
    transparent: true,
    opacity: 0.9,
  })
  mesh = new THREE.InstancedMesh(geometry, material, 1000)
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  scene.add(mesh)

  // Grid helper for orientation
  const grid = new THREE.PolarGridHelper(400, 32, 24, 64, 0x333355, 0x222244)
  scene.add(grid)

  // Stars background
  const starsGeo = new THREE.BufferGeometry()
  const starPositions = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 2000
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000
    starPositions[i * 3 + 2] = -100 - Math.random() * 500
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starsMat = new THREE.PointsMaterial({ color: 0x8888aa, size: 0.8 })
  scene.add(new THREE.Points(starsGeo, starsMat))

  dummy = new THREE.Object3D()
  lastTime = performance.now()

  // Start render loop
  animate()
}

/**
 * Main render loop.
 */
function animate(): void {
  animFrameId = requestAnimationFrame(animate)

  const now = performance.now()
  const dt = Math.min(0.05, (now - lastTime) / 1000) // cap dt to avoid spiral of death
  lastTime = now

  if (loopFn) loopFn(dt)
}

/**
 * Render one frame of particles.
 */
export function renderFrame(ctx: RenderContext): void {
  const { particles } = ctx
  const count = Math.min(particles.length, 1000)

  // Update instanced mesh
  for (let i = 0; i < count; i++) {
    const p = particles[i]
    dummy.position.set(p.x, p.y, p.z)
    dummy.scale.setScalar(Math.max(0.5, Math.min(4, p.mass * 0.5)))
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)

    // Color based on hue
    const [r, g, b] = hueToColor(p.hue)
    mesh.setColorAt(i, new THREE.Color(r / 255, g / 255, b / 255))
  }

  // Hide unused instances
  for (let i = count; i < 1000; i++) {
    dummy.position.set(0, -9999, 0)
    dummy.scale.setScalar(0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }

  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.count = count

  renderer.render(scene, camera)
}

/**
 * Get camera for OrbitControls setup.
 */
export function getCamera(): THREE.PerspectiveCamera {
  return camera
}

/**
 * Get renderer DOM element for controls.
 */
export function getRendererDom(): HTMLCanvasElement {
  return renderer.domElement
}

/**
 * Handle window resize.
 */
export function handleResize(canvas: HTMLCanvasElement): void {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width === 0 || height === 0) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
}

/**
 * Stop the render loop and clean up.
 */
export function stopRenderer(): void {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  if (mesh) {
    mesh.geometry.dispose()
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose())
    } else {
      mesh.material.dispose()
    }
  }
  if (renderer) renderer.dispose()
  loopFn = null
}

/**
 * Raycast to find particle at screen position.
 */
export function raycastParticle(
  mouseX: number,
  mouseY: number,
  particles: ParticleData[],
  canvas: HTMLCanvasElement,
): ParticleData | null {
  const raycaster = new THREE.Raycaster()
  raycaster.params.Points.threshold = 10

  const rect = canvas.getBoundingClientRect()
  const ndc = new THREE.Vector2(
    ((mouseX - rect.left) / rect.width) * 2 - 1,
    -((mouseY - rect.top) / rect.height) * 2 + 1,
  )

  raycaster.setFromCamera(ndc, camera)
  const intersects = raycaster.intersectObject(mesh)

  if (intersects.length > 0) {
    const idx = intersects[0].instanceId
    if (idx !== undefined && idx < particles.length) {
      return particles[idx]
    }
  }
  return null
}
