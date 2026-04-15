const Card = ({ children, className = "" }) => {
  return (
    <div className={`rounded-xl border border-swoop-border bg-swoop-panel p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ children }) => {
  return (
    <h4 className="mb-1 font-medium text-swoop-text text-theme-xl">
      {children}
    </h4>
  );
};

const CardDescription = ({ children }) => {
  return <p className="text-sm text-swoop-text-muted">{children}</p>;
};

export { Card, CardTitle, CardDescription };
