import { Routes, Route } from 'react-router'
import Welcome from './pages/Welcome'
import Onboarding from './pages/Onboarding'
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Clubs from './pages/Clubs'
import Events from './pages/Events'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/chat/:matchId" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/clubs" element={<Clubs />} />
      <Route path="/events" element={<Events />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  )
}
