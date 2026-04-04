const layers = [
  {
    label: 'Layer 1 \u2014 Swoop Member App',
    colorCls: { border: 'border-l-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/5', text: 'text-brand-500' },
    description: 'Real-time behavioral data your existing systems cannot capture.',
    signals: ['GPS on-course tracking', 'In-app ordering and requests', 'Push notification engagement', 'Social activity and preferences'],
    tagline: 'The Swoop app captures what happens between transactions.',
  },
  {
    label: 'Layer 2 \u2014 Club System Integrations',
    colorCls: { border: 'border-l-success-500', bg: 'bg-success-50 dark:bg-success-500/5', text: 'text-success-500' },
    description: '28 integrations with your existing tee sheet, POS, CRM, and scheduling systems.',
    signals: ['Tee times and rounds played', 'F&B spend and dining frequency', 'Dues payments and member status', 'Staff schedules and event calendars'],
    tagline: 'Your existing systems tell us what happened. The app tells us what is happening now.',
  },
];

export default function TwoLayerDiagram({ variant = 'full' }) {
  const isCompact = variant === 'compact';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      {!isCompact && (
        <div className="mb-4">
          <div className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold dark:text-gray-400">Why Swoop sees what others miss</div>
          <div className="text-lg font-bold text-gray-800 mt-1 dark:text-white/90">Two layers of intelligence. One view.</div>
        </div>
      )}
      <div className="flex flex-col gap-4">
        {layers.map((layer, i) => (
          <div key={i} className={`border-l-4 ${layer.colorCls.border} ${layer.colorCls.bg} rounded-lg p-4`}>
            <div className={`text-sm font-bold ${layer.colorCls.text} mb-1`}>{layer.label}</div>
            <div className="text-sm text-gray-600 mb-2 dark:text-gray-400">{layer.description}</div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {layer.signals.map((signal) => (
                <div key={signal} className="text-xs text-gray-800 bg-white px-2 py-1 rounded border border-gray-200 dark:bg-white/[0.03] dark:border-gray-800 dark:text-white/90">
                  {signal}
                </div>
              ))}
            </div>
            {!isCompact && (
              <div className="text-xs italic text-gray-500 mt-2 dark:text-gray-400">{layer.tagline}</div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center text-sm font-bold text-gray-800 p-2.5 bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-white/90">
        Together: cross-domain intelligence that catches disengagement signals competitors miss.
      </div>
    </div>
  );
}
