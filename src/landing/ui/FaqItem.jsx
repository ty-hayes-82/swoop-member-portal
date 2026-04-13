import { useState } from 'react';
import { theme } from '@/config/theme';
import Icon from './Icon';

export default function FaqItem({ question, answer, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        borderBottom: '1px solid rgba(17,17,17,0.1)',
        padding: '20px 0',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 19,
            fontWeight: 600,
            color: theme.neutrals.ink,
            paddingRight: 20,
          }}
        >
          {question}
        </span>
        <Icon
          name={open ? 'Minus' : 'Plus'}
          size={24}
          color={theme.colors.accent}
        />
      </button>
      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 300ms ease, opacity 300ms ease, margin 300ms ease',
          opacity: open ? 1 : 0,
          marginTop: open ? 12 : 0,
        }}
      >
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.65,
            color: theme.colors.textSecondary,
            margin: 0,
            maxWidth: 760,
          }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}
