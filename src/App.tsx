import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Topic from "./pages/Topic";
import Playground from "./pages/Playground";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import Focus from "./pages/Focus";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/topic/:id" element={<Topic />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
