import { calculateHaversineDistance, calculateDistanceWithGoogleMaps } from '../utils/distanceCalculator.js';

/**
 * Geocode address to precise coordinates using Nominatim
 * Includes retry logic for temporary failures
 */
const geocodeAddress = async (address, retries = 2) => {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'GoElectriQ/1.0 (Electric Cab Booking)' },
      });
      
      if (!response.ok) {
        if (response.status === 429 && attempt < retries - 1) {
          // Rate limited - wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error('Geocoding unavailable');
      }
      
      const data = await response.json();
      if (!data || data.length === 0) throw new Error('Address not found');
      
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return { lat: parseFloat(lat.toFixed(8)), lon: parseFloat(lon.toFixed(8)) };
    } catch (error) {
      if (attempt === retries - 1) throw error;
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
};

/**
 * Estimate distance between pickup and drop
 * POST /api/location/estimate { pickup, drop, pickupCoords?: { lat, lng } }
 * Uses precise coordinates when provided; otherwise geocodes addresses
 */
export const estimateDistance = async (req, res) => {
  try {
    const { pickup, drop, pickupCoords: providedPickupCoords } = req.body;
    if (!pickup || !drop || typeof pickup !== 'string' || typeof drop !== 'string' || !pickup.trim() || !drop.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and drop addresses are required',
      });
    }

    // If drop location is very short (< 3 chars), likely incomplete - return default estimate
    if (drop.trim().length < 3) {
      console.log('Drop location too short, returning default estimate');
      return res.json({
        success: true,
        data: {
          distance: 15, // Default estimate
          duration: 30,
          pickupCoords: null,
          dropCoords: null,
          method: 'default_estimate',
          warning: 'Drop location incomplete - showing default estimate',
        },
      });
    }

    let pickupCoords;
    if (providedPickupCoords) {
      // Accept both 'lng' and 'lon' formats
      const lat = providedPickupCoords.lat;
      const lng = providedPickupCoords.lng || providedPickupCoords.lon;
      
      if (typeof lat === 'number' && typeof lng === 'number') {
        pickupCoords = {
          lat: parseFloat(lat.toFixed(8)),
          lon: parseFloat(lng.toFixed(8)),
        };
        console.log('Using provided pickup coordinates:', pickupCoords);
      } else {
        console.warn('Invalid pickup coordinates provided, geocoding address instead:', providedPickupCoords);
        try {
          pickupCoords = await geocodeAddress(pickup.trim());
        } catch (geoError) {
          console.warn('Could not geocode pickup address:', geoError.message);
          // Return error for incomplete pickup
          return res.status(400).json({
            success: false,
            message: 'Pickup location not found',
          });
        }
      }
    } else {
      try {
        pickupCoords = await geocodeAddress(pickup.trim());
      } catch (geoError) {
        console.warn('Could not geocode pickup address:', geoError.message);
        // Return error for incomplete pickup
        return res.status(400).json({
          success: false,
          message: 'Pickup location not found',
        });
      }
    }

    let dropCoords;
    try {
      dropCoords = await geocodeAddress(drop.trim());
    } catch (geoError) {
      console.warn('Could not geocode drop address:', geoError.message);
      // Return 200 with default estimate instead of error for incomplete drop location
      // This allows user to keep typing without errors
      return res.json({
        success: true,
        data: {
          distance: 15, // Default estimate
          duration: 30,
          pickupCoords,
          dropCoords: null,
          method: 'default_estimate',
          warning: 'Drop location incomplete - showing default estimate',
        },
      });
    }
    
    console.log('Distance calculation:', {
      pickup: pickup.trim(),
      pickupCoords,
      drop: drop.trim(),
      dropCoords,
    });

    // Try using Google Maps API for accurate road distance
    let result;
    try {
      result = await calculateDistanceWithGoogleMaps(
        { latitude: pickupCoords.lat, longitude: pickupCoords.lon },
        { latitude: dropCoords.lat, longitude: dropCoords.lon }
      );
      console.log('Using Google Maps distance calculation:', result);
    } catch (googleError) {
      console.warn('Google Maps failed, falling back to Haversine:', googleError.message);
      // Fallback to Haversine if Google Maps fails
      const straightLineKm = calculateHaversineDistance(
        pickupCoords.lat,
        pickupCoords.lon,
        dropCoords.lat,
        dropCoords.lon
      );
      const roadDistanceFactor = 1.3; // Road distance ~30% longer than straight line in urban areas
      result = {
        distance: parseFloat((straightLineKm * roadDistanceFactor).toFixed(2)),
        duration: Math.ceil((straightLineKm * roadDistanceFactor / 30) * 60),
        method: 'haversine_fallback',
      };
    }

    res.json({
      success: true,
      data: {
        distance: result.distance,
        duration: result.duration,
        pickupCoords,
        dropCoords,
        method: result.method,
      },
    });
  } catch (err) {
    console.error('Estimate distance error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to estimate distance',
    });
  }
};

/**
 * Reverse geocode coordinates to human-readable address
 * Uses OpenStreetMap Nominatim API (no API key required)
 */
export const reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates out of valid range',
      });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`;

    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'GoElectriQ/1.0 (Electric Cab Booking)',
      },
    });

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();

    const address = data?.address;
    let displayAddress = data?.display_name || '';

    if (address) {
      const parts = [
        address.house_number,
        address.road,
        address.suburb || address.neighbourhood || address.quarter,
        address.village || address.town || address.city || address.municipality || address.county,
        address.state,
        address.postcode,
        address.country,
      ].filter(Boolean);
      displayAddress = parts.join(', ') || displayAddress;
    }

    res.json({
      success: true,
      data: {
        address: displayAddress,
        lat: latitude,
        lon: longitude,
        raw: data,
      },
    });
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to get address from coordinates',
    });
  }
};

/**
 * Google Places Autocomplete Proxy
 * GET /api/location/google-places/autocomplete?input=...
 * Proxies requests to Google Places API to avoid CORS issues
 * Now searches all of India without location/radius restrictions
 */
export const googlePlacesAutocomplete = async (req, res) => {
  try {
    const {
      input,
      components = 'country:in',
      language = 'en',
      location,
      radius,
      strictbounds,
    } = req.query;
    const apiKey = process.env.GOOGLE_SERVER_KEY;

    if (!input || input.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Input must be at least 1 character',
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured on server',
      });
    }

    console.log(`🔍 Google Places Search: "${input}" in ${components}`);

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', input);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('components', components); // Restrict to India
    url.searchParams.append('language', language);
    if (location) {
      url.searchParams.append('location', location);
    }
    if (radius) {
      url.searchParams.append('radius', radius);
    }
    if (strictbounds !== undefined) {
      url.searchParams.append('strictbounds', strictbounds);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Google Places API error');
    }

    const data = await response.json();

    console.log(`✅ Google Places returned ${data.predictions?.length || 0} predictions`);

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error('Google Places autocomplete error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch Google Places predictions',
    });
  }
};

/**
 * Google Places Details Proxy
 * GET /api/location/google-places/details?place_id=...
 * Proxies requests to Google Places Details API to avoid CORS issues
 */
export const googlePlacesDetails = async (req, res) => {
  try {
    const { place_id } = req.query;
    const apiKey = process.env.GOOGLE_SERVER_KEY;

    if (!place_id) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required',
      });
    }

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Google Maps API key not configured on server',
      });
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', place_id);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('fields', 'geometry,formatted_address,name,address_components');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Google Places API error');
    }

    const data = await response.json();

    res.json({
      success: true,
      data: data,
    });
  } catch (err) {
    console.error('Google Places details error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch place details',
    });
  }
};
