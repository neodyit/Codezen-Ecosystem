import React, { useState } from "react";

const Join = () => {
  const [name, setName] = useState("");
  const [track, setTrack] = useState("Media team");
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const firstName = trimmedName.split(" ")[0] || "Builder";
    setMessage(
      `${firstName}, your ${track} invite is ready. Meet the club at the next build session.`
    );
    setShowMessage(true);
    setName("");
    setTrack("Media team");
  };

  return (
    <section id="join" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-8 rounded-lg bg-ink p-6 text-white shadow-soft md:grid-cols-[0.9fr_1.1fr] md:p-10">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-mint">Join</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Start with one build session</h2>
          <p className="mt-5 text-sm leading-7 text-white/65">
            Share your interest, choose a track, and get a quick invite for the next build session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg bg-white p-5 text-ink">
          <div className="grid gap-2">
            <label className="text-sm font-black text-ink" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="rounded-lg border border-ink/15 px-4 py-3 outline-none focus:border-coral bg-white text-ink"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-black text-ink" htmlFor="track">
              Preferred track
            </label>
            <select
              id="track"
              className="rounded-lg border border-ink/15 px-4 py-3 outline-none focus:border-coral bg-white text-ink"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
            >
              <option value="Media team">Media team</option>
              <option value="Technical team">Technical team</option>
              <option value="Management team">Management team</option>
            </select>
          </div>
          <button
            className="rounded-lg bg-coral px-5 py-3 text-sm font-black text-white transition hover:bg-ink cursor-pointer"
            type="submit"
          >
            Generate invite
          </button>
          {showMessage && (
            <p className="rounded-lg bg-mint/15 p-4 text-sm font-bold text-ink transition-all">
              {message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default Join;
