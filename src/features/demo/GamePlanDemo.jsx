/**
 * GamePlanDemo — Standalone demo page for Game Plan generation.
 * Route: #/demo/gameplan
 */
import GamePlanGenerator from './GamePlanGenerator';

export default function GamePlanDemo() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => { window.location.hash = '#/today'; }}
          className="text-sm text-swoop-text-label hover:text-gray-600 bg-transparent border-none cursor-pointer mb-3 p-0"
        >
          &larr; Back to Today
        </button>
        <h1 className="text-2xl font-bold text-swoop-text m-0">Game Plan Generator Demo</h1>
        <p className="text-sm text-swoop-text-muted mt-1 mb-0">
          Pine Tree CC &middot; Saturday Morning &middot; 220 rounds &middot; Wind advisory &middot; 3 at-risk members
        </p>
      </div>

      {/* Context card */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">Scenario Context</div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-swoop-text-muted">Rounds:</span> <span className="font-bold text-swoop-text">220 (142 AM / 78 PM)</span></div>
          <div><span className="text-swoop-text-muted">Weather:</span> <span className="font-bold text-swoop-text">82 F, Wind 28mph</span></div>
          <div><span className="text-swoop-text-muted">At-Risk:</span> <span className="font-bold text-red-600">3 members on sheet</span></div>
          <div><span className="text-swoop-text-muted">Staffing:</span> <span className="font-bold text-orange-600">Grill Room understaffed</span></div>
          <div><span className="text-swoop-text-muted">F&B Covers:</span> <span className="font-bold text-swoop-text">156 projected</span></div>
          <div><span className="text-swoop-text-muted">Complaints:</span> <span className="font-bold text-swoop-text">2 open</span></div>
        </div>
      </div>

      <GamePlanGenerator />
    </div>
  );
}
