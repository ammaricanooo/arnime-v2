// Shared skeleton card — matches the actual card structure exactly:
// poster fills the card, title is overlaid at the bottom (no text below)

export default function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      {/* Poster — same aspect ratio as real cards */}
      <div className="relative aspect-3/4 bg-slate-200 dark:bg-slate-800">
        {/* Simulated gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-slate-300/60 dark:from-slate-700/60 to-transparent" />
        {/* Simulated title lines at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-1.5">
          <div className="h-2.5 bg-slate-300 dark:bg-slate-700 rounded w-full" />
          <div className="h-2 bg-slate-300/70 dark:bg-slate-700/70 rounded w-2/3" />
        </div>
      </div>
    </div>
  )
}
