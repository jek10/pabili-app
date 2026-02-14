/**
 * Main App Component - WITH PERSISTENT LOGIN
 * Keeps user logged in using localStorage
 */

import { useState, useEffect } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import { getUserLocation } from './utils/locationUtils'

import LoginScreen from './components/LoginScreen'
import CustomerDashboard from './components/CustomerDashboard'
import AgentDashboard from './components/AgentDashboard'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [userLocation, setUserLocation] = useState(null)

  // Load saved user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('pabili_current_user')
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error loading saved user:', error)
        localStorage.removeItem('pabili_current_user')
      }
    }
  }, [])

  // Get user location
  useEffect(() => {
    getUserLocation((location) => {
      setUserLocation(location)
    }, (error) => {
      console.error('Error getting location:', error)
      setUserLocation({ lat: 14.5995, lng: 120.9842 })
    })
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
    // Save to localStorage for persistent login
    localStorage.setItem('pabili_current_user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    // Clear localStorage on logout
    localStorage.removeItem('pabili_current_user')
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
