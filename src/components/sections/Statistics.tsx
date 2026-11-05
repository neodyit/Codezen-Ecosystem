const Statistics = () => {
  return (
    <div className="self-end rounded-lg border border-white/60 bg-ink/90 p-5 text-white shadow-soft backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="text-sm font-black text-mint">live club dashboard</span>
        <span className="rounded bg-mint/15 px-2 py-1 text-xs font-bold text-mint">active</span>
      </div>
      <div className="grid gap-3 py-5 sm:grid-cols-3">
        <div>
          <p className="text-3xl font-black">18+</p>
          <p className="text-xs text-white/60">workshops</p>
        </div>
        <div>
          <p className="text-3xl font-black">240</p>
          <p className="text-xs text-white/60">learners</p>
        </div>
        <div>
          <p className="text-3xl font-black">36</p>
          <p className="text-xs text-white/60">projects</p>
        </div>
      </div>
      <pre className="overflow-hidden rounded-lg bg-white/8 p-4 text-xs leading-6 text-skysoft">
        <code>
{`const club = {
  focus: ["web", "python", "ai", "opensource"],
  ritual: "ship every week",
  status: "accepting new builders"
};`}
        </code>
      </pre>
    </div>
  );
};

export default Statistics;
