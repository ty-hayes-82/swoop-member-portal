// ActionPreview.jsx — pre-activate panel showing concrete actions that will fire
import { ACTION_TYPES } from '@/config/actionTypes';

export default function ActionPreview({ steps = [], accent }) {
  if (!steps.length) return null;

  return (
    <div className="mb-4 p-4 bg-brand-50 border border-brand-200 rounded-xl">
      <div className="text-[11px] font-semibold text-brand-500 tracking-wider uppercase mb-3">
        When you activate this playbook:
      </div>
      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => {
          const type = ACTION_TYPES[step.actionType] ?? ACTION_TYPES['report'];
          return (
            <div key={i} className="flex items-start gap-2.5 px-2.5 py-2 bg-swoop-row rounded-lg">
              {/* Step number */}
              <span className="w-[18px] h-[18px] rounded-full bg-brand-100 text-brand-500 text-[10px] font-bold flex items-center justify-center shrink-0 mt-px">
                {i + 1}
              </span>

              {/* Action type badge */}
              <span className="px-1.5 py-0.5 rounded shrink-0 text-[10px] font-semibold border" style={{ background: `${type.color}18`, color: type.color, borderColor: `${type.color}30` }}>
                {type.icon} {type.label}
              </span>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-swoop-text mb-0.5">{step.title}</div>
                <div className="text-[11px] text-swoop-text-muted leading-snug">{step.preview ?? step.description}</div>
              </div>

              <span className="text-[11px] text-swoop-text-muted shrink-0 mt-0.5">{step.timeline}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
