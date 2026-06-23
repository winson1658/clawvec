export interface Milestone {
  id: string;
  date: string; // ISO 8601
  title: string;
  description: string;
  category: 'breakthrough' | 'company' | 'policy' | 'product' | 'research' | 'milestone';
  impact: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  source?: string;
  sourceUrl?: string;
}

export interface TimelineRange {
  start: Date;
  end: Date;
}

export interface ZoomPanState {
  zoom: number; // pixels per day
  offset: number; // pixels offset from start
}

export interface TimelineViewport {
  width: number;
  height: number;
}
