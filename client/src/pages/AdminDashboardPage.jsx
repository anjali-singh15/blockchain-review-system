import { useEffect, useState } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import PageHeader from "../components/PageHeader";
import ReviewTable from "../components/ReviewTable";
import StatCard from "../components/StatCard";
import { getDatasetSummary, getReviews } from "../api/reviewApi";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const AdminDashboardPage = () => {
  const [payload, setPayload] = useState({
    reviews: [],
    analytics: null,
    datasetSummary: { totalRows: 0, totalEmails: 0, totalOrders: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      try {
        const [reviewsResponse, datasetResponse] = await Promise.all([getReviews({ limit: 50 }), getDatasetSummary()]);
        setPayload({
          reviews: reviewsResponse.data,
          analytics: reviewsResponse.analytics,
          datasetSummary: datasetResponse.data,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const analytics = payload.analytics || {
    averageTrustScore: 0,
    fakeCount: 0,
    genuineCount: 0,
    verifiedCount: 0,
  };

  const chartData = {
    labels: ["Fake", "Genuine", "Verified"],
    datasets: [
      {
        label: "Review Distribution",
        data: [analytics.fakeCount, analytics.genuineCount, analytics.verifiedCount],
        backgroundColor: ["#fb7185", "#34d399", "#38bdf8"],
        borderWidth: 0,
      },
    ],
  };

  const trustBands = payload.reviews.reduce(
    (accumulator, review) => {
      if (review.trustScore < 40) accumulator.highRisk += 1;
      else if (review.trustScore < 70) accumulator.mediumRisk += 1;
      else accumulator.lowRisk += 1;
      return accumulator;
    },
    { lowRisk: 0, mediumRisk: 0, highRisk: 0 },
  );

  const barData = {
    labels: ["Low Risk", "Medium Risk", "High Risk"],
    datasets: [
      {
        label: "Review Volume",
        data: [trustBands.lowRisk, trustBands.mediumRisk, trustBands.highRisk],
        backgroundColor: ["#14b8a6", "#f59e0b", "#ef4444"],
        borderRadius: 12,
      },
    ],
  };

  const fakeOnly = payload.reviews.filter((review) => review.label === "FAKE");

  return (
    <section className="page-shell">
      <PageHeader
        eyebrow="Admin"
        title="Fraud monitoring dashboard"
        description="Review platform-level health, isolate suspicious submissions, and inspect the balance between fake and genuine reviews in near real time."
      />

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading dashboard...</p>
      ) : (
        <div className="grid gap-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Average Trust Score"
              value={analytics.averageTrustScore?.toFixed(1) || "0.0"}
              subtitle="Mean score across matching review records."
              accent="text-blue-500"
            />
            <StatCard
              label="Fake Reviews"
              value={analytics.fakeCount}
              subtitle="Flagged suspicious reviews currently stored."
              accent="text-rose-500"
            />
            <StatCard
              label="Genuine Reviews"
              value={analytics.genuineCount}
              subtitle="Submissions that cleared the heuristics threshold."
              accent="text-emerald-500"
            />
            <StatCard
              label="Verified Reviews"
              value={analytics.verifiedCount}
              subtitle="Reviews currently approved for the public feed."
              accent="text-sky-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Approved Reviewer Rows"
              value={payload.datasetSummary.totalRows}
              subtitle="Reviewer records currently available in MongoDB Atlas."
              accent="text-violet-500"
            />
            <StatCard
              label="Approved Emails"
              value={payload.datasetSummary.totalEmails}
              subtitle="Unique buyer emails allowed to submit reviews."
              accent="text-cyan-500"
            />
            <StatCard
              label="Approved Orders"
              value={payload.datasetSummary.totalOrders}
              subtitle="Unique order IDs available for verification."
              accent="text-fuchsia-500"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="glass-panel rounded-[2rem] p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Review Classification Mix</h3>
              <div className="mt-6 h-[320px]">
                <Doughnut data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6 shadow-soft">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Trust Score Risk Bands</h3>
              <div className="mt-6 h-[320px]">
                <Bar
                  data={barData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Fake Review Queue</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{fakeOnly.length} suspicious submissions</p>
            </div>
            {fakeOnly.length ? (
              <ReviewTable reviews={fakeOnly} />
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">No fake reviews detected in the current review set.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminDashboardPage;
