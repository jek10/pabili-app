/**
 * Main App Component - FIXED VERSION
 * Routes between Login, Customer, Agent, and Admin dashboards
 */

import { useState, useEffect } from 'react';
import './App.css';

// Import utilities
import { getUserLocation } from './utils/locationUtils';

// Import components
import LoginScreen from './components/LoginScreen';
import CustomerDashboard from './components/CustomerDashboard';
import AgentDashboard from './components/AgentDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's location on app load
  useEffect(() => {
    getUserLocation()
      .then((location) => {
        setUserLocation(location);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Location error:', error);
        // Set default location if GPS fails
        setUserLocation({ lat: 14.5995, lng: 120.9842 });
        setIsLoading(false);
      });
  }, []);

  // Update view when user changes
  useEffect(() => {
    if (currentUser) {
      setView(currentUser.user_type);
    } else {
      setView('login');
    }
  }, [currentUser]);

  // Handle login
  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Show loading while getting location
  if (isLoading) {
    return (
      <div className="App">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontSize: '18px',
            color: '#666',
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  // Render appropriate view based on current state
  return (
    <div className="App" key={view}>
      {view === 'login' && (
        <LoginScreen userLocation={userLocation} onLogin={handleLogin} />
      )}

      {view === 'customer' && (
        <CustomerDashboard
          currentUser={currentUser}
          userLocation={userLocation}
          onLogout={handleLogout}
        />
      )}

      {view === 'agent' && (
        <AgentDashboard
          currentUser={currentUser}
          userLocation={userLocation}
          onLogout={handleLogout}
        />
      )}

      {view === 'admin' && <AdminDashboard onLogout={handleLogout} />}
    </div>
  );
}

export default App;
