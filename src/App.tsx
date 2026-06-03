import { Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Home } from "./pages/Home";
import { Ranking } from "./pages/Ranking";
import { Profile } from "./pages/Profile";
import { PageLoader } from "./components/PageLoader";
import { SubmitLayout } from "./pages/submit/SubmitLayout";
import { StepVideo } from "./pages/submit/StepVideo";
import { StepRange } from "./pages/submit/StepRange";
import { StepConfirm } from "./pages/submit/StepConfirm";

const JoinSubmit = lazy(() =>
  import("./pages/submit/JoinSubmit").then((m) => ({ default: m.JoinSubmit })),
);

export function App() {
  return (
    <div className="min-h-dvh w-full">
      <AuthProvider>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/submit" element={<SubmitLayout />}>
            <Route
              index
              element={
                <Suspense fallback={<PageLoader label="A preparar…" />}>
                  <StepVideo />
                </Suspense>
              }
            />
            <Route path="range" element={<StepRange />} />
            <Route path="confirm" element={<StepConfirm />} />
            <Route
              path="join/:challengeId"
              element={
                <Suspense fallback={<PageLoader label="A carregar…" />}>
                  <JoinSubmit />
                </Suspense>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}
