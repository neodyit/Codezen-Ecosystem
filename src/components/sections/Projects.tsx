const Projects = () => {
  return (
    <section id="projects" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-coral">Projects</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl text-ink">A club that ships visible work</h2>
          <p className="mt-5 text-sm leading-7 text-ink/62">
            Members work in small circles and present progress every week. The goal is not only learning syntax. It is learning how to finish.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 text-ink">
          <article className="rounded-lg bg-skysoft p-6">
            <h3 className="text-xl font-black">Campus Lost & Found</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              A searchable item board with simple report and claim screens.
            </p>
          </article>
          <article className="rounded-lg bg-[#fff1d1] p-6">
            <h3 className="text-xl font-black">Study Buddy Finder</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              A matching interface for students preparing for the same subjects.
            </p>
          </article>
          <article className="rounded-lg bg-[#dcfce7] p-6">
            <h3 className="text-xl font-black">Attendance Visualizer</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              A dashboard that turns subject attendance into clear decisions.
            </p>
          </article>
          <article className="rounded-lg bg-[#ffe4e0] p-6">
            <h3 className="text-xl font-black">Club Archive</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Photos, notes, event wins, resources, and member achievements.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Projects;
