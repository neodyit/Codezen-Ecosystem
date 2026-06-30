import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-3">
          <img
            className="h-10 w-10 rounded-lg object-cover"
            src="https://media.licdn.com/dms/image/v2/D560BAQG49ep1ef-YlA/company-logo_200_200/B56ZXOBheWGsAI-/0/1742918261533/codezenofficial_logo?e=2147483647&v=beta&t=t2ULJHoFbZiTYzSkYVNM8IKYwtrgJtiLDQB4tEG6koE"
            alt="CodeZen logo"
          />
          <span>
            <span className="block text-base font-black tracking-wide text-ink">CodeZen</span>
            <span className="block text-xs font-medium text-ink/55">Build Develop Grow</span>
          </span>
        </a>

        <button
          onClick={toggleMenu}
          className="rounded-lg border border-ink/15 p-2 text-ink md:hidden cursor-pointer"
          type="button"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="hidden items-center gap-7 text-sm font-semibold text-ink/70 md:flex">
          <a className="hover:text-ink transition-colors" href="#about">About</a>
          <a className="hover:text-ink transition-colors" href="#programs">Programs</a>
          <a className="hover:text-ink transition-colors" href="#events">Events</a>
          <a className="hover:text-ink transition-colors" href="#projects">Projects</a>
          <a className="hover:text-ink transition-colors" href="#contact">Contact</a>
          <a className="rounded-lg bg-ink px-4 py-2 text-white transition hover:bg-coral" href="#join">Join Club</a>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`${isOpen ? "block" : "hidden"} border-t border-ink/10 bg-white px-4 py-4 md:hidden`}>
        <div className="grid gap-3 text-sm font-semibold text-ink/75">
          <a href="#about" onClick={closeMenu} className="hover:text-ink">About</a>
          <a href="#programs" onClick={closeMenu} className="hover:text-ink">Programs</a>
          <a href="#events" onClick={closeMenu} className="hover:text-ink">Events</a>
          <a href="#projects" onClick={closeMenu} className="hover:text-ink">Projects</a>
          <a href="#contact" onClick={closeMenu} className="hover:text-ink">Contact</a>
          <a href="#join" onClick={closeMenu} className="rounded-lg bg-ink px-4 py-2 text-white text-center hover:bg-coral transition-colors">Join Club</a>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
