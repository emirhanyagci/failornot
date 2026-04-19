export function Background() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none bg-background"
      style={{
        backgroundImage:
          "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        backgroundPosition: "-1px -1px",
        opacity: 0.08,
      }}
    />
  );
}
