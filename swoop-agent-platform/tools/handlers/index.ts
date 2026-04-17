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

/** All Swoop custom tool handlers keyed by tool name. Pass to consumeStream(). */
export const ALL_HANDLERS: ToolHandlers = {
  route_to_role_agent: handleRouteToRoleAgent,
  escalate_to_role: handleEscalateToRole,
  observe_preference: handleObservePreference,
  recall_member_context: handleRecallMemberContext,
  log_decision: handleLogDecision,
  surface_recommendation: handleSurfaceRecommendation,
  track_outcome: handleTrackOutcome,
  hold_for_review: handleHoldForReview,
  request_human_confirmation: handleRequestHumanConfirmation,
};
