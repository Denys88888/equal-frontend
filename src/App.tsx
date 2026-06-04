import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router'
import ErrorBoundary from './components/ErrorBoundary'

const Welcome = lazy(() => import('./pages/Welcome'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Discover = lazy(() => import('./pages/Discover'))
const Matches = lazy(() => import('./pages/Matches'))
const Chat = lazy(() => import('./pages/Chat'))
const VideoCall = lazy(() => import('./pages/VideoCall'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Clubs = lazy(() => import('./pages/Clubs'))
const Events = lazy(() => import('./pages/Events'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-2 border-[#BB83C9] border-t-transparent rounded-full animate-spin" />
  </div>
)

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
      <Suspense fallback={<PageSpinner />}>
        <AnimatedRoutes />
      </Suspense>
    </ErrorBoundary>
  )
}
