import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import ReviewTable from "../components/ReviewTable";
import { getReviews } from "../api/reviewApi";

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ search: "", label: "", status: "", page: 1, limit: 8 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);

      try {
        const response = await getReviews(filters);
        setReviews(response.data);
        setPagination(response.pagination);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [filters]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({
      ...current,
      [name]: value,
      page: name === "page" ? value : 1,
    }));
  };

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="Reviews"
        title="Search and inspect submitted reviews"
        description="Browse all submitted reviews, filter verified or rejected items, and inspect the trust score assigned by the fraud detection pipeline."
      />

      <div className="glass-panel rounded-[2rem] p-6 shadow-soft">
        <div className="grid gap-4 md:grid-cols-4">
          <input
            placeholder="Search by product, text, or user"
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
          />
          <select
            value={filters.label}
            onChange={(event) => updateFilter("label", event.target.value)}
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <option value="">All labels</option>
            <option value="GENUINE">GENUINE</option>
            <option value="FAKE">FAKE</option>
          </select>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <option value="">All verification states</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            value={filters.limit}
            onChange={(event) => updateFilter("limit", Number(event.target.value))}
            className="rounded-2xl border border-slate-300 bg-white/70 px-4 py-3 outline-none transition focus:border-teal-400 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <option value="8">8 per page</option>
            <option value="12">12 per page</option>
            <option value="20">20 per page</option>
          </select>
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">Loading reviews...</p>
          ) : reviews.length ? (
            <>
              <ReviewTable reviews={reviews} />
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(value) => updateFilter("page", value)}
              />
            </>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">No reviews match the current filters.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsPage;
