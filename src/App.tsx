import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useTournamentStore } from "./store";
import { Layout } from "./components/Layout";
import { RegistrationPage } from "./pages/RegistrationPage";
import { MatchesPage } from "./pages/MatchesPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
  const sync = useTournamentStore((s) => s.sync);

  useEffect(() => {
    sync();
  }, [sync]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RegistrationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
