/**
 * ConfigPreviewButton — "Test this configuration" button + modal.
 *
 * Opens a modal with a scenario selector (10 QA scenarios), runs the current
 * config through a test endpoint, and displays the response with pass/fail
 * validation based on must_contain / must_not_contain checks.
 *
 * The test API endpoint is stubbed — this is the UI shell for Sprint 4.
 */
import { useState, useCallback } from 'react';
import PreviewModal from './PreviewModal';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ConfigPreviewButton({ agentId, currentConfig }) {
  const [open, setOpen] = useState(false);

  const closeModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Test this configuration
      </button>

      <PreviewModal
        isOpen={open}
        onClose={closeModal}
        agentId={agentId}
        config={currentConfig}
      />
    </>
  );
}
