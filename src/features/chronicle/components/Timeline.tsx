'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Milestone, ZoomPanState } from '../types/chronicle.types';
import { TimelineEvent } from './TimelineEvent';
import { EventDetail } from './EventDetail';

interface TimelineProps {
  milestones: Milestone[];
}

const MIN_ZOOM = 2; // min pixels per day
const MAX_ZOOM = 200; // max pixels per day
const ZOOM_SENSITIVITY = 0.001;

export function Timeline({ milestones }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomPan, setZoomPan] = useState<ZoomPanState>({ zoom: 10, offset: 0 });
  const [selectedEvent, setSelectedEvent] = useState<Milestone | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, offset: 0 });

  // Calculate date range
  const dates = milestones.map(m => new Date(m.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseDate = (mouseX + zoomPan.offset) / zoomPan.zoom;

    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomPan.zoom * (1 - e.deltaY * ZOOM_SENSITIVITY)));
    const newOffset = mouseDate * newZoom - mouseX;

    setZoomPan({ zoom: newZoom, offset: newOffset });
  }, [zoomPan]);

  // Mouse drag pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, offset: zoomPan.offset };
  }, [zoomPan.offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    setZoomPan(prev => ({ ...prev, offset: dragStart.current.offset - dx }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, offset: zoomPan.offset };
    }
  }, [zoomPan.offset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    setZoomPan(prev => ({ ...prev, offset: dragStart.current.offset - dx }));
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Convert date to x position
  const dateToX = (date: string) => {
    const days = (new Date(date).getTime() - minDate) / (1000 * 60 * 60 * 24);
    return days * zoomPan.zoom - zoomPan.offset;
  };

  // Generate time ticks
  const generateTicks = () => {
    const ticks = [];
    const pixelsPerYear = zoomPan.zoom * 365;
    
    let interval: number;
    if (pixelsPerYear > 100) interval = 1; // 1 year
    else if (pixelsPerYear > 50) interval = 2; // 2 years
    else if (pixelsPerYear > 20) interval = 5; // 5 years
    else interval = 10; // 10 years

    const startYear = new Date(minDate).getFullYear();
    const endYear = new Date(maxDate).getFullYear();

    for (let year = startYear; year <= endYear; year += interval) {
      const x = dateToX(`${year}-01-01`);
      if (x >= -100 && x <= (containerRef.current?.clientWidth || 0) + 100) {
        ticks.push({ year, x });
      }
    }
    return ticks;
  };

  const ticks = generateTicks();
  const visibleMilestones = milestones.filter(m => {
    const x = dateToX(m.date);
    return x >= -50 && x <= (containerRef.current?.clientWidth || 0) + 50;
  });

  return (
    <div className="relative w-full h-[500px] overflow-hidden select-none">
      {/* Timeline Container */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {ticks.map(tick => (
            <line
              key={tick.year}
              x1={tick.x}
              y1={0}
              x2={tick.x}
              y2={500}
              stroke="var(--color-line)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}
        </svg>

        {/* Time Axis */}
        <div className="absolute bottom-0 left-0 right-0 h-12 border-t border-[var(--color-line)] bg-[var(--color-background)]/80 backdrop-blur-sm">
          {ticks.map(tick => (
            <div
              key={tick.year}
              className="absolute top-2 text-xs text-[var(--color-text-tertiary)] transform -translate-x-1/2"
              style={{ left: tick.x }}
            >
              {tick.year}
            </div>
          ))}
        </div>

        {/* Events */}
        <div className="absolute top-0 left-0 right-0 bottom-12">
          {visibleMilestones.map((milestone, index) => (
            <TimelineEvent
              key={milestone.id}
              milestone={milestone}
              x={dateToX(milestone.date)}
              y={100 + (index % 3) * 120} // Stagger vertically
              onClick={() => setSelectedEvent(milestone)}
            />
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-16 right-4 flex gap-2">
        <button
          onClick={() => setZoomPan(prev => ({ ...prev, zoom: Math.min(MAX_ZOOM, prev.zoom * 1.5) }))}
          className="glass-strong rounded-lg p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setZoomPan(prev => ({ ...prev, zoom: Math.max(MIN_ZOOM, prev.zoom / 1.5) }))}
          className="glass-strong rounded-lg p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => setZoomPan({ zoom: 10, offset: 0 })}
          className="glass-strong rounded-lg px-3 py-2 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]"
        >
          Reset
        </button>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetail
          milestone={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
