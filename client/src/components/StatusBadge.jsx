const styles = {
  Confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  Pending: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  Failed: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  FAKE: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  GENUINE: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  Verified: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  Rejected: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[value]}`}>
    {value}
  </span>
);

export default StatusBadge;
