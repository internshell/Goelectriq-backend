import axios from 'axios';

/**
 * Calculate distance using Haversine formula
 * Returns distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return parseFloat(distance.toFixed(2));
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate distance and duration using Google Maps Distance Matrix API
 * Uses GOOGLE_SERVER_KEY for server-to-server calls (no referer restrictions)
 */
export const calculateDistanceWithGoogleMaps = async (origin, destination) => {
  try {
    const apiKey = process.env.GOOGLE_SERVER_KEY;
    
    if (!apiKey) {
      console.warn('❌ Google Maps API key not configured. Using Haversine formula.');
      
      // Fallback to Haversine calculation
      const distance = calculateHaversineDistance(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude
      );
      
      const duration = Math.ceil((distance / 30) * 60); // Assuming 30 km/h avg speed
      
      return {
        distance,
        duration,
        method: 'haversine_no_key',
      };
    }

    const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    
    const params = {
      origins: `${origin.latitude},${origin.longitude}`,
      destinations: `${destination.latitude},${destination.longitude}`,
      key: apiKey,
      mode: 'driving',
      units: 'metric',
    };

    console.log('🔄 Calling Google Maps Distance Matrix API...');
    const response = await axios.get(url, { params, timeout: 10000 });

    console.log('📊 Google Maps Response Status:', response.data.status);
    
    if (response.data.status === 'OK' && response.data.rows && response.data.rows.length > 0) {
      const element = response.data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        const distance = parseFloat((element.distance.value / 1000).toFixed(2)); // Convert to km
        const duration = Math.ceil(element.duration.value / 60); // Convert to minutes
        
        console.log('✅ Google Maps Success:', { distance, duration, distanceText: element.distance.text });
        
        return {
          distance,
          duration,
          method: 'google_maps',
          distanceText: element.distance.text,
          durationText: element.duration.text,
        };
      } else {
        console.warn('⚠️ Google Maps element error:', element.status, element);
      }
    } else {
      console.warn('⚠️ Google Maps API error:', response.data.status, response.data.error_message || '');
    }

    // Fallback to Haversine if Google Maps fails
    console.log('🔄 Falling back to Haversine calculation...');
    const straightlineDistance = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    
    // Road distance is typically 30-50% longer than straight line in urban areas
    const roadDistanceFactor = 1.4; // 40% longer
    const distance = parseFloat((straightlineDistance * roadDistanceFactor).toFixed(2));
    const duration = Math.ceil((distance / 30) * 60); // Assuming 30 km/h avg speed in urban area
    
    console.log(`📏 Haversine: ${straightlineDistance}km straight-line → ${distance}km actual road distance (factor: ${roadDistanceFactor}x)`);
    
    return {
      distance,
      duration,
      method: 'haversine_fallback',
    };
  } catch (error) {
    console.error('Error calculating distance with Google Maps:', error.message);
    
    // Fallback to Haversine calculation
    const distance = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );
    
    const duration = Math.ceil((distance / 30) * 60);
    
    return {
      distance,
      duration,
      method: 'haversine_error_fallback',
    };
  }
};

/**
 * Get geocoding (lat/lng from address) using Google Maps Geocoding API
 */
export const getCoordinatesFromAddress = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_SERVER_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    
    const params = {
      address,
      key: apiKey,
    };

    const response = await axios.get(url, { params });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
      };
    }

    throw new Error('Address not found');
  } catch (error) {
    console.error('Error getting coordinates:', error.message);
    throw error;
  }
};

/**
 * Get address from coordinates (Reverse Geocoding)
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const apiKey = process.env.GOOGLE_SERVER_KEY;

    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    
    const params = {
      latlng: `${latitude},${longitude}`,
      key: apiKey,
    };

    const response = await axios.get(url, { params });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      return {
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents: result.address_components,
      };
    }

    throw new Error('Address not found for coordinates');
  } catch (error) {
    console.error('Error getting address from coordinates:', error.message);
    throw error;
  }
};

/**
 * Validate coordinates
 */
export const validateCoordinates = (latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lon)) {
    return false;
  }
  
  if (lat < -90 || lat > 90) {
    return false;
  }
  
  if (lon < -180 || lon > 180) {
    return false;
  }
  
  return true;
};

/**
 * Check if coordinates are within Jaipur bounds (approximate)
 */
export const isWithinJaipur = (latitude, longitude) => {
  // Approximate bounding box for Jaipur
  const jaipurBounds = {
    north: 27.1,
    south: 26.7,
    east: 76.0,
    west: 75.6,
  };
  
  return (
    latitude >= jaipurBounds.south &&
    latitude <= jaipurBounds.north &&
    longitude >= jaipurBounds.west &&
    longitude <= jaipurBounds.east
  );
};

/**
 * Calculate estimated time of arrival
 */
export const calculateETA = (distance, currentSpeed = 30) => {
  // distance in km, speed in km/h
  const timeInHours = distance / currentSpeed;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + timeInMinutes);
  
  return {
    minutes: timeInMinutes,
    eta: eta.toISOString(),
    etaFormatted: eta.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

export default {
  calculateHaversineDistance,
  calculateDistanceWithGoogleMaps,
  getCoordinatesFromAddress,
  getAddressFromCoordinates,
  validateCoordinates,
  isWithinJaipur,
  calculateETA,
};