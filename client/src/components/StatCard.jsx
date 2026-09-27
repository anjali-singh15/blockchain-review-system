const StatCard = ({ label, value, accent, subtitle }) => (
  <div className="glass-panel rounded-3xl p-5 shadow-soft">
    <p className={`text-sm font-medium ${accent}`}>{label}</p>
    <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
  </div>
);

export default StatCard;
