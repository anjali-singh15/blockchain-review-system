const PageHeader = ({ eyebrow, title, description, actions }) => (
  <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.3em] text-teal-400">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
      <p className="mt-3 text-base text-slate-600 dark:text-slate-300">{description}</p>
    </div>
    {actions ? <div>{actions}</div> : null}
  </div>
);

export default PageHeader;
