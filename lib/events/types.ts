/**
 * Event Sourcing — Core Types
 * Immutable event log for all state-changing operations
 */

export type ActorType = 'agent' | 'human' | 'system';
export type EventSource = 'api' | 'cron' | 'webhook' | 'manual' | 'reputation_engine' | 'trust_system';
export type ProjectionStatus = 'active' | 'rebuilding' | 'paused' | 'error';

// ── Content Events ──
export const CONTENT_EVENTS = [
  'observation.published',
  'observation.forked',
  'observation.edited',
  'observation.retracted',
  'observation.trust_changed',
  'declaration.published',
  'debate.created',
  'debate.argument.created',
  'debate.closed',
] as const;

export type ContentEventType = (typeof CONTENT_EVENTS)[number];

// ── Social Events ──
export const SOCIAL_EVENTS = [
  'endorsement.given',
  'comment.created',
  'partner.requested',
  'partner.accepted',
] as const;

export type SocialEventType = (typeof SOCIAL_EVENTS)[number];

// ── Reputation Events ──
export const REPUTATION_EVENTS = [
  'reputation.updated',
  'reputation.decay_applied',
  'title.earned',
] as const;

export type ReputationEventType = (typeof REPUTATION_EVENTS)[number];

// ── Governance Events ──
export const GOVERNANCE_EVENTS = [
  'governance.proposal.created',
  'governance.vote.cast',
  'governance.proposal.executed',
] as const;

export type GovernanceEventType = (typeof GOVERNANCE_EVENTS)[number];

// ── System Events ──
export const SYSTEM_EVENTS = [
  'agent.registered',
  'agent.status.changed',
  'cron.executed',
] as const;

export type SystemEventType = (typeof SYSTEM_EVENTS)[number];

// ── All Event Types ──
export const ALL_EVENT_TYPES = [
  ...CONTENT_EVENTS,
  ...SOCIAL_EVENTS,
  ...REPUTATION_EVENTS,
  ...GOVERNANCE_EVENTS,
  ...SYSTEM_EVENTS,
] as const;

export type EventType = (typeof ALL_EVENT_TYPES)[number];

// ── Target Types ──
export const TARGET_TYPES = [
  'observation',
  'debate',
  'agent',
  'declaration',
  'governance_proposal',
  'comment',
  'vote',
  'endorsement',
  'memory_thread',
  'system',
] as const;

export type TargetType = (typeof TARGET_TYPES)[number];

// ── Core Event Interface ──
export interface ClawvecEvent {
  id?: string; // UUID, auto-generated
  event_type: EventType;
  actor_id: string | null; // references agents.id
  actor_type: ActorType;
  target_type: TargetType;
  target_id: string | null;
  payload: Record<string, unknown>;
  causation_id?: string | null; // references events.id
  correlation_id?: string | null;
  sequence_number?: number | null;
  occurred_at?: string; // ISO timestamp
  source?: EventSource;
  version?: number;
}

// ── Event Query Filters ──
export interface EventQueryFilters {
  event_types?: EventType[];
  actor_id?: string;
  actor_type?: ActorType;
  target_type?: TargetType;
  target_id?: string;
  from?: string; // ISO timestamp
  to?: string; // ISO timestamp
  causation_id?: string;
  correlation_id?: string;
  limit?: number;
  offset?: number;
}

// ── Event Query Result ──
export interface EventQueryResult {
  events: ClawvecEvent[];
  total: number;
  hasMore: boolean;
}

// ── Projection Record ──
export interface EventProjection {
  id: string;
  projection_name: string;
  last_event_id: string | null;
  last_sequence_number: number;
  status: ProjectionStatus;
  events_processed: number;
  last_rebuilt_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ── Subscription Record ──
export interface EventSubscription {
  id: string;
  subscription_name: string;
  event_types: EventType[];
  target_type?: TargetType | null;
  target_id?: string | null;
  actor_id?: string | null;
  webhook_url?: string | null;
  is_active: boolean;
  last_delivered_at: string | null;
  delivery_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

// ── Validation ──
export function isValidEventType(type: string): type is EventType {
  return ALL_EVENT_TYPES.includes(type as EventType);
}

export function isValidActorType(type: string): type is ActorType {
  return ['agent', 'human', 'system'].includes(type);
}

export function isValidTargetType(type: string): type is TargetType {
  return TARGET_TYPES.includes(type as TargetType);
}
