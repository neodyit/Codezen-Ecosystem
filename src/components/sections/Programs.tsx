const Programs = () => {
  return (
    <section id="programs" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-coral">Programs</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl text-ink">Pick your build lane</h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-ink/60">
          Every lane ends with a working artifact: a portfolio piece, a demo, a GitHub repo, or a contribution you can show.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm text-ink">
          <span className="mb-5 block h-2 w-16 rounded bg-mint"></span>
          <h3 className="text-xl font-black">Web Forge</h3>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            HTML, Tailwind, JavaScript, UI thinking, and deployment practice.
          </p>
        </article>
        <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm text-ink">
          <span className="mb-5 block h-2 w-16 rounded bg-coral"></span>
          <h3 className="text-xl font-black">Python Lab</h3>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Problem solving, automation, notebooks, APIs, and backend basics.
          </p>
        </article>
        <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm text-ink">
          <span className="mb-5 block h-2 w-16 rounded bg-sun"></span>
          <h3 className="text-xl font-black">AI Studio</h3>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Prompting, datasets, mini ML models, and responsible AI workflows.
          </p>
        </article>
        <article className="rounded-lg border border-ink/10 bg-white p-6 shadow-sm text-ink">
          <span className="mb-5 block h-2 w-16 rounded bg-ink"></span>
          <h3 className="text-xl font-black">Open Source</h3>
          <p className="mt-3 text-sm leading-6 text-ink/62">
            Git, issues, pull requests, docs, and community collaboration.
          </p>
        </article>
      </div>
    </section>
  );
};

export default Programs;
