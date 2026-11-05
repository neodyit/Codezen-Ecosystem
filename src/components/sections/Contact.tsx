import React, { useState } from "react";

const Contact = () => {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPurpose, setContactPurpose] = useState("Membership query");
  const [contactMessage, setContactMessage] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [showStatus, setShowStatus] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = contactName.trim();
    const firstName = trimmedName.split(" ")[0] || "Friend";
    setStatusMsg(
      `${firstName}, your ${contactPurpose.toLowerCase()} message is ready for the CodeZen team.`
    );
    setShowStatus(true);
    setContactName("");
    setContactEmail("");
    setContactPurpose("Membership query");
    setContactMessage("");
  };

  return (
    <section id="contact" className="bg-white py-20 text-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-coral">Contact Us</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Reach the right club desk</h2>
          <p className="mt-5 text-sm leading-7 text-ink/64">
            Use the form for membership questions, event requests, project support, sponsorship ideas, or general messages. The page will show a frontend-only confirmation after submission.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-[#dcfce7] p-5">
              <p className="text-sm font-black text-ink">Club Room</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                CGC University Mohali, Student Activity Block
              </p>
            </div>
            <div className="rounded-lg bg-skysoft p-5">
              <p className="text-sm font-black text-ink">Response Time</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                Usually within 24 to 48 hours during working days.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-ink/10 bg-[#f7faf8] p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-black text-ink" htmlFor="contactName">
                Name
              </label>
              <input
                id="contactName"
                className="rounded-lg border border-ink/15 bg-white px-4 py-3 outline-none focus:border-coral text-ink"
                type="text"
                placeholder="Your name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-black text-ink" htmlFor="contactEmail">
                Email
              </label>
              <input
                id="contactEmail"
                className="rounded-lg border border-ink/15 bg-white px-4 py-3 outline-none focus:border-coral text-ink"
                type="email"
                placeholder="you@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-black text-ink" htmlFor="contactPurpose">
              Purpose
            </label>
            <select
              id="contactPurpose"
              className="rounded-lg border border-ink/15 bg-white px-4 py-3 outline-none focus:border-coral text-ink"
              value={contactPurpose}
              onChange={(e) => setContactPurpose(e.target.value)}
            >
              <option value="Membership query">Membership query</option>
              <option value="Event collaboration">Event collaboration</option>
              <option value="Project guidance">Project guidance</option>
              <option value="Sponsorship or partnership">Sponsorship or partnership</option>
              <option value="General question">General question</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-black text-ink" htmlFor="contactMessage">
              Message
            </label>
            <textarea
              id="contactMessage"
              className="min-h-32 rounded-lg border border-ink/15 bg-white px-4 py-3 outline-none focus:border-coral text-ink"
              placeholder="Write your message"
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <button
            className="rounded-lg bg-ink px-5 py-3 text-sm font-black text-white transition hover:bg-coral cursor-pointer"
            type="submit"
          >
            Send message
          </button>
          {showStatus && (
            <p className="rounded-lg bg-mint/15 p-4 text-sm font-bold text-ink transition-all">
              {statusMsg}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default Contact;
