import React, { useState, useEffect } from 'react';

export default function MobileStickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handler = () => setShow(window.scrollY > 300);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: '#1A2E20', borderTop: '1px solid rgba(255,255,255,0.1)',
      padding: '10px 16px', display: 'flex', gap: 10,
    }} className="md-hidden-sticky">
      <a href="#/contact" style={{
        flex: 1, textAlign: 'center', padding: '12px 0',
        borderRadius: 8, background: '#F3922D', color: '#fff',
        fontWeight: 700, fontSize: 15, textDecoration: 'none',
      }}>Book 30-min Demo</a>
    </div>
  );
}
