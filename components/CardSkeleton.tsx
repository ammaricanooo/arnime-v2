// Shared skeleton card — identical structure for both anime and comic grids

export default function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      {/* Poster area */}
      <div className="aspect-3/4 bg-slate-200 dark:bg-slate-800" />
      {/* Title lines */}
      <div className="p-2.5 space-y-1.5">
        <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
      </div>
    </div>
  )
}
