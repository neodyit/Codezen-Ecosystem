const Footer = () => {
  return (
    <footer className="border-t border-ink/10 bg-ink py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
        <div>
          <p className="text-lg font-black text-white">CodeZen Club</p>
          <p className="mt-2 text-sm text-white/60">CGC University Mohali | Shaping Tomorrow , Today</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-mint hover:text-mint"
            href="https://www.instagram.com/officialcodezen?igsh=cngxeXh2Y2g3cHJp"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          <a
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-mint hover:text-mint"
            href="https://www.linkedin.com/company/codezenofficial/posts/?feedView=all"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-mint hover:text-mint"
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-mint hover:text-mint"
            href="mailto:info@codezencommunity.in"
          >
            Email
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
