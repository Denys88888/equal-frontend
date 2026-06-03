import { Routes, Route, useLocation } from 'react-router'
import Welcome from './pages/Welcome'
import Onboarding from './pages/Onboarding'
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import VideoCall from './pages/VideoCall'
import Profile from './pages/Profile'
import Clubs from './pages/Clubs'
import Events from './pages/Events'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'
import ErrorBoundary from './components/ErrorBoundary'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Welcome />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/chat/:matchId" element={<Chat />} />
      <Route path="/video/:matchId" element={<VideoCall />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/clubs" element={<Clubs />} />
      <Route path="/events" element={<Events />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AnimatedRoutes />
    </ErrorBoundary>
  )
}
