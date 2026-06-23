// features/universe/engine/renderer3D.ts
// Three.js Points renderer for particle universe v2.1
// Simple colored dots — no fancy blending, just big visible particles

import * as THREE from 'three'
import type { ParticleData, FusionEvent } from '../types/universe.types'
import { hueToColor } from './forceMap'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let points: THREE.Points
let positions: Float32Array
let colors: Float32Array
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

  // === DEBUG: Large glowing test spheres to verify the renderer works ===
  const debugGeo = new THREE.SphereGeometry(80, 16, 12)
  const debugMat = new THREE.MeshBasicMaterial({ color: 0xff4444 })
  const debugSphere = new THREE.Mesh(debugGeo, debugMat)
  debugSphere.position.set(100, 100, 0)
  scene.add(debugSphere)

  const debugGeo2 = new THREE.SphereGeometry(60, 16, 12)
  const debugMat2 = new THREE.MeshBasicMaterial({ color: 0x44ff44 })
  const debugSphere2 = new THREE.Mesh(debugGeo2, debugMat2)
  debugSphere2.position.set(700, 500, 0)
  scene.add(debugSphere2)

  const debugGeo3 = new THREE.SphereGeometry(50, 16, 12)
  const debugMat3 = new THREE.MeshBasicMaterial({ color: 0x4444ff })
  const debugSphere3 = new THREE.Mesh(debugGeo3, debugMat3)
  debugSphere3.position.set(400, 300, -50)
  scene.add(debugSphere3)
  // === END DEBUG ===

  // Stars background
  const starsGeo = new THREE.BufferGeometry()
  const starPositions = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 2000
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2000
    starPositions[i * 3 + 2] = -100 - Math.random() * 500
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starsMat = new THREE.PointsMaterial({ color: 0x8888aa, size: 3 })
  scene.add(new THREE.Points(starsGeo, starsMat))

  // Grid ring
  const grid = new THREE.PolarGridHelper(400, 32, 24, 64, 0x333355, 0x222244)
  scene.add(grid)

  // Particle points — BIG, simple, no additive blending
  positions = new Float32Array(MAX_PARTICLES * 3)
  colors = new Float32Array(MAX_PARTICLES * 3)

  bufferGeo = new THREE.BufferGeometry()
  bufferGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  bufferGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  bufferGeo.setDrawRange(0, 0)

  // Soft circle sprite
  const spriteCanvas = document.createElement('canvas')
  spriteCanvas.width = 64
  spriteCanvas.height = 64
  const ctx = spriteCanvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.15)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  const spriteTexture = new THREE.CanvasTexture(spriteCanvas)

  const pointsMat = new THREE.PointsMaterial({
    size: 25,               // BIG dots
    map: spriteTexture,
    vertexColors: true,
    blending: THREE.NormalBlending,  // No additive — just normal
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
  }

  // Hide unused
  for (let i = count; i < MAX_PARTICLES; i++) {
    positions[i * 3] = -9999
    positions[i * 3 + 1] = -9999
    positions[i * 3 + 2] = -9999
    colors[i * 3] = 0
    colors[i * 3 + 1] = 0
    colors[i * 3 + 2] = 0
  }

  bufferGeo.attributes.position.needsUpdate = true
  bufferGeo.attributes.color.needsUpdate = true
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
  raycaster.params.Points.threshold = 30

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
