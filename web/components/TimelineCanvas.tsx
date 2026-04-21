'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, GripHorizontal } from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: string;
  impact: 1 | 2 | 3 | 4 | 5 | 6;
  company?: string;
}

interface TimelineCanvasProps {
  events: TimelineEvent[];
  height?: number;
  categoryColors?: Record<string, string>;
  categoryLabels?: Record<string, string>;
  colorBy?: 'category' | 'company';
  companyColors?: Record<string, string>;
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

export default function TimelineCanvas({ 
  events, 
  height = 600,
  categoryColors: customColors,
  categoryLabels: customLabels,
  colorBy = 'category',
  companyColors: customCompanyColors,
}: TimelineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; event: TimelineEvent } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number; time: number } | null>(null);
  const [zoomLabel, setZoomLabel] = useState('');

  const CATEGORY_COLORS = customColors || {
    deepseek: '#E74C3C',
    openai: '#10A37F',
    google: '#4285F4',
    figure: '#9B59B6',
    xai: '#1DA1F2',
    anthropic: '#D4A574',
    other: '#3498DB',
    milestone: '#f59e0b',
    product: '#10b981',
    research: '#8b5cf6',
    personnel: '#ef4444',
    legal: '#f97316',
  };

  const CATEGORY_LABELS = customLabels || {
    deepseek: 'DeepSeek',
    openai: 'OpenAI',
    google: 'Google',
    figure: 'Figure AI',
    xai: 'xAI',
    anthropic: 'Anthropic',
    other: 'Other',
    milestone: 'Milestone',
    product: 'Product',
    research: 'Research',
    personnel: 'Personnel',
    legal: 'Legal',
  };

  const COMPANY_COLORS = customCompanyColors || {
    openai: '#10A37F',
    deepseek: '#E74C3C',
    google: '#4285F4',
    anthropic: '#D4A574',
    xai: '#1DA1F2',
    meta: '#0668E1',
    figure: '#9B59B6',
    kimi: '#00D26A',
    qwen: '#FF6A00',
  };

  // Helper to get color based on colorBy setting
  const getColor = (event: TimelineEvent) => {
    if (colorBy === 'company' && event.company) {
      return COMPANY_COLORS[event.company] || '#888';
    }
    return CATEGORY_COLORS[event.category] || '#888';
  };

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

  // Auto-fit view when events change (e.g., company filter toggled)
  useEffect(() => {
    if (sortedEvents.length > 0) {
      const padding = (allEndTime - allStartTime) * 0.05;
      viewRef.current = {
        startTime: allStartTime - padding,
        endTime: allEndTime + padding,
        targetStartTime: allStartTime - padding,
        targetEndTime: allEndTime + padding,
        animating: false,
      };
      draw();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.map(e => e.id).join(','), allStartTime, allEndTime]);
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

    // Pre-compute singularity x positions for timeline break
    const singularityXs = sortedEvents
      .filter(e => e.impact >= 6)
      .map(e => timeToX(new Date(e.date).getTime(), width, view.startTime, view.endTime))
      .filter(x => x >= -50 && x <= width + 50)
      .sort((a, b) => a - b);

    // Draw main timeline axis — broken at singularity points, color shifts after each singularity
    if (singularityXs.length === 0) {
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, timelineY);
      ctx.lineTo(width, timelineY);
      ctx.stroke();
    } else {
      // Draw timeline segments with color shifts
      let currentX = 0;
      const gapRadius = 24;
      let isAfterSingularity = false;

      for (const sx of singularityXs) {
        // Segment before this singularity
        if (sx - gapRadius > currentX) {
          ctx.strokeStyle = isAfterSingularity ? 'rgba(255, 215, 0, 0.35)' : 'rgba(139, 92, 246, 0.3)';
          ctx.lineWidth = isAfterSingularity ? 2.5 : 2;
          ctx.beginPath();
          ctx.moveTo(currentX, timelineY);
          ctx.lineTo(sx - gapRadius, timelineY);
          ctx.stroke();
        }
        currentX = sx + gapRadius;
        isAfterSingularity = true;
      }
      // Final segment after last singularity
      if (currentX < width) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(currentX, timelineY);
        ctx.lineTo(width, timelineY);
        ctx.stroke();
      }
    }

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

    /* ── Smart Label Layout: collision detection with dynamic Y levels ── */
