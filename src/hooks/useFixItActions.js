import { useAppContext } from '@/context/AppContext';

/**
 * useFixItActions — manages playbook activation state + revenue tracking
 * Returns: { playbooks, activatePlaybook, deactivatePlaybook, activeCount, totalRevenueImpact }
 */
export function useFixItActions() {
  const { playbooks, dispatch, activeCount, totalRevenueImpact, playbookDefs } = useAppContext();

  const activatePlaybook = (id) => {
    if (!playbookDefs[id]) {
      console.warn(`Unknown playbook id: ${id}`);
      return;
    }
    dispatch({ type: 'ACTIVATE_PLAYBOOK', id });
  };

  const deactivatePlaybook = (id) => {
    dispatch({ type: 'DEACTIVATE_PLAYBOOK', id });
  };

  const isActive = (id) => playbooks[id]?.active ?? false;

  const getImpact = (id) => playbookDefs[id] ?? { monthly: 0, annual: 0 };

  return {
    playbooks,
    activatePlaybook,
    deactivatePlaybook,
    isActive,
    getImpact,
    activeCount,
    totalRevenueImpact,
  };
}
