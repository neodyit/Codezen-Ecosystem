import { useState } from "react";

type FilterType = "all" | "learn" | "build" | "compete";

interface EventItem {
  type: "learn" | "build" | "compete";
  date: string;
  dateColor: string;
  title: string;
  desc: string;
}

const EVENTS_DATA: EventItem[] = [
  {
    type: "learn",
    date: "03 July",
    dateColor: "text-mint",
    title: "JavaScript Sprint",
    desc: "A fast workshop on DOM, events, forms, and clean UI interactions."
  },
  {
    type: "build",
    date: "10 July",
    dateColor: "text-sun",
    title: "Mini Product Night",
    desc: "Teams build tiny tools for campus life and present them in 90 seconds."
  },
  {
    type: "compete",
    date: "18 July",
    dateColor: "text-coral",
    title: "Algo Arena",
    desc: "A beginner-friendly coding contest with hints, rankings, and prizes."
  }
];

const Events = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const getButtonClass = (filter: FilterType) => {
    return activeFilter === filter
      ? "filter-btn rounded-lg bg-white px-4 py-2 text-sm font-black text-ink transition-colors cursor-pointer"
      : "filter-btn rounded-lg border border-white/20 px-4 py-2 text-sm font-black text-white hover:bg-white/5 transition-colors cursor-pointer";
  };

  const filteredEvents = activeFilter === "all"
    ? EVENTS_DATA
    : EVENTS_DATA.filter((event) => event.type === activeFilter);

  return (
    <section id="events" className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-mint">Events</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">This month at CodeZen</h2>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Event filters">
            <button
              className={getButtonClass("all")}
              onClick={() => handleFilterClick("all")}
              type="button"
            >
              All
            </button>
            <button
              className={getButtonClass("learn")}
              onClick={() => handleFilterClick("learn")}
              type="button"
            >
              Learn
            </button>
            <button
              className={getButtonClass("build")}
              onClick={() => handleFilterClick("build")}
              type="button"
            >
              Build
            </button>
            <button
              className={getButtonClass("compete")}
              onClick={() => handleFilterClick("compete")}
              type="button"
            >
              Compete
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {filteredEvents.map((event, idx) => (
            <article
              key={idx}
              className="event-card rounded-lg border border-white/10 bg-white/8 p-6"
              data-type={event.type}
            >
              <p className={`text-sm font-bold ${event.dateColor}`}>{event.date}</p>
              <h3 className="mt-4 text-2xl font-black">{event.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/65">{event.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Events;
