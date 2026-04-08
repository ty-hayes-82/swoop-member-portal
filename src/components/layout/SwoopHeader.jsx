import { useEffect, useRef, useState, useCallback } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { useNavigationContext } from "@/context/NavigationContext";
import { NAV_ITEMS } from "@/config/navigation";
import { stashRealAuth, restoreRealAuth, clearRealAuthStash, hasStashedAuth } from "@/services/demoGate";

const SwoopHeader = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { currentRoute, navigate } = useNavigationContext();
  const inputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const currentNav = NAV_ITEMS.find((item) => item.key === currentRoute) || NAV_ITEMS[0];

  // Get user info from localStorage
  let userName = "Club Manager";
  let clubId = "demo";
  try {
    const user = JSON.parse(localStorage.getItem("swoop_auth_user") || "{}");
    if (user.name) userName = user.name;
    clubId = localStorage.getItem("swoop_club_id") || "demo";
  } catch {
    // ignore
  }

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Close notification dropdown on outside click or Escape
  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notifOpen]);

  const handleSignOut = () => {
    setUserMenuOpen(false);
    clearRealAuthStash();
    localStorage.removeItem("swoop_auth_token");
    localStorage.removeItem("swoop_auth_user");
    localStorage.removeItem("swoop_club_id");
    localStorage.removeItem("swoop_club_name");
    localStorage.removeItem("swoop_production");
    window.location.hash = "#/";
    window.location.reload();
  };

  // Fetch unread notification count on mount
  useEffect(() => {
    if (!clubId || clubId === "demo") return;
    const token = localStorage.getItem('swoop_auth_token');
    fetch(`/api/notifications?clubId=${clubId}&unreadOnly=true`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.notifications) setUnreadCount(data.notifications.length);
      })
      .catch(() => {});
  }, [clubId]);

  // Debounced search
  const handleSearchChange = useCallback(
    (e) => {
      const q = e.target.value;
      setSearchQuery(q);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (!q || q.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      searchTimerRef.current = setTimeout(() => {
        const token = localStorage.getItem('swoop_auth_token');
        fetch(`/api/search?q=${encodeURIComponent(q.trim())}&clubId=${clubId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then((r) => (r.ok ? r.json() : { results: [] }))
          .then((data) => {
            setSearchResults(data.results || []);
            setShowSearchResults(true);
          })
          .catch(() => {
            setSearchResults([]);
            setShowSearchResults(false);
          });
      }, 300);
    },
    [clubId]
  );

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSearchResults(false);
      setSearchQuery('');
    }
    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      navigate("members", { mode: "search" });
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  return (
    <header role="banner" className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between w-full gap-4 px-3 py-3 lg:px-6 lg:py-4">
        {/* Left: hamburger + logo (mobile) or hamburger + search (desktop) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Hamburger / sidebar toggle */}
          <button
            className={`flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg z-99999 dark:border-gray-800 dark:text-gray-400 lg:h-11 lg:w-11 lg:border lg:border-gray-200 ${
              isMobileOpen ? "bg-gray-100 dark:bg-white/[0.03]" : ""
            }`}
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z" fill="currentColor" />
              </svg>
            )}
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <img src="/favicon.svg" alt="Swoop" className="w-8 h-8 rounded-lg" />
          </div>

          {/* Desktop search */}
          <div className="hidden lg:block">
            <form>
              <div className="relative">
                <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                  <svg className="fill-gray-500 dark:fill-gray-400" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="" />
                  </svg>
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type command..."
                  aria-label="Search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 lg:w-[430px]"
                />
                <button className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                  <span>&#8984;</span>
                  <span>K</span>
                </button>
                {showSearchResults && (
                  <div className="absolute left-0 top-12 w-full rounded-xl border border-gray-200 bg-white shadow-theme-lg z-50 max-h-80 overflow-y-auto dark:border-gray-800 dark:bg-gray-900">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">No results found</div>
                    ) : (
                      searchResults.map((r) => (
                        <button
                          key={r.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            navigate("member-profile", { memberId: r.id });
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 cursor-pointer bg-transparent border-x-0 border-t-0"
                        >
                          <div className="text-sm font-semibold text-gray-800 dark:text-white/90">{r.name}</div>
                          <div className="text-xs text-gray-500">{r.email} {r.archetype ? `\u00B7 ${r.archetype}` : ''}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: page title + LIVE/DEMO badge + user avatar */}
        <div className="flex items-center gap-3">
          {/* Page context + badge */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-800 dark:text-white/90 hidden sm:inline">{currentNav.label}</span>
            {clubId !== "demo" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-50 text-success-600 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                LIVE
              </span>
            )}
            {clubId === "demo" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning-50 text-warning-600 text-xs font-medium">
                DEMO
              </span>
            )}
          </div>

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-error-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-80 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-theme-lg z-50">
                <div className="p-3 border-b border-gray-200 font-semibold text-sm text-gray-800">Notifications</div>
                <div className="p-3 text-sm text-gray-500 text-center">No new notifications</div>
              </div>
            )}
          </div>

          {/* User info + dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90 m-0">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 m-0">
                  {(clubId === "demo" || clubId?.startsWith("demo_")) ? "Demo Environment" : ((() => { try { return localStorage.getItem("swoop_club_name") || JSON.parse(localStorage.getItem("swoop_auth_user") || "{}").clubName || "Connected Club"; } catch { return "Connected Club"; } })())}
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 text-brand-600 font-semibold text-sm">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-theme-lg z-50 py-1 dark:bg-gray-900 dark:border-gray-800">
                {/* User summary */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90 m-0">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">
                    {(() => { try { return JSON.parse(localStorage.getItem("swoop_auth_user") || "{}").email || ""; } catch { return ""; } })()}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate("profile"); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate("admin"); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9v1a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                    Club Settings
                  </button>
                </div>

                {/* Switch to demo modes */}
                <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                  {hasStashedAuth() && (
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        restoreRealAuth();
                        localStorage.removeItem('swoop_was_guided');
                        sessionStorage.removeItem('swoop_demo_guided');
                        window.location.hash = '#/today';
                        window.location.reload();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10 cursor-pointer flex items-center gap-2.5 font-medium"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      Return to My Account
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      stashRealAuth();
                      const demoClubId = `demo_${Date.now()}`;
                      const demoUser = { userId: 'demo', clubId: demoClubId, name: 'Demo User', email: 'demo@swoopgolf.com', phone: '', role: 'gm', title: 'General Manager', isDemoSession: true };
                      localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
                      localStorage.setItem('swoop_auth_token', 'demo');
                      localStorage.setItem('swoop_club_id', demoClubId);
                      localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
                      sessionStorage.removeItem('swoop_demo_guided');
                      localStorage.removeItem('swoop_was_guided');
                      window.location.hash = '#/today';
                      window.location.reload();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                    </svg>
                    Switch to Full Demo
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      stashRealAuth();
                      const demoClubId = `demo_${Date.now()}`;
                      const demoUser = { userId: 'demo', clubId: demoClubId, name: 'Demo User', email: 'demo@swoopgolf.com', phone: '', role: 'gm', title: 'General Manager', isDemoSession: true };
                      localStorage.setItem('swoop_auth_user', JSON.stringify(demoUser));
                      localStorage.setItem('swoop_auth_token', 'demo');
                      localStorage.setItem('swoop_club_id', demoClubId);
                      localStorage.setItem('swoop_club_name', 'Pinetree Country Club');
                      sessionStorage.setItem('swoop_demo_guided', 'true');
                      sessionStorage.removeItem('swoop_demo_sources');
                      localStorage.setItem('swoop_was_guided', 'true');
                      window.location.hash = '#/today';
                      window.location.reload();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Guided Demo
                  </button>
                </div>

                {/* Sign out */}
                <div className="border-t border-gray-100 dark:border-gray-800 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SwoopHeader;
