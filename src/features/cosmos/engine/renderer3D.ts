// features/cosmos/engine/renderer3D.ts
// Three.js renderer — v2.1 InstancedMesh for performance

import * as THREE from 'three'
import type { ParticleData, FusionEvent, BurstEvent } from '../types/cosmos.types'
import { hueToColor } from './forceMap'

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let instancedMesh: THREE.InstancedMesh
let dummy: THREE.Object3D
let animFrameId: number | null = null
let loopFn: ((dt: number) => void) | null = null
let lastTime = 0

export interface RenderContext {
  particles: ParticleData[]
  fusions: FusionEvent[]
  bursts: BurstEvent[]
  viewMode: 'orbit' | 'inspect'
  selectedParticleId: string | null
}

const MAX_PARTICLES = 10000  // v2.8: spatial grid enables 10K particles

export function initRenderer(
  canvas: HTMLCanvasElement,
  onLoop: (dt: number) => void,
): void {
  loopFn = onLoop

  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (width === 0 || height === 0) {
    console.error('[initRenderer] Canvas has zero size:', width, height)
    return
  }

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#0a0a1a')

  // Background stars (distant static starfield, behind camera)
  const starGeometry = new THREE.BufferGeometry()
  const starPositions = new Float32Array(200 * 3)
  for (let i = 0; i < 200; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 3000
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 3000
    starPositions[i * 3 + 2] = -2000  // fixed far behind camera
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 4,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: false,
  })
  const stars = new THREE.Points(starGeometry, starMaterial)
  scene.add(stars)

  // Ambient + directional light for depth
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(200, 400, 300)
  scene.add(dirLight)

  // ── XYZ Axis helper (debug) ──────────────────────────────────────
  const AXIS_CENTER = new THREE.Vector3(400, 300, 0)
  const AXIS_LEN = 400

  function addAxis(dir: THREE.Vector3, color: number, label: string): void {
    // Line
    const geo = new THREE.BufferGeometry()
    const start = AXIS_CENTER.clone()
    const end = AXIS_CENTER.clone().add(dir.clone().multiplyScalar(AXIS_LEN))
    geo.setFromPoints([start, end])
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.9 })
    scene.add(new THREE.Line(geo, mat))

    // Arrowhead (small cone)
    const coneGeo = new THREE.ConeGeometry(6, 20, 8)
    const coneMat = new THREE.MeshBasicMaterial({ color })
    const cone = new THREE.Mesh(coneGeo, coneMat)
    cone.position.copy(end)
    // Point cone along axis direction
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    scene.add(cone)

    // Negative direction (dashed feel: thinner, dimmer)
    const negGeo = new THREE.BufferGeometry()
    const negEnd = AXIS_CENTER.clone().add(dir.clone().multiplyScalar(-AXIS_LEN * 0.6))
    negGeo.setFromPoints([start, negEnd])
    const negMat = new THREE.LineBasicMaterial({ color, linewidth: 1, transparent: true, opacity: 0.35 })
    scene.add(new THREE.Line(negGeo, negMat))
  }

  addAxis(new THREE.Vector3(1, 0, 0), 0xff3333, 'X')  // Red → X
  addAxis(new THREE.Vector3(0, 1, 0), 0x33ff33, 'Y')  // Green → Y
  addAxis(new THREE.Vector3(0, 0, 1), 0x3388ff, 'Z')  // Blue → Z

  // Disk ring (reference: HARD_RADIUS ~350)
  const ringGeo = new THREE.RingGeometry(345, 355, 64)
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.15 })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.position.set(400, 300, 0)
  scene.add(ring)

  camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 50000)
  // 正前方視角：確保初始視錐涵蓋粒子群
  camera.position.set(400, 300, 1200)
  camera.lookAt(400, 300, 0)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(width, height, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // InstancedMesh: single geometry, per-instance color and transform
  const geometry = new THREE.SphereGeometry(1, 12, 12) // base size 1, scaled per instance
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  instancedMesh = new THREE.InstancedMesh(geometry, material, MAX_PARTICLES)
  instancedMesh.frustumCulled = false  // v2.5a: disable whole-mesh culling — GPU culls per-instance
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_PARTICLES * 3), 3)
  instancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage)
  instancedMesh.count = 0 // start with 0 visible
  scene.add(instancedMesh)

  dummy = new THREE.Object3D()

  lastTime = performance.now()
  animate()
}

