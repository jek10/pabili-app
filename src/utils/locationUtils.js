/**
 * Location Utilities
 * Handles GPS location and distance calculations
 */

/**
 * Get user's current location using browser geolocation API
 * Falls back to Manila coordinates if permission denied
 */
export const getUserLocation = () => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location error:', error);
          // Fallback to Manila coordinates
          resolve({
            lat: 14.5995,
            lng: 120.9842,
          });
        }
      );
    } else {
      // Browser doesn't support geolocation
      resolve({
        lat: 14.5995,
        lng: 120.9842,
      });
    }
  });
};

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Get Google Maps directions URL
 */
export const getDirectionsUrl = (origin, destination) => {
  const encodedAddress = encodeURIComponent(destination);

  if (origin && origin.lat && origin.lng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${encodedAddress}`;
  } else {
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }
};

/**
 * Open Google Maps directions in new tab
 */
export const openDirections = (origin, destination) => {
  const url = getDirectionsUrl(origin, destination);
  window.open(url, '_blank');
};
