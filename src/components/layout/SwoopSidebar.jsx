import { useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useNavigationContext } from "@/context/NavigationContext";
import { useMemberProfile } from "@/context/MemberProfileContext";
import { NAV_ITEMS } from "@/config/navigation";
import { shouldUseStatic } from "@/services/demoGate";
import { getAtRiskMembers } from "@/services/memberService";

const primaryItems = NAV_ITEMS.filter(
  (item) => item.section === "PRIMARY" && !item.hidden
);

// SVG icon components for each nav key
const navIcons = {
  today: (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  service: (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  members: (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  "tee-sheet": (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  automations: (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  "board-report": (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  ),
  admin: (
    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const SwoopSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const { currentRoute, navigate } = useNavigationContext();
  const { openProfile } = useMemberProfile();

  const handleStartStory = (storyId) => {
    if (storyId === 'briefing') {
      if (currentRoute !== 'today') {
        navigate('today');
      } else {
        // Already on today — scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (storyId === 'catch') {
      if (shouldUseStatic('members')) {
        const atRisk = getAtRiskMembers() || [];
        const member = [...atRisk].sort((a, b) => (a.score ?? a.healthScore ?? 100) - (b.score ?? b.healthScore ?? 100))[0];
        if (member?.memberId) {
          openProfile(member.memberId);
          return;
        }
      }
      navigate('members', { tab: 'at-risk' });
    } else if (storyId === 'revenue') {
      navigate('revenue');
    }
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoute]);

  const isActive = (key) => currentRoute === key;
  const showFull = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed flex flex-col top-0 px-5 left-0 bg-black text-white h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-800/50
        ${showFull ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="py-8 flex justify-center">
        <button
          onClick={() => navigate("today")}
          className="flex items-center justify-center cursor-pointer"
          aria-label="Swoop home"
        >
          {showFull ? (
            <img src="/swoop-logo-white.svg" alt="Swoop Golf" className="h-12" />
          ) : (
            <img src="/favicon.svg" alt="Swoop" className="w-10 h-10 rounded-lg" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        <nav className="mb-6" role="navigation" aria-label="Main navigation">
          <div className="flex flex-col gap-1">
            <h2
              className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
              }`}
            >
              {showFull ? (
                "Menu"
              ) : (
                <svg className="size-6" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              )}
            </h2>
            <ul className="flex flex-col gap-1">
              {primaryItems.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => navigate(item.key)}
                    className={`menu-item group cursor-pointer ${
                      isActive(item.key)
                        ? "bg-brand-500/15 text-brand-400"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    } ${
                      !isExpanded && !isHovered
                        ? "lg:justify-center"
                        : "lg:justify-start"
                    }`}
                    {...(isActive(item.key) ? { "aria-current": "page" } : {})}
                  >
                    <span
                      className={`${
                        isActive(item.key)
                          ? "text-brand-400"
                          : "text-gray-400 group-hover:text-gray-300"
                      }`}
                    >
                      {navIcons[item.key] || (
                        <span className="text-lg">{item.icon}</span>
                      )}
                    </span>
                    {showFull && (
                      <span className="menu-item-text">{item.label}</span>
                    )}
                    {showFull && isActive(item.key) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Demo Story Flows — always available navigation to the 3 storyboard moments */}
        {showFull && (
          <div className="mt-auto mb-6">
            <div className="rounded-xl bg-white/5 p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400">
                  ⚡ Demo Stories
                </p>
                <span className="text-[9px] text-gray-500 font-mono">~10 min</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStartStory('briefing')}
                  className="text-left w-full px-2 py-1.5 rounded-md cursor-pointer bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors"
                  style={{ borderLeftWidth: '3px', borderLeftColor: '#34D399' }}
                >
                  <div className="text-[11px] font-bold text-white leading-tight">01 · Saturday Briefing</div>
                  <div className="text-[9px] text-gray-400">Daniel · ~4 min</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartStory('catch')}
                  className="text-left w-full px-2 py-1.5 rounded-md cursor-pointer bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors"
                  style={{ borderLeftWidth: '3px', borderLeftColor: '#F59E0B' }}
                >
                  <div className="text-[11px] font-bold text-white leading-tight">02 · Quiet Resignation</div>
                  <div className="text-[9px] text-gray-400">First Domino · ~3 min</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartStory('revenue')}
                  className="text-left w-full px-2 py-1.5 rounded-md cursor-pointer bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors"
                  style={{ borderLeftWidth: '3px', borderLeftColor: '#60A5FA' }}
                >
                  <div className="text-[11px] font-bold text-white leading-tight">03 · Revenue Leakage</div>
                  <div className="text-[9px] text-gray-400">$9,580/mo · ~3 min</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SwoopSidebar;
