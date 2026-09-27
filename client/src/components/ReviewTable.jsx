import StatusBadge from "./StatusBadge";
import { formatDate } from "../utils/formatters";

const ReviewTable = ({ reviews }) => (
  <div className="overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200/60 dark:divide-slate-800">
        <thead className="bg-slate-100/80 dark:bg-slate-900/80">
          <tr className="text-left text-sm text-slate-600 dark:text-slate-300">
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Review</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Order ID</th>
            <th className="px-4 py-3">Timestamp</th>
            <th className="px-4 py-3">Trust Score</th>
            <th className="px-4 py-3">Label</th>
            <th className="px-4 py-3">Verified</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 bg-white/70 text-sm dark:divide-slate-800 dark:bg-slate-950/40">
          {reviews.map((review) => (
            <tr key={review._id} className="align-top">
              <td className="px-4 py-4 font-medium text-slate-900 dark:text-slate-50">{review.productName}</td>
              <td className="max-w-xs px-4 py-4 text-slate-600 dark:text-slate-300">{review.reviewText}</td>
              <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{review.userId?.name || review.userId?.email || "Buyer"}</td>
              <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{review.orderId}</td>
              <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatDate(review.createdAt)}</td>
              <td className="px-4 py-4 text-slate-900 dark:text-slate-50">{review.trustScore}</td>
              <td className="px-4 py-4">
                <StatusBadge value={review.label} />
              </td>
              <td className="px-4 py-4">
                <StatusBadge value={review.verified ? "Verified" : "Rejected"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ReviewTable;
