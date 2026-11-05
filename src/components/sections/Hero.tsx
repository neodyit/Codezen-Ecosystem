import Statistics from "./Statistics";

const Hero = () => {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          className="h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1800&q=80"
          alt="Students collaborating around laptops"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/28"></div>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-7xl content-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="max-w-2xl flex flex-col justify-center">
          <p className="mb-5 inline-flex rounded-lg border border-ink/10 bg-white/80 px-3 py-2 text-xs font-black uppercase tracking-[0.22em] text-coral shadow-sm w-fit">
            Build. Debug. Ship.
          </p>
          <h1 className="text-5xl font-black leading-none text-ink sm:text-6xl lg:text-7xl">
            CodeZen Club
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-ink/68">
            A campus club for students who want to turn ideas into working products through code jams, project labs, peer mentoring, and real public demos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="rounded-lg bg-coral px-6 py-3 text-center text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-ink"
              href="#join"
            >
              Become a member
            </a>
            <a
              className="rounded-lg border border-ink/15 bg-white/75 px-6 py-3 text-center text-sm font-black text-ink transition hover:bg-white"
              href="#events"
            >
              View events
            </a>
          </div>
        </div>

        <Statistics />
      </div>
    </section>
  );
};

export default Hero;
