function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[28px] bg-slate-200/80 ${className}`} />;
}

export default function WorkspaceLoading() {
  return (
    <div className="space-y-5">
      <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-4 h-12 w-64" />
        <SkeletonBlock className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-40 w-full" />
      </div>
    </div>
  );
}
