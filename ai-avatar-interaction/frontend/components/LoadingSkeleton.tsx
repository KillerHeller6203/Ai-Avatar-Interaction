export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse my-8">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-36 h-36 rounded-full shimmer" />
        <div className="w-32 h-4 rounded shimmer" />
        <div className="w-48 h-3 rounded shimmer" />
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="w-24 h-4 rounded shimmer mb-3" />
        <div className="space-y-2">
          <div className="w-full h-3 rounded shimmer" />
          <div className="w-4/5 h-3 rounded shimmer" />
          <div className="w-3/5 h-3 rounded shimmer" />
        </div>
      </div>

      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="flex justify-between mb-4">
            <div className="w-28 h-5 rounded shimmer" />
            <div className="w-20 h-5 rounded-full shimmer" />
          </div>
          <div className="space-y-2">
            <div className="w-full h-3 rounded shimmer" />
            <div className="w-5/6 h-3 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
