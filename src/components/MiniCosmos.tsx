'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const COUNT = 40
const RADIUS = 280
const COLORS = ['#FF5A3C', '#FF7B5A', '#ff8c6b', '#ffb088', '#e8a87c']

export function MiniCosmos() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, w / h, 1, 1000)
    camera.position.set(0, 80, 300)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Particles
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(COUNT * 3)
    const colorArr = new Float32Array(COUNT * 3)
    const speeds: { vx: number; vy: number; vz: number; dist: number }[] = []

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.4
      const r = RADIUS * (0.3 + Math.random() * 0.7)
      positions[i * 3] = Math.cos(theta) * Math.cos(phi) * r
      positions[i * 3 + 1] = Math.sin(phi) * r * 0.3
      positions[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r

      const c = new THREE.Color(COLORS[Math.floor(Math.random() * COLORS.length)])
      colorArr[i * 3] = c.r
      colorArr[i * 3 + 1] = c.g
      colorArr[i * 3 + 2] = c.b

      speeds.push({
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.08,
        vz: (Math.random() - 0.5) * 0.15,
        dist: r,
      })
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colorArr, 3))

    const material = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // Background stars
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(80 * 3)
    for (let i = 0; i < 80; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 600
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 200
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 400
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({
      size: 1,
      color: 0xffaa88,
      transparent: true,
      opacity: 0.3,
      blending: THREE.NormalBlending,
      depthWrite: false,
    })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // Animate
    let frame = 0
    let raf: number
    const animate = () => {
      raf = requestAnimationFrame(animate)
      frame++

      const pos = geometry.attributes.position.array as Float32Array
      for (let i = 0; i < COUNT; i++) {
        const s = speeds[i]
        const idx = i * 3
        // gentle circular drift
        pos[idx] += s.vx
        pos[idx + 1] += s.vy
        pos[idx + 2] += s.vz
        // soft boundary
        const d = Math.sqrt(pos[idx] ** 2 + pos[idx + 2] ** 2)
        if (d > RADIUS) {
          const scale = (RADIUS * 0.8) / d
          pos[idx] *= scale
          pos[idx + 2] *= scale
        }
        if (Math.abs(pos[idx + 1]) > 50) {
          pos[idx + 1] *= 0.9
          s.vy *= -1
        }
      }
      geometry.attributes.position.needsUpdate = true

      // gentle camera sway
      camera.position.x = Math.sin(frame * 0.001) * 20
      camera.position.y = 80 + Math.cos(frame * 0.0015) * 10
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      const nw = container.clientWidth
      const nh = container.clientHeight
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-60"
      style={{ minHeight: '500px' }}
    />
  )
}
