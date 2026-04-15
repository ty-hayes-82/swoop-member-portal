// DemoStoriesLauncher — Prominent entry points for the 3 storyboard user flows.
// Makes the storyboard's "10-minute pilot demo" trivially navigable from Today View.
//
// Story 1: Saturday Morning Briefing — already on this page (scrolls to briefing)
// Story 2: Quiet Resignation Catch — opens an at-risk member profile drawer
// Story 3: Revenue Leakage Discovery — navigates to Revenue page
//
// Each card carries the storyboard runtime, the pillar, and a one-click start.

import { useNavigation } from '@/context/NavigationContext';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { isGateOpen, getDataMode } from '@/services/demoGate';
import { getAtRiskMembers } from '@/services/memberService';

const STORIES = [
  {
    id: 'briefing',
    number: '01',
    title: 'Saturday Morning Briefing',
    subtitle: 'Daniel — Director of Golf',
    runtime: '~4 min',
    pillar: 'See It · Fix It',
    pillarColor: '#32d583',
    accentColor: '#32d583',
    bgFrom: 'rgba(52,211,153,0.12)',
    bgTo: 'rgba(52,211,153,0.04)',
    teaser: '"220 rounds. 82°F clear. 3 at-risk on the sheet. 2 servers short."',
    cta: 'See briefing ↑',
    requiredGates: ['tee-sheet'],
  },
  {
    id: 'catch',
    number: '02',
    title: 'The Quiet Resignation Catch',
    subtitle: 'GM — Tuesday Review',
    runtime: '~3 min',
    pillar: 'See It · Fix It',
    pillarColor: '#F59E0B',
    accentColor: '#F59E0B',
    bgFrom: 'rgba(245,158,11,0.12)',
    bgTo: 'rgba(245,158,11,0.04)',
    teaser: 'Kevin Hurst: email dropped → golf dropped → dining dropped. $18K/yr — resigned Jan 8.', // lint-no-hardcoded-dollars: allow — demo story teaser copy
    lockedTeaser: 'Email dropped → golf dropped → dining dropped. A quiet resignation caught too late.',
    cta: 'View First Domino →',
    requiredGates: ['email', 'tee-sheet', 'fb'],
  },
  {
    id: 'revenue',
    number: '03',
    title: 'Revenue Leakage Discovery',
    subtitle: 'GM — Board Prep',
    runtime: '~3 min',
    pillar: 'See It · Prove It',
    pillarColor: '#60A5FA',
    accentColor: '#60A5FA',
    bgFrom: 'rgba(96,165,250,0.12)',
    bgTo: 'rgba(96,165,250,0.04)',
    teaser: '$9,377/mo F&B leakage decomposed. $8/slow round. Board approved.', // lint-no-hardcoded-dollars: allow — demo story teaser copy
    cta: 'Open Revenue page →',
    requiredGates: ['fb', 'pace'],
  },
];

export default function DemoStoriesLauncher() {
  const { navigate } = useNavigation();
  const { openProfile } = useMemberProfile();

  // Pick the most-decayed at-risk member for Story 2 deep link
  const pickStory2Member = () => {
    if (!isGateOpen('members')) return null;
    const atRisk = getAtRiskMembers() || [];
    if (atRisk.length === 0) return null;
    return [...atRisk].sort((a, b) => (a.score ?? a.healthScore ?? 100) - (b.score ?? b.healthScore ?? 100))[0];
  };

  const handleStartStory = (storyId) => {
    if (storyId === 'briefing') {
      const el = document.getElementById('today-briefing')
        || document.querySelector('[data-story="briefing"]')
        || document.querySelector('.fade-in-up');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (storyId === 'catch') {
      const member = pickStory2Member();
      if (member?.memberId) {
        openProfile(member.memberId);
      } else {
        navigate('members', { tab: 'at-risk' });
      }
    } else if (storyId === 'revenue') {
      navigate('revenue');
    }
  };

  return (
    <div className="fade-in-up">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600">
            ⚡ Demo Story Flows
          </span>
          <span className="text-[10px] text-swoop-text-label">3 storyboard moments · ~10 min total</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STORIES.map((story) => {
          const isGuided = getDataMode() === 'guided';
          const missingGates = isGuided
            ? (story.requiredGates || []).filter(g => !isGateOpen(g))
            : [];
          const isLocked = isGuided && missingGates.length > 0;
          const gateLabels = { 'tee-sheet': 'Tee Sheet', 'fb': 'F&B / POS', 'email': 'Email', 'pace': 'Pace of Play', 'members': 'Members' };
          const unlockLabel = missingGates.map(g => gateLabels[g] || g).join(' + ');

          return (
          <button
            key={story.id}
            type="button"
            onClick={() => !isLocked && handleStartStory(story.id)}
            disabled={isLocked}
            className={`text-left bg-swoop-panel border border-swoop-border rounded-2xl p-4 transition-all duration-200 group ${
              isLocked
                ? 'opacity-50 grayscale cursor-not-allowed'
                : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
            }`}
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: isLocked ? '#9ca3af' : story.accentColor,
              background: isLocked
                ? 'linear-gradient(135deg, rgba(156,163,175,0.08) 0%, rgba(156,163,175,0.03) 100%)'
                : `linear-gradient(135deg, ${story.bgFrom} 0%, ${story.bgTo} 100%)`,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: isLocked ? '#9ca3af' : story.accentColor }}
                >
                  {isLocked ? '🔒' : story.number}
                </span>
                <span className="text-[10px] font-mono font-bold text-swoop-text-muted">{story.runtime}</span>
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: (isLocked ? '#9ca3af' : story.accentColor) + '20', color: isLocked ? '#9ca3af' : story.accentColor }}
              >
                {story.pillar}
              </span>
            </div>

            <div className={`text-sm font-bold leading-tight mb-0.5 ${isLocked ? 'text-swoop-text-label' : 'text-swoop-text'}`}>
              {story.title}
            </div>
            <div className="text-[11px] text-swoop-text-muted mb-2">{story.subtitle}</div>

            <div className={`text-[11px] italic leading-snug mb-3 ${isLocked ? 'text-swoop-text-label' : 'text-swoop-text-2'}`}>
              {!isGateOpen('members') && story.lockedTeaser ? story.lockedTeaser : story.teaser}
            </div>

            {isLocked ? (
              <div className="text-[10px] font-bold text-swoop-text-label flex items-center gap-1">
                Import {unlockLabel} to unlock
              </div>
            ) : (
              <div
                className="text-[11px] font-bold flex items-center gap-1 transition-transform group-hover:translate-x-0.5"
                style={{ color: story.accentColor }}
              >
                {story.cta}
              </div>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}
