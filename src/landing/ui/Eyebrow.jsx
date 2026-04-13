export default function Eyebrow({ children, color, style }) {
  return (
    <span
      className="landing-eyebrow"
      style={color ? { color, ...style } : style}
    >
      {children}
    </span>
  );
}
