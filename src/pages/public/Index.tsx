import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Programs from "@/components/sections/Programs";
import Events from "@/components/sections/Events";
import Projects from "@/components/sections/Projects";
import Join from "@/components/sections/Join";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#f7faf8] text-[#10131f] selection:bg-[#ff6b5f]/30 selection:text-[#10131f] font-sans">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Programs />
        <Events />
        <Projects />
        <Join />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
