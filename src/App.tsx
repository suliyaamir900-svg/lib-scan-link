// App root
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Books from "./pages/Books";
import BookIssues from "./pages/BookIssues";
import QRCodePage from "./pages/QRCode";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import SuperAdmin from "./pages/SuperAdmin";
import StudentEntry from "./pages/StudentEntry";
import StudentPortal from "./pages/StudentPortal";
import SeatManagement from "./pages/SeatManagement";
import SmartSearch from "./pages/SmartSearch";
import Leaderboard from "./pages/Leaderboard";
import Announcements from "./pages/Announcements";
import Notifications from "./pages/Notifications";
import FineTracker from "./pages/FineTracker";
import VisitorLog from "./pages/VisitorLog";
import StudyRooms from "./pages/StudyRooms";
import LibraryEvents from "./pages/LibraryEvents";
import Gamification from "./pages/Gamification";
import BookRecommendations from "./pages/BookRecommendations";
import SeatHeatmap from "./pages/SeatHeatmap";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/books" element={<Books />} />
              <Route path="/book-issues" element={<BookIssues />} />
              <Route path="/seats" element={<SeatManagement />} />
              <Route path="/seat-heatmap" element={<SeatHeatmap />} />
              <Route path="/search" element={<SmartSearch />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/fines" element={<FineTracker />} />
              <Route path="/visitors" element={<VisitorLog />} />
              <Route path="/study-rooms" element={<StudyRooms />} />
              <Route path="/events" element={<LibraryEvents />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/recommendations" element={<BookRecommendations />} />
              <Route path="/qr-code" element={<QRCodePage />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/super-admin" element={<SuperAdmin />} />
              <Route path="/entry/:libraryId" element={<StudentEntry />} />
              <Route path="/portal/:libraryId" element={<StudentPortal />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
