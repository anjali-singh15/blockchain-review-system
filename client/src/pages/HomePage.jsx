import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

const cards = [
  {
    label: "Fraud Detection",
    value: "Rule-Based",
    subtitle: "Duplicate detection, velocity checks, and repeat-user monitoring.",
    accent: "text-teal-500",
  },
  {
    label: "Buyer Validation",
    value: "Order ID",
    subtitle: "Any user can sign in, but only buyers already approved in MongoDB with a valid order reference can submit reviews.",
    accent: "text-blue-500",
  },
  {
    label: "Admin Analytics",
    value: "Live",
    subtitle: "Track fake review ratios, trust score health, and review pipeline status.",
    accent: "text-amber-500",
  },
];

const HomePage = () => (
  <section className="page-shell">
    <div className="glass-panel overflow-hidden rounded-[2rem] shadow-soft">
      <div className="grid gap-10 px-6 py-10 lg:grid-cols-[1.4fr_0.9fr] lg:px-10">
        <div>
          <PageHeader
            eyebrow="Web3 + Trust Intelligence"
            title="Detect suspicious product reviews and anchor the evidence on-chain."
            description="This system combines review fraud heuristics with Ethereum-backed hash verification so teams can audit authenticity, inspect trust scores, and verify submissions against blockchain records."
          />
          <div className="flex flex-wrap gap-4">
            <Link to="/submit" className="rounded-full bg-teal-400 px-5 py-3 font-semibold text-black transition hover:bg-teal-300">
              Submit a Review
            </Link>
            <Link to="/public-reviews" className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-black transition hover:border-blue-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-blue-300">
              Browse Public Reviews
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HomePage;
