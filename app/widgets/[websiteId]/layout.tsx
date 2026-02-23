export default function WidgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ margin: 0, background: "transparent" }}
    >
      {children}
    </div>
  );
}
