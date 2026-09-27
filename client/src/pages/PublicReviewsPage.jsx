import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import { getPublicReviews } from "../api/reviewApi";
import { formatDate } from "../utils/formatters";

const PublicReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await getPublicReviews();
        setReviews(response.data);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="Public Reviews"
        title="Verified genuine product reviews"
        description="This feed is public and only includes reviews from authenticated buyers whose orders were validated and whose review content passed the fake-review checks."
      />
      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading public reviews...</p>
      ) : (
        <div className="grid gap-5">
          {reviews.map((review) => (
            <article key={review.id} className="glass-panel rounded-[2rem] p-6 shadow-soft">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{review.productName}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    By {review.userName} | Trust Score: {review.userTrustScore} | {formatDate(review.createdAt)}
                  </p>
                </div>
                <div className="rounded-full bg-emerald-200 px-4 py-2 text-sm font-semibold text-black">
                  {review.rating}/5 Rating
                </div>
              </div>
              <p className="mt-5 text-base leading-7 text-slate-700 dark:text-slate-300">{review.reviewText}</p>
            </article>
          ))}
          {!reviews.length ? <p className="text-sm text-slate-600 dark:text-slate-400">No public reviews are available yet.</p> : null}
        </div>
      )}
    </section>
  );
};

export default PublicReviewsPage;
