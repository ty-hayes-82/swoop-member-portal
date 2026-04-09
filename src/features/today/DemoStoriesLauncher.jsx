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
import { shouldUseStatic } from '@/services/demoGate';
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
    teaser: 'Email dropped → Golf dropped → Dining dropped. $32K/yr saved.',
    cta: 'View First Domino →',
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
    teaser: '$9,580/mo F&B leakage decomposed. $31/slow round. Board approved.',
    cta: 'Open Revenue page →',
  },
];

export default function DemoStoriesLauncher() {
  const { navigate } = useNavigation();
  const { openProfile } = useMemberProfile();

  // Pick the most-decayed at-risk member for Story 2 deep link
  const pickStory2Member = () => {
    if (!shouldUseStatic('members')) return null;
    const atRisk = getAtRiskMembers() || [];
    if (atRisk.length === 0) return null;
    return [...atRisk].sort((a, b) => (a.score ?? a.healthScore ?? 100) - (b.score ?? b.healthScore ?? 100))[0];
  };

  const handleStartStory = (storyId) => {
    if (storyId === 'briefing') {
      // Scroll to top morning briefing — story 1 entry is already on this page
      const el = document.querySelector('.fade-in-up');
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
          <span className="text-[10px] text-gray-400">3 storyboard moments · ~10 min total</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STORIES.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => handleStartStory(story.id)}
            className="text-left bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 dark:bg-white/[0.03] dark:border-gray-800 group"
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: story.accentColor,
              background: `linear-gradient(135deg, ${story.bgFrom} 0%, ${story.bgTo} 100%)`,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded text-white"
                  style={{ background: story.accentColor }}
                >
                  {story.number}
                </span>
                <span className="text-[10px] font-mono font-bold text-gray-500">{story.runtime}</span>
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ background: story.accentColor + '20', color: story.accentColor }}
              >
                {story.pillar}
              </span>
            </div>

            <div className="text-sm font-bold text-gray-800 dark:text-white/90 leading-tight mb-0.5">
              {story.title}
            </div>
            <div className="text-[11px] text-gray-500 mb-2">{story.subtitle}</div>

            <div className="text-[11px] text-gray-700 dark:text-gray-300 italic leading-snug mb-3">
              {story.teaser}
            </div>

            <div
              className="text-[11px] font-bold flex items-center gap-1 transition-transform group-hover:translate-x-0.5"
              style={{ color: story.accentColor }}
            >
              {story.cta}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
