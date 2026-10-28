import { Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import ErrorBoundary from './components/ErrorBoundary'
import CookieConsent from './components/CookieConsent'
import IncomingCall from './components/IncomingCall'
import { lazyPage } from './lib/lazyPage'

const Welcome = lazyPage(() => import('./pages/Welcome'))
const Onboarding = lazyPage(() => import('./pages/Onboarding'))
const Discover = lazyPage(() => import('./pages/Discover'))
const Matches = lazyPage(() => import('./pages/Matches'))
const Chat = lazyPage(() => import('./pages/Chat'))
const VideoCall = lazyPage(() => import('./pages/VideoCall'))
const Profile = lazyPage(() => import('./pages/Profile'))
const PublicProfile = lazyPage(() => import('./pages/PublicProfile'))
const Settings = lazyPage(() => import('./pages/Settings'))
const PrivacyPolicy = lazyPage(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazyPage(() => import('./pages/TermsOfService'))
const Clubs = lazyPage(() => import('./pages/Clubs'))
const Events = lazyPage(() => import('./pages/Events'))
const DailyMatch = lazyPage(() => import('./pages/DailyMatch'))
const MyAsks = lazyPage(() => import('./pages/MyAsks'))
const Admin = lazyPage(() => import('./pages/Admin'))
const NotFound = lazyPage(() => import('./pages/NotFound'))

const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-[#BB83C9] border-t-transparent rounded-full animate-spin" />
  </div>
)

function AnimatedRoutes() {
  const location = useLocation()
  // A new screen opens at its top. The document scroll used to carry over, so
  // Settings opened halfway down after scrolling the Profile that links to it.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Welcome />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/chat/:matchId" element={<Chat />} />
      <Route path="/video/:matchId" element={<VideoCall />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:userId" element={<PublicProfile />} />
      {/* Shareable, human-readable alias of the line above — this is the URL
          that goes out in "ask me anything" links. */}
      <Route path="/u/:username" element={<PublicProfile />} />
      <Route path="/my-asks" element={<MyAsks />} />
      <Route path="/clubs" element={<Clubs />} />
      <Route path="/events" element={<Events />} />
      <Route path="/daily-match" element={<DailyMatch />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSpinner />}>
        <AnimatedRoutes />
        <IncomingCall />
        <CookieConsent />
      </Suspense>
    </ErrorBoundary>
  )
}
