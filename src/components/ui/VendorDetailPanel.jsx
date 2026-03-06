// VendorDetailPanel — fixed right-side slide-in panel with vendor detail + combos
// Props: vendor (object | null), combos (array), onClose fn
// Color rule: all colors via theme.colors only — no hardcoded hex
import { theme } from '@/config/theme';
import TierBadge from './TierBadge';

const STATUS = {
  connected:   { label: 'Connected',   colorKey: 'success'   },
  available:   { label: 'Available',   colorKey: 'warning'   },
  coming_soon: { label: 'Coming Soon', colorKey: 'textMuted' },
};

const sectionLabel = () => ({
  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.07em', color: theme.colors.textMuted, marginBottom: theme.spacing.sm,
});

export default function VendorDetailPanel({ vendor, combos = [], onClose }) {
  if (!vendor) return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'320px',
      transform:'translateX(100%)', transition:'transform 0.25s ease' }} />
  );

  const accent  = theme.colors[vendor.themeColor] ?? theme.colors.accent;
  const sc      = STATUS[vendor.status] ?? STATUS.available;
  const statClr = theme.colors[sc.colorKey];

  return (
    <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'320px',
      background:theme.colors.bgCard, borderLeft:`1px solid ${theme.colors.border}`,
      boxShadow:theme.shadow.lg, zIndex:200, display:'flex', flexDirection:'column',
      transform:'translateX(0)', transition:'transform 0.25s ease', overflowY:'auto' }}>

      {/* Header */}
      <div style={{ padding:`${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.sm}`,
        borderBottom:`1px solid ${theme.colors.border}`, background:`${accent}08` }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1, minWidth:0 }}>
            <span style={{ fontSize:'24px', lineHeight:1, width:'44px', height:'44px',
              display:'flex', alignItems:'center', justifyContent:'center',
              borderRadius:theme.radius.md, background:`${accent}18`, flexShrink:0 }}>
              {vendor.icon}
            </span>
            <div>
              <div style={{ fontSize:theme.fontSize.md, fontWeight:700, color:theme.colors.textPrimary, lineHeight:1.3 }}>
                {vendor.name}
              </div>
              <TierBadge tier={vendor.tier} size="sm" />
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer',
            padding:'4px', color:theme.colors.textMuted, fontSize:'16px', lineHeight:1, flexShrink:0 }}>✕</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'10px' }}>
          <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:statClr, flexShrink:0 }} />
          <span style={{ fontSize:'12px', color:statClr, fontWeight:600 }}>{sc.label}</span>
          {vendor.status==='connected' && vendor.lastSync &&
            <span style={{ fontSize:'11px', color:theme.colors.textMuted }}>· {vendor.lastSync}</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:theme.spacing.md, display:'flex', flexDirection:'column', gap:theme.spacing.md }}>

        <div>
          <div style={sectionLabel()}>Why This Integration</div>
          <p style={{ fontSize:'13px', color:theme.colors.textSecondary, lineHeight:1.65, margin:0 }}>{vendor.why}</p>
        </div>

        <div>
          <div style={sectionLabel()}>Go Live Estimate</div>
          <span style={{ fontSize:'13px', fontWeight:700, color:theme.colors.textPrimary, fontFamily:theme.fonts.mono }}>
            {vendor.goLive}
          </span>
          <span style={{ fontSize:'11px', color:theme.colors.textMuted }}> after approval</span>
        </div>

        {vendor.partners?.length > 0 && (
          <div>
            <div style={sectionLabel()}>Works With</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {vendor.partners.map((p, i) => (
                <span key={i} style={{ fontSize:'11px', fontWeight:600, color:accent,
                  background:`${accent}14`, border:`1px solid ${accent}30`,
                  padding:'3px 8px', borderRadius:theme.radius.sm }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {combos.length > 0 && (
          <div>
            <div style={sectionLabel()}>Combo Insights ({combos.length})</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {combos.map(c => (
                <div key={c.id} style={{ padding:'10px 12px', borderRadius:theme.radius.sm,
                  background:theme.colors.bgDeep, borderLeft:`3px solid ${theme.colors.accent}` }}>
                  <div style={{ fontSize:'12px', fontWeight:700, color:theme.colors.textPrimary, marginBottom:'4px' }}>{c.label}</div>
                  <div style={{ fontSize:'11px', color:theme.colors.textSecondary, lineHeight:1.5 }}>{c.insight}</div>
                  {c.swoop_only && (
                    <span style={{ fontSize:'9px', fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'0.06em', color:theme.colors.accent, background:`${theme.colors.accent}18`,
                      padding:'1px 5px', borderRadius:'3px', display:'inline-block', marginTop:'5px' }}>
                      Swoop Only
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
