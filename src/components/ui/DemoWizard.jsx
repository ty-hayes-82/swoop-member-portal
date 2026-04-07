/**
 * DemoWizard — Floating panel for guided demo mode.
 * Shows data source checklist, preview on click, progress indicator.
 */
import { useState } from 'react';
import { useDemoWizard } from '@/context/DemoWizardContext';
import { DEMO_SOURCES } from '@/config/demoSources';
import DemoDataPreview from './DemoDataPreview';

export default function DemoWizard() {
  const ctx = useDemoWizard();
  const [previewSource, setPreviewSource] = useState(null);

  if (!ctx?.isGuided) return null;

  const { loaded, loadedCount, totalCount, load, loadAll, wizardOpen, setWizardOpen } = ctx;
  const allLoaded = loadedCount === totalCount;

  // Collapsed: show small floating badge
  if (!wizardOpen) {
    return (
      <button
        onClick={() => setWizardOpen(true)}
        className="fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-2xl bg-brand-500 text-white shadow-xl border-none cursor-pointer flex items-center gap-2.5 hover:bg-brand-600 transition-colors"
      >
        <span className="text-lg">🧭</span>
        <span className="text-sm font-bold">Data Sources</span>
        <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
          {loadedCount}/{totalCount}
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[200] w-[340px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-brand-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧭</span>
            <div>
              <div className="text-sm font-bold">Guided Demo</div>
              <div className="text-[10px] text-white/70">Load data sources one at a time</div>
            </div>
          </div>
          <button
            onClick={() => setWizardOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center border-none cursor-pointer text-xs font-bold hover:bg-white/30"
          >
            —
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              {allLoaded ? 'All data loaded' : `${loadedCount} of ${totalCount} sources loaded`}
            </span>
            {!allLoaded && (
              <button
                onClick={loadAll}
                className="text-[10px] font-bold text-brand-500 bg-transparent border-none cursor-pointer hover:text-brand-600"
              >
                Load All
              </button>
            )}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${(loadedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Source list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {DEMO_SOURCES.map(source => {
            const isLoaded = loaded.has(source.id);
            return (
              <button
                key={source.id}
                onClick={() => isLoaded ? null : setPreviewSource(source)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 mb-1 border-none cursor-pointer transition-all ${
                  isLoaded
                    ? 'bg-success-50 dark:bg-success-500/10'
                    : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-xl shrink-0">{source.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold ${isLoaded ? 'text-success-600 dark:text-success-400' : 'text-gray-800 dark:text-white/90'}`}>
                    {isLoaded && <span className="mr-1">✓</span>}
                    {source.name}
                  </div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {source.system}
                    {source.csvFiles?.length > 0 && <span className="ml-1 opacity-60">· {source.csvFiles.length} files</span>}
                  </div>
                </div>
                {!isLoaded && (
                  <span className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full shrink-0 dark:bg-brand-500/15">
                    Preview
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 text-center">
          <div className="text-[10px] text-gray-400">
            Click a source to preview its data, then load it to see insights appear across the app
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewSource && (
        <DemoDataPreview
          source={previewSource}
          onLoad={(id) => { load(id); setPreviewSource(null); }}
          onClose={() => setPreviewSource(null)}
        />
      )}
    </>
  );
}
