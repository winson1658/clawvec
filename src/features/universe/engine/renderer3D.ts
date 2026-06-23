// features/universe/engine/renderer3D.ts
// Three.js Points renderer for particle universe v2.1
// Switched from InstancedMesh to Points for reliable per-particle coloring

import * as THREE from 'three'
import type { ParticleData, FusionEvent } from '../types/universe.types'
import { hueToColor } from './forceMap'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let points: THREE.Points
let positions: Float32Array
let colors: Float32Array
let sizes: Float32Array
let bufferGeo: THREE.BufferGeometry
let animFrameId: number | null = null
let loopFn: ((dt: number) => void) | null = null
let lastTime = 0

export interface RenderContext {
  particles: ParticleData[]
  fusions: FusionEvent[]
  viewMode: 'orbit' | 'inspect'
  selectedParticleId: string | null
}

const MAX_PARTICLES = 1000

export function initRenderer(
  canvas: HTMLCanvasElement,
  onLoop: (dt: number) => void,
): void {
  loopFn = onLoop

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  // Scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0a0a14')

  // Camera — looking at the galactic disk from above
  camera = new THREE.PerspectiveCamera(50, width / height, 10, 10000)
  camera.position.set(400, 300, 800)
  camera.lookAt(400, 300, 0)

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Stars background (small white dots behind everything)
  const starsGeo = new THREE.BufferGeometry()
  const starPositions = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 2000
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000
    starPositions[i * 3 + 2] = -100 - Math.random() * 500
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starsMat = new THREE.PointsMaterial({ color: 0x8888aa, size: 1.5 })
  scene.add(new THREE.Points(starsGeo, starsMat))

  // Grid ring for orientation
  const grid = new THREE.PolarGridHelper(400, 32, 24, 64, 0x333355, 0x222244)
  scene.add(grid)

  // Test sphere — verify renderer works
  const testGeo = new THREE.SphereGeometry(20, 16, 12)
  const testMat = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  const testSphere = new THREE.Mesh(testGeo, testMat)
  testSphere.position.set(400, 300, 0)
  scene.add(testSphere)

  // Particle points
  positions = new Float32Array(MAX_PARTICLES * 3)
  colors = new Float32Array(MAX_PARTICLES * 3)
  sizes = new Float32Array(MAX_PARTICLES)

  bufferGeo = new THREE.BufferGeometry()
  bufferGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  bufferGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  bufferGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  bufferGeo.setDrawRange(0, 0)

  // Use a circular sprite texture for soft dots
  const spriteCanvas = document.createElement('canvas')
  spriteCanvas.width = 32
  spriteCanvas.height = 32
  const ctx = spriteCanvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.3)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  const spriteTexture = new THREE.CanvasTexture(spriteCanvas)

  const pointsMat = new THREE.PointsMaterial({
    size: 12,
    map: spriteTexture,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  })

  points = new THREE.Points(bufferGeo, pointsMat)
  scene.add(points)

  lastTime = performance.now()
  animate()
}

function animate(): void {
  animFrameId = requestAnimationFrame(animate)
  const now = performance.now()
  const dt = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now
  if (loopFn) loopFn(dt)
}

export function renderFrame(ctx: RenderContext): void {
  const { particles } = ctx
  const count = Math.min(particles.length, MAX_PARTICLES)

  for (let i = 0; i < count; i++) {
    const p = particles[i]
    positions[i * 3] = p.x
    positions[i * 3 + 1] = p.y
    positions[i * 3 + 2] = p.z

    const [r, g, b] = hueToColor(p.hue)
    colors[i * 3] = r / 255
    colors[i * 3 + 1] = g / 255
    colors[i * 3 + 2] = b / 255

    sizes[i] = Math.max(6, Math.min(24, p.mass * 6))
  }

  // Hide unused
  for (let i = count; i < MAX_PARTICLES; i++) {
    positions[i * 3] = -9999
    positions[i * 3 + 1] = -9999
    positions[i * 3 + 2] = -9999
    colors[i * 3] = 0
    colors[i * 3 + 1] = 0
    colors[i * 3 + 2] = 0
    sizes[i] = 0
  }

  bufferGeo.attributes.position.needsUpdate = true
  bufferGeo.attributes.color.needsUpdate = true
  bufferGeo.attributes.size.needsUpdate = true
  bufferGeo.setDrawRange(0, count)

  renderer.render(scene, camera)
}

export function getCamera(): THREE.PerspectiveCamera {
  return camera
}

export function getRendererDom(): HTMLCanvasElement {
  return renderer.domElement
}

export function handleResize(canvas: HTMLCanvasElement): void {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width === 0 || height === 0) return
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height, false)
}

export function stopRenderer(): void {
  if (animFrameId !== null) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  if (points) {
    points.geometry.dispose()
    ;(points.material as THREE.Material).dispose()
  }
  if (renderer) renderer.dispose()
  loopFn = null
}

export function raycastParticle(
  mouseX: number,
  mouseY: number,
  particles: ParticleData[],
  canvas: HTMLCanvasElement,
): ParticleData | null {
  const raycaster = new THREE.Raycaster()
  raycaster.params.Points.threshold = 20

  const rect = canvas.getBoundingClientRect()
  const ndc = new THREE.Vector2(
    ((mouseX - rect.left) / rect.width) * 2 - 1,
    -((mouseY - rect.top) / rect.height) * 2 + 1,
  )

  raycaster.setFromCamera(ndc, camera)
  const intersects = raycaster.intersectObject(points)

  if (intersects.length > 0) {
    const idx = intersects[0].index
    if (idx !== undefined && idx < particles.length) {
      return particles[idx]
    }
  }
  return null
}
