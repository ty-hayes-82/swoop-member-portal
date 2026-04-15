const Badge = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
}) => {
  const baseStyles =
    "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium";

  const sizeStyles = {
    sm: "text-theme-xs",
    md: "text-sm",
  };

  const variants = {
    light: {
      primary:
        "bg-brand-50 text-brand-500",
      success:
        "bg-success-50 text-success-600",
      error:
        "bg-error-50 text-error-600",
      warning:
        "bg-warning-50 text-warning-600",
      info: "bg-blue-light-50 text-blue-light-500",
      light: "bg-swoop-row text-swoop-text-2",
      dark: "bg-gray-500 text-white",
    },
    solid: {
      primary: "bg-brand-500 text-white",
      success: "bg-success-500 text-white",
      error: "bg-error-500 text-white",
      warning: "bg-warning-500 text-white",
      info: "bg-blue-light-500 text-white",
      light: "bg-gray-400 text-white",
      dark: "bg-swoop-row text-white",
    },
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
