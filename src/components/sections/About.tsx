const About = () => {
  return (
    <section id="about" className="bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-coral">About Us</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl text-ink">
            A club where curious students become confident builders
          </h2>
          <p className="mt-5 text-sm leading-7 text-ink/64">
            CodeZen is a student-led coding community focused on practical learning. We help beginners write their first useful programs, support intermediate learners with real projects, and give confident coders a place to mentor, compete, and ship ideas.
          </p>
          <p className="mt-4 text-sm leading-7 text-ink/64">
            Our sessions are built around practice: short explanations, hands-on tasks, peer reviews, and demos. Whether someone wants to explore web development, Python, AI, or open source, the club gives them a friendly space to learn by making.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-[#dcfce7] p-6 text-ink">
            <p className="text-4xl font-black">01</p>
            <h3 className="mt-6 text-xl font-black">Learn together</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Small sessions, shared resources, and peer support for every skill level.
            </p>
          </div>
          <div className="rounded-lg bg-[#ffe4e0] p-6 text-ink">
            <p className="text-4xl font-black">02</p>
            <h3 className="mt-6 text-xl font-black">Build often</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Weekly tasks and mini projects that turn concepts into working screens.
            </p>
          </div>
          <div className="rounded-lg bg-skysoft p-6 text-ink">
            <p className="text-4xl font-black">03</p>
            <h3 className="mt-6 text-xl font-black">Share progress</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Demo days help members speak about their work with clarity and confidence.
            </p>
          </div>
          <div className="rounded-lg bg-[#fff1d1] p-6 text-ink">
            <p className="text-4xl font-black">04</p>
            <h3 className="mt-6 text-xl font-black">Grow careers</h3>
            <p className="mt-3 text-sm leading-6 text-ink/65">
              Members build portfolios, GitHub habits, and teamwork skills for internships.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
