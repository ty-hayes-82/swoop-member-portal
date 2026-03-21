import { createContext, useContext, useState, useCallback } from 'react';

const MobileNavContext = createContext(null);

export function MobileNavProvider({ children }) {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const navigateTab = useCallback((tab) => {
    setActiveTab(tab);
    if (tab !== 'members') setSelectedMemberId(null);
  }, []);

  const openMember = useCallback((memberId) => {
    setSelectedMemberId(memberId);
    setActiveTab('members');
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
