import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactLenis } from 'lenis/react';
import Index from "./pages/public/Index";
import NotFound from "./pages/errors/NotFound";

const App = () => (
  <ReactLenis root options={{
    autoRaf: true,
    smoothWheel: true,
    duration: 1.2,
    wheelMultiplier: 0.9,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    syncTouch: true,
    syncTouchLerp: 0.15,
    touchMultiplier: 1.2,
    touchInertiaExponent: 1.55,
  }}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ReactLenis>
);

export default App;
