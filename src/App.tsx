import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Topic from "./pages/Topic";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import Focus from "./pages/Focus";
import Review from "./pages/Review";

// Heavy pages with their own runtimes (StackBlitz SDK, Monaco, Sandpack)
// load only when the user actually visits them.
const Playground = lazy(() => import("./pages/Playground"));

function PageFallback() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
      <div style={{ fontSize: 22, marginBottom: 8 }}>⏳</div>
      <div className="small">Загружаем редактор…</div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/topic/:id" element={<Topic />} />
          <Route
            path="/playground"
            element={
              <Suspense fallback={<PageFallback />}>
                <Playground />
              </Suspense>
            }
          />
          <Route path="/focus" element={<Focus />} />
          <Route path="/review" element={<Review />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
