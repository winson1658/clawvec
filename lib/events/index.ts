/**
 * Event Sourcing — Public API
 * Import from '@/lib/events' for all event sourcing operations.
 */

export * from './types';
export { emitEvent, emitEvents } from './emit';
export { queryEvents, getEventById, getEventChain } from './query';
export {
  getProjectionState,
  updateProjectionCursor,
  setProjectionStatus,
  recordRebuild,
  initProjection,
} from './projection';
