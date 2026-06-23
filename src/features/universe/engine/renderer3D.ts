// features/universe/engine/renderer3D.ts
// Three.js Points renderer — minimal, no textures, no stars, just BIG colored dots

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

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0a0a14')

  // Camera looking down at the particle field
  camera = new THREE.PerspectiveCamera(50, width / height, 10, 10000)
  camera.position.set(400, 300, 800)
  camera.lookAt(400, 300, 0)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // No stars. No debug spheres. Just particles.

  positions = new Float32Array(MAX_PARTICLES * 3)
  colors = new Float32Array(MAX_PARTICLES * 3)

  bufferGeo = new THREE.BufferGeometry()
  bufferGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  bufferGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  bufferGeo.setDrawRange(0, 0)

  // BIG flat colored dots — no texture, no blending tricks
  const pointsMat = new THREE.PointsMaterial({
    size: 20,
    vertexColors: true,
    blending: THREE.NormalBlending,
    depthWrite: true,
  })

  points = new THREE.Points(bufferGeo, pointsMat)
  scene.add(points)

  lastTime = performance.now()
  animate()
}

let frameCount = 0
let errorMsg = ''

function animate(): void {
  animFrameId = requestAnimationFrame(animate)
  const now = performance.now()
  const dt = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now
  frameCount++
  try {
    if (loopFn) loopFn(dt)
  } catch (e: any) {
    errorMsg = e?.message || String(e)
    console.error('[renderer3D] loop error:', e)
  }
}

export function getDebugInfo(): { frames: number; error: string } {
  return { frames: frameCount, error: errorMsg }
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
