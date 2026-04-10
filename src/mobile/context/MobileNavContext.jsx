import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const MobileNavContext = createContext(null);

const VALID_TABS = new Set(['cockpit', 'inbox', 'members', 'settings']);

function tabFromHash() {
  if (typeof window === 'undefined') return 'cockpit';
  const hash = window.location.hash || '';
  // Pattern: #/m, #/m/inbox, #/m/members, #/m/settings, #/m/conference (handled upstream)
  const match = hash.match(/^#\/m\/([a-z-]+)$/i);
  if (!match) return 'cockpit';
  const candidate = match[1].toLowerCase();
  return VALID_TABS.has(candidate) ? candidate : 'cockpit';
}

export function MobileNavProvider({ children }) {
  const [activeTab, setActiveTab] = useState(tabFromHash);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // Re-read the hash whenever it changes (browser back/forward, manual edit)
  useEffect(() => {
    const onHashChange = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateTab = useCallback((tab) => {
    setActiveTab(tab);
    if (tab !== 'members') setSelectedMemberId(null);
    // Push the hash so the URL stays in sync — also enables back-button.
    if (typeof window !== 'undefined' && VALID_TABS.has(tab)) {
      const targetHash = tab === 'cockpit' ? '#/m' : `#/m/${tab}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    }
  }, []);

  const openMember = useCallback((memberId) => {
    setSelectedMemberId(memberId);
    setActiveTab('members');
    if (typeof window !== 'undefined' && window.location.hash !== '#/m/members') {
      window.history.pushState(null, '', '#/m/members');
    }
  }, []);

  return (
    <MobileNavContext.Provider value={{ activeTab, navigateTab, selectedMemberId, openMember, setSelectedMemberId }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export const useMobileNav = () => {
  const ctx = useContext(MobileNavContext);
  if (!ctx) throw new Error('useMobileNav must be used within MobileNavProvider');
  return ctx;
};
