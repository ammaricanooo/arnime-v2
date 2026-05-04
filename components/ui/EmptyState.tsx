interface EmptyStateProps {
  image?: string
  title?: string
  description: string
}

export default function EmptyState({ image, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
      {image && (
        <img src={image} alt="" className="w-48 mb-4 opacity-80" />
      )}
      {title && (
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">{title}</h2>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  )
}
