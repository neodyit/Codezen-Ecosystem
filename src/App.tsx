import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ReactLenis } from 'lenis/react';
import Index from "./pages/public/Index";
import Members from "./pages/public/Members";
import Events from "./pages/public/Events";
import Store from "./pages/public/Store";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import EventRegistrations from "./pages/dashboard/EventRegistrations";
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
        <Route path="/members" element={<Members />} />
        <Route path="/events" element={<Events />} />
        <Route path="/store" element={<Store />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/events/:eventId/registrations" element={<EventRegistrations />} />
        <Route path="/dashboard/:section" element={<Dashboard />} />
        <Route path="/dashboard/:section/:category" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </ReactLenis>
);

export default App;
