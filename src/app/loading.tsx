export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="h-9 w-64 animate-pulse rounded-xl bg-cream-200" />
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 h-44 animate-pulse rounded-3xl bg-cream-200/80 md:col-span-8" />
        <div className="col-span-12 h-44 animate-pulse rounded-3xl bg-cream-200/80 md:col-span-4" />
        <div className="col-span-12 h-64 animate-pulse rounded-3xl bg-cream-200/80 md:col-span-7" />
        <div className="col-span-12 h-64 animate-pulse rounded-3xl bg-cream-200/80 md:col-span-5" />
      </div>
    </div>
  );
}