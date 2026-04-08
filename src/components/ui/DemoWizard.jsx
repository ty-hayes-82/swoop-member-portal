/**
 * DemoWizard — Floating panel showing individual CSV files to import one at a time.
 * Files are grouped by system/category for readability.
 */
import { useState } from 'react';
import { useDemoWizard } from '@/context/DemoWizardContext';
import { DEMO_FILES, FILE_GROUPS } from '@/config/demoSources';
import { loadFile } from '@/services/demoGate';
import DemoDataPreview from './DemoDataPreview';

export default function DemoWizard() {
  const ctx = useDemoWizard();
  const { startOver } = ctx;
  const [previewFile, setPreviewFile] = useState(null);

  if (!ctx?.isGuided) return null;

  const { loadedFiles, fileCount, totalFiles, importFile, importAll, wizardOpen, setWizardOpen } = ctx;
  const allLoaded = fileCount === totalFiles;

  if (!wizardOpen) {
    return (
      <button
        onClick={() => setWizardOpen(true)}
        className="fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-2xl bg-brand-500 text-white shadow-xl border-none cursor-pointer flex items-center gap-2.5 hover:bg-brand-600 transition-colors"
      >
        <span className="text-lg">🧭</span>
        <span className="text-sm font-bold">Data Files</span>
        <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
          {fileCount}/{totalFiles}
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[200] w-[360px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[calc(100vh-100px)]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-brand-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧭</span>
            <div>
              <div className="text-sm font-bold">Guided Demo</div>
              <div className="text-[10px] text-white/70">Import files one at a time</div>
            </div>
          </div>
          <button
            onClick={() => setWizardOpen(false)}
            className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center border-none cursor-pointer text-xs font-bold hover:bg-white/30"
          >
            —
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
              {allLoaded ? 'All files imported' : `${fileCount} of ${totalFiles} files imported`}
            </span>
            <div className="flex gap-2">
              {fileCount > 0 && (
                <button
                  onClick={startOver}
                  className="text-[10px] font-bold text-error-500 bg-transparent border-none cursor-pointer hover:text-error-600"
                >
                  Start Over
                </button>
              )}
              {!allLoaded && (
                <button
                  onClick={importAll}
                  className="text-[10px] font-bold text-brand-500 bg-transparent border-none cursor-pointer hover:text-brand-600"
                >
                  Import All
                </button>
              )}
            </div>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${(fileCount / totalFiles) * 100}%` }}
            />
          </div>
        </div>

        {/* File list grouped by category */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {FILE_GROUPS.map(group => {
            const files = DEMO_FILES.filter(f => f.gateId === group.gateId);
            const groupLoaded = files.filter(f => loadedFiles.has(f.id)).length;
            return (
              <div key={group.gateId} className="mb-2">
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <span className="text-sm">{group.icon}</span>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex-1">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {groupLoaded}/{files.length}
                  </span>
                </div>
                {files.map(file => {
                  const isLoaded = loadedFiles.has(file.id);
                  return (
                    <button
                      key={file.id}
                      onClick={() => isLoaded ? null : setPreviewFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 mb-0.5 border-none cursor-pointer transition-all ${
                        isLoaded
                          ? 'bg-success-50 dark:bg-success-500/10'
                          : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="text-base shrink-0">{file.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] font-semibold leading-tight ${isLoaded ? 'text-success-600 dark:text-success-400' : 'text-gray-800 dark:text-white/90'}`}>
                          {isLoaded && <span className="mr-1">✓</span>}
                          {file.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                          {file.system} · {file.rows?.toLocaleString()} rows
                        </div>
                      </div>
                      {!isLoaded && (
                        <span className="text-[9px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded shrink-0 dark:bg-brand-500/15">
                          Preview
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* AI Agents (no CSV file) */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <span className="text-sm">🤖</span>
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex-1">
                AI Agents
              </span>
            </div>
            <button
              onClick={() => {
                if (!ctx.isGateOpen('agents')) {
                  // Use demoGate's loadFile directly — writes to sessionStorage + dispatches event
                  loadFile('_agents', 'agents');
                }
              }}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 mb-0.5 border-none cursor-pointer transition-all ${
                ctx.isGateOpen('agents')
                  ? 'bg-success-50 dark:bg-success-500/10'
                  : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-base shrink-0">🤖</span>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-semibold leading-tight ${ctx.isGateOpen('agents') ? 'text-success-600 dark:text-success-400' : 'text-gray-800 dark:text-white/90'}`}>
                  {ctx.isGateOpen('agents') && <span className="mr-1">✓</span>}
                  Activate AI Agents
                </div>
                <div className="text-[10px] text-gray-400">
                  Swoop Intelligence · Requires member data
                </div>
              </div>
              {!ctx.isGateOpen('agents') && (
                <span className="text-[9px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded shrink-0 dark:bg-brand-500/15">
                  Activate
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 text-center shrink-0">
          <div className="text-[10px] text-gray-400">
            Click a file to preview its data, then import it to see insights appear
          </div>
        </div>
      </div>

      {/* Preview modal for individual file */}
      {previewFile && (
        <DemoDataPreview
          file={previewFile}
          onLoad={(fileId) => {
            importFile(fileId);
            setPreviewFile(null);
          }}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}
