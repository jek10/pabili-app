/**
 * Main App Component - FIXED
 * Persistent login + Proper location handling
 */
import { useState, useEffect } from 'react'
import './App.css'
import { getUserLocation } from './utils/locationUtils'
import LoginScreen from './components/LoginScreen'
import CustomerDashboard from './components/CustomerDashboard'
import AgentDashboard from './components/AgentDashboard'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)

  // STEP 1: Get location FIRST (before loading saved user)
  useEffect(() => {
    getUserLocation(
      (location) => {
        console.log('✅ Location obtained:', location)
        setUserLocation(location)
        setIsLoadingLocation(false)
      },
      (error) => {
        console.log('Using default location')
        setUserLocation({ lat: 14.5995, lng: 120.9842 })
        setIsLoadingLocation(false)
      }
    )
  }, [])

  // STEP 2: Load saved user ONLY AFTER location is ready
  useEffect(() => {
    if (!isLoadingLocation) {
      const savedUser = localStorage.getItem('pabili_current_user')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          console.log('✅ Auto-login:', user.name)
          setCurrentUser(user)
        } catch (error) {
          console.error('Error loading saved user:', error)
          localStorage.removeItem('pabili_current_user')
        }
      }
    }
  }, [isLoadingLocation])

  const handleLogin = (user) => {
    setCurrentUser(user)
    localStorage.setItem('pabili_current_user', JSON.stringify(user))
    console.log('✅ User saved to localStorage')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('pabili_current_user')
    console.log('✅ User logged out')
  }

  // Show loading screen while getting location
  if (isLoadingLocation) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f5f5',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #4CAF50',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#666', fontSize: '16px' }}>Loading Pabili...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="App">
      {!currentUser ? (
        <LoginScreen onLogin={handleLogin} />
      ) : currentUser.user_type === 'customer' ? (
        <CustomerDashboard
          currentUser={currentUser}
          userLocation={userLocation}
          onLogout={handleLogout}
        />
      ) : currentUser.user_type === 'agent' ? (
        <AgentDashboard
          currentUser={currentUser}
          userLocation={userLocation}
          onLogout={handleLogout}
        />
      ) : currentUser.user_type === 'admin' ? (
        <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <div>Unknown user type</div>
      )}
    </div>
  )
}

export default App