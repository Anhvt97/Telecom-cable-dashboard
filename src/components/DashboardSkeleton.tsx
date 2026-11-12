export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Đang tải dữ liệu báo cáo...">
      {/* 4 KPI Skeleton Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="h-4 w-32 bg-slate-200 rounded-md" />
              <div className="h-10 w-10 bg-slate-100 rounded-xl" />
            </div>
            <div className="h-8 w-28 bg-slate-200 rounded-lg mb-3" />
            <div className="h-3 w-40 bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="h-5 w-44 bg-slate-200 rounded-md mb-2" />
          <div className="h-3 w-56 bg-slate-100 rounded-md mb-6" />
          <div className="mx-auto w-48 h-48 rounded-full border-[22px] border-slate-100 mb-6" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="h-5 w-60 bg-slate-200 rounded-md mb-2" />
          <div className="h-3 w-72 bg-slate-100 rounded-md mb-6" />
          <div className="h-64 flex items-end gap-6 px-6 pt-8">
            {[85, 45, 65, 35].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full">
                <div
                  className="w-full bg-slate-200/80 rounded-t-lg"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="h-5 w-64 bg-slate-200 rounded-md mb-2" />
          <div className="h-3 w-80 bg-slate-100 rounded-md mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-44 bg-slate-200 rounded" />
                <div className="flex-1 h-7 bg-slate-100 rounded-lg relative overflow-hidden">
                  <div
                    className="h-full bg-slate-200 rounded-lg"
                    style={{
                      marginLeft: `${i * 12}%`,
                      width: `${35 - i * 3}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="h-5 w-52 bg-slate-200 rounded-md" />
          <div className="flex gap-3">
            <div className="h-9 w-56 bg-slate-100 rounded-xl" />
            <div className="h-9 w-40 bg-slate-100 rounded-xl" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-slate-100/80 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
