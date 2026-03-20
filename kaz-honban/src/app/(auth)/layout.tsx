export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen gradient-mesh bg-bg-primary">
      <div className="flex items-center justify-center min-h-screen px-5 py-12">
        {children}
      </div>
    </div>
  );
}
