'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, GripHorizontal } from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'deepseek' | 'openai' | 'google' | 'figure' | 'xai' | 'anthropic' | 'other';
  impact: 1 | 2 | 3 | 4 | 5;
}

interface TimelineCanvasProps {
  events: TimelineEvent[];
  height?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  deepseek: '#E74C3C',
  openai: '#10A37F',
  google: '#4285F4',
  figure: '#9B59B6',
  xai: '#1DA1F2',
  anthropic: '#D4A574',
  other: '#3498DB',
};

const CATEGORY_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  google: 'Google',
  figure: 'Figure AI',
  xai: 'xAI',
  anthropic: 'Anthropic',
  other: 'Other',
};

/* ─── Utility: format time span for zoom level label ─── */
function formatTimeSpan(ms: number): string {
  const days = ms / (24 * 60 * 60 * 1000);
  if (days >= 365) return `${Math.round(days / 365)}Y`;
  if (days >= 30) return `${Math.round(days / 30)}M`;
  if (days >= 7) return `${Math.round(days / 7)}W`;
  return `${Math.round(days)}D`;
}

/* ─── Utility: generate ticks based on zoom level ─── */
interface Tick {
  time: number;
  label: string;
  major: boolean;
}

function generateTicks(startTime: number, endTime: number, width: number): Tick[] {
  const span = endTime - startTime;
  const pxPerMs = width / span;
  const ticks: Tick[] = [];

  const start = new Date(startTime);
  const end = new Date(endTime);

  // Determine granularity based on span
  if (span > 2 * 365 * 24 * 60 * 60 * 1000) {
    // > 2 years: year ticks
    const yearStart = start.getFullYear();
    const yearEnd = end.getFullYear();
    for (let y = yearStart; y <= yearEnd; y++) {
      const t = new Date(y, 0, 1).getTime();
      if (t >= startTime - span * 0.1 && t <= endTime + span * 0.1) {
        ticks.push({ time: t, label: String(y), major: true });
      }
    }
  } else if (span > 90 * 24 * 60 * 60 * 1000) {
    // 3 months - 2 years: month ticks
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current.getTime() <= end.getTime()) {
      const t = current.getTime();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const label = span > 365 * 24 * 60 * 60 * 1000
        ? `${monthNames[current.getMonth()]} '${String(current.getFullYear()).slice(2)}`
        : monthNames[current.getMonth()];
      if (t >= startTime - span * 0.05 && t <= endTime + span * 0.05) {
        ticks.push({ time: t, label, major: current.getMonth() % 3 === 0 });
      }
      current.setMonth(current.getMonth() + 1);
    }
  } else if (span > 7 * 24 * 60 * 60 * 1000) {
    // 1 week - 3 months: day ticks, show every ~7 days or 1st of month
    const dayMs = 24 * 60 * 60 * 1000;
    const interval = span > 30 * dayMs ? 7 * dayMs : 1 * dayMs;
    const current = new Date(Math.floor(startTime / interval) * interval);
    while (current.getTime() <= end.getTime()) {
      const t = current.getTime();
      const isFirstDay = current.getDate() === 1;
      const label = isFirstDay
        ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][current.getMonth()]} ${current.getDate()}`
        : `${current.getMonth() + 1}/${current.getDate()}`;
      if (t >= startTime - span * 0.02 && t <= endTime + span * 0.02) {
        ticks.push({ time: t, label, major: isFirstDay || current.getDay() === 1 });
      }
      current.setTime(current.getTime() + interval);
    }
  } else {
    // < 1 week: hour ticks
    const hourMs = 60 * 60 * 1000;
    const interval = span > 2 * 24 * hourMs ? 6 * hourMs : span > 12 * hourMs ? 3 * hourMs : hourMs;
    const current = new Date(Math.floor(startTime / interval) * interval);
    while (current.getTime() <= end.getTime()) {
      const t = current.getTime();
      const hours = current.getHours();
      const label = `${hours.toString().padStart(2, '0')}:00`;
      if (t >= startTime - span * 0.02 && t <= endTime + span * 0.02) {
        ticks.push({ time: t, label, major: hours === 0 || hours === 12 });
      }
      current.setTime(current.getTime() + interval);
    }
  }

  return ticks;
}

/* ─── Utility: cluster overlapping events ─── */
interface EventCluster {
  events: TimelineEvent[];
  centerTime: number;
  x: number; // cached screen position
}

function clusterEvents(
  events: TimelineEvent[],
  startTime: number,
  endTime: number,
  width: number,
  thresholdPx: number = 40
): EventCluster[] {
  const span = endTime - startTime;
  const clusters: EventCluster[] = [];

  for (const event of events) {
    const t = new Date(event.date).getTime();
    const x = ((t - startTime) / span) * width;

    // Find nearest cluster
    let merged = false;
    for (const cluster of clusters) {
      if (Math.abs(cluster.x - x) < thresholdPx) {
        cluster.events.push(event);
        // Recalculate center as average
        const totalTime = cluster.events.reduce((sum, e) => sum + new Date(e.date).getTime(), 0);
        cluster.centerTime = totalTime / cluster.events.length;
        cluster.x = ((cluster.centerTime - startTime) / span) * width;
        merged = true;
        break;
      }
    }

    if (!merged) {
      clusters.push({ events: [event], centerTime: t, x });
    }
  }

  return clusters;
}

export default function TimelineCanvas({ events, height = 500 }: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; event: TimelineEvent } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; time: number } | null>(null);
  const [zoomLabel, setZoomLabel] = useState('');

  // View state (using refs for animation loop performance)
  const viewRef = useRef({
    startTime: new Date('2025-01-01').getTime(),
    endTime: new Date('2025-09-01').getTime(),
    targetStartTime: new Date('2025-01-01').getTime(),
    targetEndTime: new Date('2025-09-01').getTime(),
    animating: false,
  });

  const dragRef = useRef({
    isDragging: false,
    lastX: 0,
    startTimeOnDrag: 0,
    endTimeOnDrag: 0,
  });

  // Momentum state
  const momentumRef = useRef({
    velocity: 0,
    animating: false,
    lastTime: 0,
    positions: [] as { x: number; t: number }[],
  });

  // Touch state
  const touchRef = useRef({ lastDist: 0, lastCenterX: 0, isPinching: false });

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Time bounds for "All" view
  const allStartTime = sortedEvents.length > 0
    ? Math.min(...sortedEvents.map(e => new Date(e.date).getTime()))
    : new Date('2025-01-01').getTime();
  const allEndTime = sortedEvents.length > 0
    ? Math.max(...sortedEvents.map(e => new Date(e.date).getTime()))
    : new Date('2025-09-01').getTime();

  // Convert time to x position
  const timeToX = useCallback((time: number, canvasWidth: number, startTime: number, endTime: number) => {
    const ratio = (time - startTime) / (endTime - startTime);
    return ratio * canvasWidth;
  }, []);

  // Convert x position to time
  const xToTime = useCallback((x: number, canvasWidth: number, startTime: number, endTime: number) => {
    const ratio = x / canvasWidth;
    return startTime + ratio * (endTime - startTime);
  }, []);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const view = viewRef.current;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    const centerY = height / 2;
    const timelineY = centerY;

    // ── Grid & Ticks ──
    const ticks = generateTicks(view.startTime, view.endTime, width);

    // Vertical grid lines
    ticks.forEach(tick => {
      const x = timeToX(tick.time, width, view.startTime, view.endTime);
      if (x < 0 || x > width) return;

      ctx.strokeStyle = tick.major ? 'rgba(55, 65, 81, 0.5)' : 'rgba(55, 65, 81, 0.2)';
      ctx.lineWidth = tick.major ? 1 : 0.5;
      ctx.setLineDash(tick.major ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw main timeline axis
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, timelineY);
    ctx.lineTo(width, timelineY);
    ctx.stroke();

    // Tick labels
    ticks.forEach(tick => {
      const x = timeToX(tick.time, width, view.startTime, view.endTime);
      if (x < 40 || x > width - 40) return;

      ctx.font = tick.major ? 'bold 12px sans-serif' : '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = tick.major ? '#9ca3af' : '#6b7280';
      ctx.fillText(tick.label, x, timelineY + 28);

      // Tick mark
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = tick.major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, timelineY - (tick.major ? 6 : 4));
      ctx.lineTo(x, timelineY + (tick.major ? 6 : 4));
      ctx.stroke();
    });

    // ── Events (with clustering) ──
    const span = view.endTime - view.startTime;
    const minPxPerEvent = 30; // minimum pixels between events before clustering
    const shouldCluster = (span / width) > (2 * 24 * 60 * 60 * 1000) / minPxPerEvent;

    if (shouldCluster) {
      const clusters = clusterEvents(sortedEvents, view.startTime, view.endTime, width, minPxPerEvent);

      clusters.forEach((cluster, index) => {
        const x = timeToX(cluster.centerTime, width, view.startTime, view.endTime);
        if (x < -50 || x > width + 50) return;

        const isAbove = index % 2 === 0;
        const clusterSize = cluster.events.length;

        // Use the highest impact event's color
        const maxImpactEvent = cluster.events.reduce((max, e) => e.impact > max.impact ? e : max, cluster.events[0]);
        const color = CATEGORY_COLORS[maxImpactEvent.category] || '#888';
        const radius = 6 + Math.min(clusterSize * 2, 10);

        // Connection line
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, timelineY);
        ctx.lineTo(x, isAbove ? timelineY - 50 : timelineY + 50);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Cluster dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, timelineY, radius, 0, Math.PI * 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Count badge
        if (clusterSize > 1) {
          ctx.fillStyle = '#fff';
          ctx.font = `bold ${Math.min(11 + clusterSize, 14)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(clusterSize), x, timelineY);
        }

        // Glow for high impact
        if (maxImpactEvent.impact >= 4) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.arc(x, timelineY, radius + 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }

        // Label (first event title + count if >1)
        const labelY = isAbove ? timelineY - 75 : timelineY + 90;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#f9fafb';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const labelText = clusterSize > 1 ? `${maxImpactEvent.title} +${clusterSize - 1}` : maxImpactEvent.title;
        ctx.fillText(labelText, x, labelY);

        // Date range label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#9ca3af';
        const dates = cluster.events.map(e => new Date(e.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const dateStr = clusterSize > 1
          ? `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.fillText(dateStr, x, isAbove ? labelY - 14 : labelY + 14);
      });
    } else {
      // No clustering — show individual events
      sortedEvents.forEach((event, index) => {
        const eventTime = new Date(event.date).getTime();
        const x = timeToX(eventTime, width, view.startTime, view.endTime);

        if (x < -50 || x > width + 50) return;

        const isAbove = index % 2 === 0;
        const color = CATEGORY_COLORS[event.category] || '#888';
        const radius = 4 + event.impact * 1.5;

        // Connection line
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(x, timelineY);
        ctx.lineTo(x, isAbove ? timelineY - 60 : timelineY + 60);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Event dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, timelineY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glow effect for high impact
        if (event.impact >= 4) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(x, timelineY, radius + 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }

        // Event label
        const labelY = isAbove ? timelineY - 80 : timelineY + 95;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#f9fafb';
        ctx.textAlign = 'center';
        ctx.fillText(event.title, x, labelY);

        // Date label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#9ca3af';
        const dateStr = new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        ctx.fillText(dateStr, x, isAbove ? labelY - 14 : labelY + 14);
      });
    }

    // ── Crosshair ──
    if (crosshair) {
      const cx = crosshair.x;
      const cy = crosshair.y || timelineY;

      // Vertical line
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Date label at bottom
      const date = new Date(crosshair.time);
      const span = view.endTime - view.startTime;
      const dateLabel = span > 365 * 24 * 60 * 60 * 1000
        ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        : span > 7 * 24 * 60 * 60 * 1000
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      ctx.font = '11px sans-serif';
      const textWidth = ctx.measureText(dateLabel).width;
      const padding = 8;
      const labelX = Math.max(textWidth / 2 + padding, Math.min(cx, width - textWidth / 2 - padding));

      // Label background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(labelX - textWidth / 2 - padding, height - 28, textWidth + padding * 2, 22, 4);
      ctx.fill();

      // Label text
      ctx.fillStyle = '#a78bfa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dateLabel, labelX, height - 17);
    }
  }, [sortedEvents, timeToX, crosshair]);

  // Animation loop for smooth transitions
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      const view = viewRef.current;
      const ease = 0.12;
      const diffStart = view.targetStartTime - view.startTime;
      const diffEnd = view.targetEndTime - view.endTime;

      if (Math.abs(diffStart) > 1 || Math.abs(diffEnd) > 1) {
        view.startTime += diffStart * ease;
        view.endTime += diffEnd * ease;
        view.animating = true;
        draw();
        animationId = requestAnimationFrame(animate);
      } else {
        view.startTime = view.targetStartTime;
        view.endTime = view.targetEndTime;
        view.animating = false;
        draw();
      }

      // Update zoom label
      const span = view.endTime - view.startTime;
      setZoomLabel(formatTimeSpan(span));
    };

    animate();
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  // Zoom handlers
  const zoom = useCallback((factor: number, centerX?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const cx = centerX ?? width / 2;

    const view = viewRef.current;
    const centerTime = xToTime(cx, width, view.startTime, view.endTime);
    const currentSpan = view.endTime - view.startTime;
    const newSpan = currentSpan * factor;

    // Clamp zoom
    const minSpan = 3 * 24 * 60 * 60 * 1000; // 3 days
    const maxSpan = (allEndTime - allStartTime) * 1.5 || 365 * 24 * 60 * 60 * 1000;
    const clampedSpan = Math.max(minSpan, Math.min(maxSpan, newSpan));

    view.targetStartTime = centerTime - (cx / width) * clampedSpan;
    view.targetEndTime = centerTime + ((width - cx) / width) * clampedSpan;
  }, [xToTime, allEndTime, allStartTime]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const factor = e.deltaY > 0 ? 1.12 : 0.88;
    zoom(factor, e.clientX - rect.left);
  }, [zoom]);

  // ── Mouse interactions with momentum ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Stop any ongoing momentum
    momentumRef.current.animating = false;
    momentumRef.current.positions = [];

    dragRef.current = {
      isDragging: true,
      lastX: e.clientX - rect.left,
      startTimeOnDrag: viewRef.current.startTime,
      endTimeOnDrag: viewRef.current.endTime,
    };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track for crosshair (always)
    const view = viewRef.current;
    const hoverTime = xToTime(x, rect.width, view.startTime, view.endTime);
    setCrosshair({ x, y, time: hoverTime });

    // Handle drag
    if (dragRef.current.isDragging) {
      const dx = x - dragRef.current.lastX;
      const width = rect.width;
      const timeSpan = dragRef.current.endTimeOnDrag - dragRef.current.startTimeOnDrag;
      const timeShift = -(dx / width) * timeSpan;

      viewRef.current.targetStartTime = dragRef.current.startTimeOnDrag + timeShift;
      viewRef.current.targetEndTime = dragRef.current.endTimeOnDrag + timeShift;

      // Track momentum
      const now = performance.now();
      momentumRef.current.positions.push({ x, t: now });
      // Keep last 5 positions
      if (momentumRef.current.positions.length > 5) {
        momentumRef.current.positions.shift();
      }

      return;
    }

    // Handle hover / tooltip (only when not dragging)
    let hoveredEvent: TimelineEvent | null = null;
    let minDist = Infinity;

    // Check against clusters or individual events
    const span = view.endTime - view.startTime;
    const shouldCluster = (span / rect.width) > (2 * 24 * 60 * 60 * 1000) / 30;

    if (shouldCluster) {
      const clusters = clusterEvents(sortedEvents, view.startTime, view.endTime, rect.width, 40);
      for (const cluster of clusters) {
        const cx = timeToX(cluster.centerTime, rect.width, view.startTime, view.endTime);
        const dist = Math.abs(x - cx);
        if (dist < 20 && dist < minDist) {
          minDist = dist;
          hoveredEvent = cluster.events.reduce((max, ev) => ev.impact > max.impact ? ev : max, cluster.events[0]);
        }
      }
    } else {
      sortedEvents.forEach(event => {
        const eventTime = new Date(event.date).getTime();
        const eventX = timeToX(eventTime, rect.width, view.startTime, view.endTime);
        const dist = Math.abs(x - eventX);
        if (dist < 20 && dist < minDist) {
          minDist = dist;
          hoveredEvent = event;
        }
      });
    }

    if (hoveredEvent) {
      setTooltip({ x, y: y - 10, event: hoveredEvent });
    } else {
      setTooltip(null);
    }
  }, [sortedEvents, timeToX, xToTime]);

  // Momentum animation
  const startMomentum = useCallback(() => {
    const positions = momentumRef.current.positions;
    if (positions.length < 2) return;

    const recent = positions.slice(-3);
    const dt = recent[recent.length - 1].t - recent[0].t;
    if (dt < 5) return; // Too fast, unreliable

    const dx = recent[recent.length - 1].x - recent[0].x;
    const velocity = dx / dt; // px per ms

    if (Math.abs(velocity) < 0.1) return; // Too slow

    momentumRef.current.velocity = velocity * 15; // Scale factor
    momentumRef.current.animating = true;

    const animateMomentum = () => {
      if (!momentumRef.current.animating) return;

      const v = momentumRef.current.velocity;
      if (Math.abs(v) < 0.5) {
        momentumRef.current.animating = false;
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const view = viewRef.current;
      const timeSpan = view.endTime - view.startTime;
      const timeShift = -(v / width) * timeSpan;

      viewRef.current.targetStartTime = view.targetStartTime + timeShift;
      viewRef.current.targetEndTime = view.targetEndTime + timeShift;

      momentumRef.current.velocity *= 0.92; // Friction
      requestAnimationFrame(animateMomentum);
    };

    requestAnimationFrame(animateMomentum);
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
    setCrosshair(null);

    // Start momentum
    startMomentum();
  }, [startMomentum]);

  const handleMouseLeave = useCallback(() => {
    dragRef.current.isDragging = false;
    setIsDragging(false);
    setTooltip(null);
    setCrosshair(null);
    momentumRef.current.animating = false;
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.lastDist = Math.sqrt(dx * dx + dy * dy);
      touchRef.current.lastCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchRef.current.isPinching = true;
    } else if (e.touches.length === 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dragRef.current = {
        isDragging: true,
        lastX: e.touches[0].clientX - rect.left,
        startTimeOnDrag: viewRef.current.startTime,
        endTimeOnDrag: viewRef.current.endTime,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 2 && touchRef.current.isPinching) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const factor = touchRef.current.lastDist / dist;
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      zoom(factor, centerX);
      touchRef.current.lastDist = dist;
    } else if (e.touches.length === 1 && dragRef.current.isDragging) {
      const x = e.touches[0].clientX - rect.left;
      const dx = x - dragRef.current.lastX;
      const timeSpan = dragRef.current.endTimeOnDrag - dragRef.current.startTimeOnDrag;
      const timeShift = -(dx / rect.width) * timeSpan;
      viewRef.current.targetStartTime = dragRef.current.startTimeOnDrag + timeShift;
      viewRef.current.targetEndTime = dragRef.current.endTimeOnDrag + timeShift;
    }
  }, [zoom]);

  const handleTouchEnd = useCallback(() => {
    dragRef.current.isDragging = false;
    touchRef.current.isPinching = false;
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    viewRef.current.targetStartTime = new Date('2025-01-01').getTime();
    viewRef.current.targetEndTime = new Date('2025-09-01').getTime();
  }, []);

  // Zoom to span
  const zoomToSpan = useCallback((spanMs: number) => {
    const view = viewRef.current;
    const centerTime = (view.startTime + view.endTime) / 2;
    view.targetStartTime = centerTime - spanMs / 2;
    view.targetEndTime = centerTime + spanMs / 2;
  }, []);

  // Preset zoom levels
  const zoomPresets = [
    { label: '1W', span: 7 * 24 * 60 * 60 * 1000 },
    { label: '1M', span: 30 * 24 * 60 * 60 * 1000 },
    { label: '3M', span: 90 * 24 * 60 * 60 * 1000 },
    { label: '1Y', span: 365 * 24 * 60 * 60 * 1000 },
    { label: 'All', span: (allEndTime - allStartTime) * 1.2 },
  ];

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => zoom(0.75)}
          className="p-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoom(1.33)}
          className="p-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg text-xs text-slate-400 font-mono">
        {zoomLabel}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full rounded-xl border border-slate-800 ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        style={{ height: `${height}px` }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Zoom preset buttons */}
      <div className="mt-3 flex items-center justify-center gap-1">
        <GripHorizontal className="w-3 h-3 text-slate-600 mr-2" />
        {zoomPresets.map(preset => {
          const currentSpan = viewRef.current.endTime - viewRef.current.startTime;
          const isActive = Math.abs(currentSpan - preset.span) / preset.span < 0.3;
          return (
            <button
              key={preset.label}
              onClick={() => zoomToSpan(preset.span)}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                isActive
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[240px]">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CATEGORY_COLORS[tooltip.event.category] }}
              />
              <span className="text-xs text-slate-400 uppercase tracking-wide">
                {CATEGORY_LABELS[tooltip.event.category]}
              </span>
              <span className="ml-auto text-xs">
                {'⭐'.repeat(tooltip.event.impact)}
              </span>
            </div>
            <h4 className="font-bold text-white mb-1">{tooltip.event.title}</h4>
            <p className="text-xs text-slate-300 mb-2">
              {new Date(tooltip.event.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">{tooltip.event.description}</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2 text-xs text-slate-400">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[key] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Interaction hint */}
      <div className="mt-3 text-center text-xs text-slate-600 flex items-center justify-center gap-1">
        <span>Scroll to zoom</span>
        <span className="mx-1">·</span>
        <span>Drag to pan</span>
        <span className="mx-1">·</span>
        <span>Click events for details</span>
      </div>
    </div>
  );
}