function animate(): void {
  animFrameId = requestAnimationFrame(animate)
  const now = performance.now()
  const dt = Math.min(0.05, (now - lastTime) / 1000)
  lastTime = now
  try {
    if (loopFn) loopFn(dt)
  } catch (e: any) {
    console.error('[renderer3D] loop error:', e)
  }
}

export function renderFrame(ctx: RenderContext): void {
  const { particles } = ctx
  const count = Math.min(particles.length, MAX_PARTICLES)

  for (let i = 0; i < count; i++) {
    const p = particles[i]
    const [r, g, b] = hueToColor(p.hue)

    // Position
    dummy.position.set(p.x, p.y, p.z)

    // Scale: screen-space aware sizing — particles maintain visible size regardless of camera distance
    // Convert desired pixel size to world units based on camera distance
    const distToCamera = Math.max(dummy.position.distanceTo(camera.position), 5)
    const fov = camera.fov * (Math.PI / 180)
    const worldPerPixel = (2 * distToCamera * Math.tan(fov / 2)) / renderer.domElement.clientHeight
    
    // Target: 2 pixels on screen, grows with fusion count (capped in world-space)
    const basePixelSize = 2
    const fusedCount = p.fusedNames?.length || 0
    const growthMultiplier = 1 + fusedCount * 0.15  // 0 fused=1x, 5 fused=1.75x, 10 fused=2.5x
    const screenScale = basePixelSize * worldPerPixel * growthMultiplier
    // Cap world-space size to prevent fused particles dwarfing the disk when zoomed out
    const MAX_WORLD_SIZE = 20  // ~8% of disk radius
    const scale = Math.min(screenScale, MAX_WORLD_SIZE)
    dummy.scale.set(scale, scale, scale)

    dummy.updateMatrix()
    instancedMesh.setMatrixAt(i, dummy.matrix)

    // Color
    const color = new THREE.Color(r / 255, g / 255, b / 255)
    // Highlight selected particle
    if (ctx.selectedParticleId && p.id === ctx.selectedParticleId) {
      color.addScalar(0.3) // brighten
    }
    instancedMesh.setColorAt(i, color)
  }

  instancedMesh.count = count
  instancedMesh.instanceMatrix.needsUpdate = true
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true
  }

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
  if (instancedMesh) {
    instancedMesh.geometry.dispose()
    ;(instancedMesh.material as THREE.Material).dispose()
    scene.remove(instancedMesh)
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
  const rect = canvas.getBoundingClientRect()
  const clickX = mouseX - rect.left
  const clickY = mouseY - rect.top

  const CLICK_RADIUS = 12 // pixels — "fat finger" threshold
  let closestIdx = -1
  let closestDist = Infinity

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i]
    // Project 3D position to screen
    const screenPos = new THREE.Vector3(p.x, p.y, p.z).project(camera)

    // Skip particles behind camera
    if (screenPos.z > 1) continue

    // Convert NDC (-1..1) to canvas pixels
    const sx = ((screenPos.x + 1) / 2) * rect.width
    const sy = ((-screenPos.y + 1) / 2) * rect.height

    const dx = sx - clickX
    const dy = sy - clickY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < CLICK_RADIUS && dist < closestDist) {
      closestDist = dist
      closestIdx = i
    }
  }

  if (closestIdx >= 0) {
    return particles[closestIdx]
  }
  return null
}
