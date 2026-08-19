export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={className} role="status" aria-label="Loading">
      <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <LoadingSpinner className="text-muted-foreground" />
    </div>
  );
}