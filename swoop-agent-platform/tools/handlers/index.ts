export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;
export type ToolHandlers = Record<string, ToolHandler>;

export { handleRouteToRoleAgent, handleEscalateToRole } from './routing.ts';
export { handleObservePreference, handleRecallMemberContext, handleLogDecision } from './memory.ts';
export { handleSurfaceRecommendation, handleTrackOutcome, handleHoldForReview } from './insight.ts';
export { handleRequestHumanConfirmation } from './human_confirmation.ts';

import { handleRouteToRoleAgent, handleEscalateToRole } from './routing.ts';
import { handleObservePreference, handleRecallMemberContext, handleLogDecision } from './memory.ts';
import { handleSurfaceRecommendation, handleTrackOutcome, handleHoldForReview } from './insight.ts';
import { handleRequestHumanConfirmation } from './human_confirmation.ts';

/**
 * Build a handler map scoped to a specific club.
 * The routing handler uses clubId to enforce capability gates (staff on duty + config).
 * Pass clubId='' for non-member contexts (analyst sessions) to skip gating.
 */
export function buildHandlers(clubId: string): ToolHandlers {
  return {
    route_to_role_agent: (input) => handleRouteToRoleAgent(input, clubId),
    escalate_to_role: handleEscalateToRole,
    observe_preference: handleObservePreference,
    recall_member_context: handleRecallMemberContext,
    log_decision: handleLogDecision,
    surface_recommendation: handleSurfaceRecommendation,
    track_outcome: handleTrackOutcome,
    hold_for_review: handleHoldForReview,
    request_human_confirmation: handleRequestHumanConfirmation,
  };
}

/** Ungated handlers for non-member contexts (analyst sessions, test scripts). */
export const ALL_HANDLERS: ToolHandlers = buildHandlers('');
