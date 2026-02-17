"use client";

export function DashboardPreview() {
  return (
    <div className="px-4 lg:px-6 pb-20">
      <div className="relative rounded-xl border border-stone-200 bg-white overflow-hidden">
        <iframe
          src="/demo"
          title="Postmetric dashboard demo"
          className="w-full h-[560px] md:h-[680px] rounded-lg border-0 bg-stone-50"
          loading="lazy"
        />
      </div>
    </div>
  );
}
