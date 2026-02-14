/**
 * Login Screen Component
 * Handles user registration and login
 */

import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function LoginScreen({ userLocation, onLogin }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('customer');
  const [isNewUser, setIsNewUser] = useState(true);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (isNewUser) {
      // Register new user
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            phone_number: phoneNumber,
            name: name,
            user_type: userType,
            location_lat: userLocation?.lat || 14.5995,
            location_lng: userLocation?.lng || 120.9842,
          },
        ])
        .select();

      if (error) {
        alert('Error: ' + error.message);
        return;
      }
      onLogin(data[0]);
    } else {
      // Login existing user
      const { data, error } = await supabase
        .from('users')
        .select()
        .eq('phone_number', phoneNumber)
        .single();

      if (error || !data) {
        alert('User not found. Please register first.');
        return;
      }

      // Update location
      await supabase
        .from('users')
        .update({
          location_lat: userLocation?.lat || 14.5995,
          location_lng: userLocation?.lng || 120.9842,
        })
        .eq('id', data.id);

      onLogin({
        ...data,
        location_lat: userLocation?.lat,
        location_lng: userLocation?.lng,
      });
    }
  };

  return (
    <div className="login-screen">
      <h1>🏃‍♂️ Pabili App</h1>

      {userLocation ? (
        <div className="location-badge">📍 Location detected</div>
      ) : (
        <div className="location-badge warning">
          ⚠️ Enable location for best experience
        </div>
      )}

      <div className="toggle-buttons">
        <button
          className={isNewUser ? 'active' : ''}
          onClick={() => setIsNewUser(true)}
        >
          Register
        </button>
        <button
          className={!isNewUser ? 'active' : ''}
          onClick={() => setIsNewUser(false)}
        >
          Login
        </button>
      </div>

      <form onSubmit={handleLogin}>
        <input
          type="tel"
          placeholder="Phone Number (or 'admin')"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />

        {isNewUser && (
          <>
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
            >
              <option value="customer">Need Errands Done (Customer)</option>
              <option value="agent">Do Errands for Money (Agent)</option>
            </select>
          </>
        )}

        <button type="submit">{isNewUser ? 'Register' : 'Login'}</button>
      </form>
    </div>
  );
}
