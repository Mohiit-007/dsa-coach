import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Landing         from "./pages/Landing";
import Login           from "./pages/Login";
import Register        from "./pages/Register";
import AppLayout       from "./components/AppLayout";
import Dashboard       from "./pages/Dashboard";
import Analyzer        from "./pages/Analyzer";
import History         from "./pages/History";
import Profile         from "./pages/Profile";
import MockInterview   from "./pages/MockInterview";
import LearningPath    from "./pages/LearningPath";
import MyLearningPaths from "./pages/MyLearningPaths";
import TopicStrength   from "./pages/TopicStrength";
import CodeExplainer   from "./pages/CodeExplainer";
import CodeDebugger    from "./pages/CodeDebugger";
import Pricing         from "./pages/Pricing";
import PracticeList    from "./pages/PracticeList";
import TopicProblems   from "./pages/TopicProblems";

function PrivateRoute({ children }) {
  const { user, initialized } = useAuth();
  if (!initialized) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-2xl animate-pulse">
            ⚡
          </div>
          <div className="text-gray-500 font-mono text-sm">Loading...</div>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, initialized } = useAuth();
  if (!initialized) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111827",
              color: "#f9fafb",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "Outfit, sans-serif",
              fontSize: "14px",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "#4ade80", secondary: "#111827" } },
            error:   { iconTheme: { primary: "#f87171", secondary: "#111827" } },
          }}
        />
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="dashboard"      element={<Dashboard />} />
            <Route path="analyzer"       element={<Analyzer />} />
            <Route path="history"        element={<History />} />
            <Route path="mock-interview" element={<MockInterview />} />
            <Route path="learning-path"  element={<LearningPath />} />
            <Route path="learning-paths" element={<MyLearningPaths />} />
            <Route path="topic-strength" element={<TopicStrength />} />
            <Route path="explainer"      element={<CodeExplainer />} />
            <Route path="debugger"       element={<CodeDebugger />} />
            <Route path="profile"        element={<Profile />} />
            <Route path="pricing"        element={<Pricing />} />
            <Route path="practice"       element={<PracticeList />} />
            <Route path="practice/:topicSlug" element={<TopicProblems />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
