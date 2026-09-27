const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="mt-6 flex items-center justify-between">
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Page {page} of {totalPages || 1}
    </p>
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        Previous
      </button>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        Next
      </button>
    </div>
  </div>
);

export default Pagination;