interface LabelItem {
  x: number;
  text: string;
  dateText: string;
  color: string;
  radius: number;
  eventX: number;
  isCluster: boolean;
  clusterSize: number;
  impact: number;
  textLines?: string[];
  textWidth?: number;
}

interface LabelLayout {
  item: LabelItem;
  level: number;
  isAbove: boolean;
}

function measureTextWidth(ctx: CanvasRenderingContext2D, text: string, font: string): number {
  ctx.font = font;
  return ctx.measureText(text).width;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string[] {
  ctx.font = font;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

function computeLabelLayout(
  ctx: CanvasRenderingContext2D,
  items: LabelItem[],
  timelineY: number,
  labelFont: string = 'bold 11px sans-serif',
  dateFont: string = '10px sans-serif',
  minGap: number = 40
): LabelLayout[] {
  if (items.length === 0) return [];

  const maxLineWidth = 130;

  // Wrap text and measure widths
  const measured = items.map(item => {
    const lines = wrapText(ctx, item.text, labelFont, maxLineWidth);
    const lineWidths = lines.map(line => measureTextWidth(ctx, line, labelFont));
    const maxTextWidth = Math.max(...lineWidths, measureTextWidth(ctx, item.dateText, dateFont));
    item.textLines = lines;
    item.textWidth = maxTextWidth;
    return { item, textWidth: maxTextWidth };
  });

  // Sort by x position
  measured.sort((a, b) => a.item.x - b.item.x);

  // Separate into above/below groups (alternating)
  const above: typeof measured = [];
  const below: typeof measured = [];
  measured.forEach((m, i) => {
    if (i % 2 === 0) above.push(m);
    else below.push(m);
  });

  // Assign levels within a group
  function assignLevels(group: typeof measured): LabelLayout[] {
    const layouts: LabelLayout[] = [];
    // levels[0] = closest to timeline, levels[1] = further out, etc.
    const levelRanges: Array<{ min: number; max: number }> = [];

    for (const { item, textWidth } of group) {
      const halfW = textWidth / 2 + minGap;
      let assignedLevel = 0;

      // Try each level from 0 upward
      while (true) {
        if (assignedLevel >= levelRanges.length) {
          levelRanges.push({ min: item.x - halfW, max: item.x + halfW });
          break;
        }

        const range = levelRanges[assignedLevel];
        // Check if this item fits in this level
        if (item.x + halfW < range.min || item.x - halfW > range.max) {
          // No overlap with existing range in this level
          // But we need to check all items in this level, not just the range union
          // Let's track occupied segments per level
          break;
        }
        assignedLevel++;
      }

      layouts.push({ item, level: assignedLevel, isAbove: group === above });
    }

    // Redo with proper per-level collision detection
    // Actually, let's use a cleaner approach: track occupied intervals per level
    return [];
  }

  // Better approach: greedy level assignment with interval tracking
  function assignLevelsProper(items: typeof measured, isAboveGroup: boolean): LabelLayout[] {
    const layouts: LabelLayout[] = [];
    // levelOccupied[level] = array of [minX, maxX] intervals
    const levelOccupied: Array<Array<[number, number]>> = [];

    for (const { item, textWidth } of items) {
      const halfW = textWidth / 2 + minGap;
      const itemMin = item.x - halfW;
      const itemMax = item.x + halfW;

      let level = 0;
      while (true) {
        if (!levelOccupied[level]) {
          levelOccupied[level] = [[itemMin, itemMax]];
          layouts.push({ item, level, isAbove: isAboveGroup });
          break;
        }

        // Check collision with all intervals in this level
        let collides = false;
        for (const [occMin, occMax] of levelOccupied[level]) {
          if (itemMin < occMax && itemMax > occMin) {
            collides = true;
            break;
          }
        }

        if (!collides) {
          levelOccupied[level].push([itemMin, itemMax]);
          layouts.push({ item, level, isAbove: isAboveGroup });
          break;
        }

        level++;
      }
    }

    return layouts;
  }

  return [
    ...assignLevelsProper(above, true),
    ...assignLevelsProper(below, false),
  ];
}
    const span = view.endTime - view.startTime;
    const minPxPerEvent = 50;
    const shouldCluster = (span / width) > (2 * 24 * 60 * 60 * 1000) / minPxPerEvent;

    // Prepare label items for smart layout
    const labelItems: LabelItem[] = [];

    if (shouldCluster) {
      const clusters = clusterEvents(sortedEvents, view.startTime, view.endTime, width, minPxPerEvent);
      clusters.forEach(cluster => {
        const x = timeToX(cluster.centerTime, width, view.startTime, view.endTime);
        if (x < -100 || x > width + 100) return;
        const maxImpactEvent = cluster.events.reduce((max, e) => e.impact > max.impact ? e : max, cluster.events[0]);
        const dates = cluster.events.map(e => new Date(e.date));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const dateStr = cluster.events.length > 1
          ? `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labelItems.push({
          x,
          text: cluster.events.length > 1 ? `${maxImpactEvent.title} +${cluster.events.length - 1}` : maxImpactEvent.title,
          dateText: dateStr,
          color: getColor(maxImpactEvent),
          radius: 6 + Math.min(cluster.events.length * 2, 10),
          eventX: x,
          isCluster: true,
          clusterSize: cluster.events.length,
          impact: maxImpactEvent.impact,
        });
      });
    } else {
      sortedEvents.forEach(event => {
        const eventTime = new Date(event.date).getTime();
        const x = timeToX(eventTime, width, view.startTime, view.endTime);
        if (x < -100 || x > width + 100) return;
        labelItems.push({
          x,
          text: event.title,
          dateText: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          color: getColor(event),
          radius: event.impact >= 6 ? 8 + event.impact * 1.2 : 4 + event.impact * 1.5,
          eventX: x,
          isCluster: false,
          clusterSize: 1,
          impact: event.impact,
        });
      });
    }

    // Compute smart label layout
    const layouts = computeLabelLayout(ctx, labelItems, timelineY);

    // Collect singularity events for separate rendering
    const singularityLayouts = layouts.filter(l => l.item.impact >= 6);
    const normalLayouts = layouts.filter(l => l.item.impact < 6);

    // ── Singularity: The Bookmark ──
    // 6⭐ events are bookmarks in the fabric of time — a blade inserted into history
    if (singularityLayouts.length > 0) {
      singularityLayouts.forEach(layout => {
        const { item } = layout;
        const cx = item.eventX;
        const cy = timelineY;

        const bladeW = 5;
        const bladeH = 110;
        const topY = cy - bladeH;

        // Blade body: solid white rectangle
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - bladeW / 2, topY, bladeW, bladeH);

        // Blade tip: inverted V
        ctx.beginPath();
        ctx.moveTo(cx - bladeW / 2, topY);
        ctx.lineTo(cx + bladeW / 2, topY);
        ctx.lineTo(cx, topY - 10);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Scorch marks at base where timeline was cut
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          ctx.beginPath();
          ctx.moveTo(cx + side * (bladeW / 2 + 1), cy);
          ctx.lineTo(cx + side * (bladeW / 2 + 4 + i), cy - 3 - i * 2);
          ctx.stroke();
        }

        // Title to the right of blade (not above — beside)
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.text, cx + bladeW / 2 + 12, topY + 20);

        // Date below title
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(item.dateText, cx + bladeW / 2 + 12, topY + 36);
      });
    }

    // Draw connection lines for normal events only
    normalLayouts.forEach(layout => {
      const { item, level, isAbove } = layout;
      const stemLength = 38 + level * 42;
      const endY = isAbove ? timelineY - stemLength : timelineY + stemLength;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(item.eventX, timelineY);
      ctx.lineTo(item.x, endY);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw event dots for normal events only
    normalLayouts.forEach(layout => {
      const { item } = layout;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(item.eventX, timelineY, item.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow for high impact
      if (item.impact >= 5) {
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = item.color;
        ctx.globalAlpha = item.isCluster ? 0.25 : 0.4;
        ctx.beginPath();
        ctx.arc(item.eventX, timelineY, item.radius + (item.isCluster ? 10 : 8), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      } else if (item.impact === 4) {
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = item.color;
        ctx.globalAlpha = item.isCluster ? 0.15 : 0.25;
        ctx.beginPath();
        ctx.arc(item.eventX, timelineY, item.radius + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }

      // Cluster count badge
      if (item.isCluster && item.clusterSize > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(11 + item.clusterSize, 14)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(item.clusterSize), item.eventX, timelineY);
      }
    });

    // Draw labels: singularity events get larger golden labels near orbit
    singularityLayouts.forEach(layout => {
      const { item } = layout;
      const orbitY = timelineY - 90;
      const labelY = orbitY - 18;

      if (labelY < 18) return;

      const lines = item.textLines && item.textLines.length > 0 ? item.textLines : [item.text];
      const lineHeight = 14;
      const totalTextHeight = lines.length * lineHeight;

      // Title (larger, golden, multi-line)
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      lines.forEach((line, i) => {
        const yOffset = (lines.length - 1 - i) * lineHeight;
        ctx.fillText(line, item.x, labelY - yOffset);
      });

      // Date
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.fillText(item.dateText, item.x, labelY - totalTextHeight - 4);
    });

    // Draw labels for normal events
    normalLayouts.forEach(layout => {
      const { item, level, isAbove } = layout;
      const labelY = isAbove
        ? timelineY - (38 + level * 42) - 8
        : timelineY + (38 + level * 42) + 14;

      // Skip if label would be clipped
      if (labelY < 18 || labelY > height - 18) return;

      const lines = item.textLines && item.textLines.length > 0 ? item.textLines : [item.text];
      const lineHeight = 13;
      const totalTextHeight = lines.length * lineHeight;

      // Title (multi-line)
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#f9fafb';
      ctx.textAlign = 'center';
      ctx.textBaseline = isAbove ? 'bottom' : 'top';

      lines.forEach((line, i) => {
        const yOffset = isAbove
          ? (lines.length - 1 - i) * lineHeight
          : i * lineHeight;
        ctx.fillText(line, item.x, labelY + (isAbove ? -yOffset : yOffset));
      });

      // Date
      const dateOffset = isAbove ? -totalTextHeight - 4 : totalTextHeight + 4;
      const dateY = labelY + dateOffset;
      if (dateY >= 12 && dateY <= height - 12) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(item.dateText, item.x, dateY);
      }
    });

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
      } else {
        view.startTime = view.targetStartTime;
        view.endTime = view.targetEndTime;
        view.animating = false;
      }

      draw();
      animationId = requestAnimationFrame(animate);

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
    const padding = (allEndTime - allStartTime) * 0.05;
    viewRef.current.targetStartTime = allStartTime - padding;
    viewRef.current.targetEndTime = allEndTime + padding;
  }, [allStartTime, allEndTime]);

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
                style={{ backgroundColor: getColor(tooltip.event) }}
              />
              <span className="text-xs text-slate-400 uppercase tracking-wide">
                {colorBy === 'company' && tooltip.event.company
                  ? tooltip.event.company.toUpperCase()
                  : CATEGORY_LABELS[tooltip.event.category]}
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
        {colorBy === 'company'
          ? Object.entries(COMPANY_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span>{key.toUpperCase()}</span>
              </div>
            ))
          : Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[key] }} />
                <span>{label}</span>
              </div>
            ))
        }
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
