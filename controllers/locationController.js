import axios from 'axios';
import { calculateHaversineDistance, calculateDistanceWithGoogleMaps, getCoordinatesFromAddress, getAddressFromCoordinates } from '../utils/distanceCalculator.js';

/**
 * Geocode address to precise coordinates using Google Geocoding API
 * Includes retry logic for temporary failures
 */
const geocodeAddress = async (address, retries = 2) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await getCoordinatesFromAddress(address);
      return { lat: result.latitude, lon: result.longitude };
    } catch (error) {
      if (attempt === retries - 1) throw new Error(`Geocoding failed for "${address}": ${error.message}`);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      console.log(`Geocoding retry ${attempt + 1}/${retries - 1} for "${address}"`);
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
 * Uses Google Geocoding API (Reverse Geocoding)
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

    console.log(`🔄 Reverse geocoding: ${latitude}, ${longitude}`);
    
    const result = await getAddressFromCoordinates(latitude, longitude);
    
    console.log(`✅ Reverse geocoding successful: ${result.formattedAddress}`);

    return res.json({
      success: true,
      data: {
        address: result.formattedAddress,
        placeId: result.placeId,
        addressComponents: result.addressComponents,
      },
    });
  } catch (error) {
    console.error('❌ Reverse geocoding error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Reverse geocoding failed',
      error: error.message,
    });
  }
};

/**
 * Google Places Autocomplete Proxy
 * GET /api/location/google-places/autocomplete?input=...
 * Proxies requests to Google Places API to avoid CORS issues
 * Fixed: Proper India location bias and input validation
 */
export const googlePlacesAutocomplete = async (req, res) => {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      let {
        input,
        components = 'country:in',
        language = 'en',
        location,
        radius,
        strictbounds,
      } = req.query;

      // Trim input
      input = input?.trim();
      const apiKey = process.env.GOOGLE_SERVER_KEY;

      // ✅ INPUT VALIDATION: Prevent too short queries
      if (!input || input.length < 2) {
        console.warn(`⚠️ Google Places: Input too short "${input}"`);
        return res.status(400).json({
          success: false,
          message: 'Input must be at least 2 characters',
          predictions: [],
        });
      }

      if (!apiKey) {
        return res.status(500).json({
          success: false,
          message: 'Google Maps API key not configured on server',
        });
      }

      console.log(`🔍 Google Places Search (Attempt ${attempt + 1}/${maxRetries}): "${input}" (components: ${components})`);

      // Build params object
      const params = {
        input: input,
        key: apiKey,
        components: components, // Restrict to India
        language: language,
      };

      // ✅ Set default location bias to India center if not provided
      const defaultLocation = location || '20.5937,78.9629'; // India center
      const defaultRadius = radius || '2000000'; // ~2000km to cover all India
      
      params.location = defaultLocation;
      params.radius = defaultRadius;
      
      // ✅ Force results within India boundaries
      params.strictbounds = 'true';

      console.log(`📍 Location bias: ${defaultLocation}, Radius: ${defaultRadius}m`);

      // ✅ Use axios with timeout and retry config
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: params,
          timeout: 8000, // 8 second timeout
          headers: {
            'User-Agent': 'GoElectriQ/1.0',
          },
        }
      );

      const data = response.data;

      // Log the status and results
      if (data.status === 'OK') {
        console.log(`✅ Google Places returned ${data.predictions?.length || 0} predictions`);
      } else if (data.status === 'ZERO_RESULTS') {
        console.warn(`⚠️ Google Places returned ZERO_RESULTS for "${input}"`);
      } else {
        console.warn(`⚠️ Google Places status: ${data.status}`, data.error_message);
      }

      return res.json({
        success: true,
        data: data,
      });
    } catch (err) {
      lastError = err;
      console.error(`❌ Google Places autocomplete error (Attempt ${attempt + 1}/${maxRetries}):`, err.message);
      
      // Don't retry on input validation errors
      if (err.response?.status === 400) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid request to Google Places API',
          predictions: [],
        });
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = 1000 * Math.pow(2, attempt);
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  console.error(`❌ Google Places API failed after ${maxRetries} attempts:`, lastError?.message);
  res.status(500).json({
    success: false,
    message: lastError?.message || 'Failed to fetch Google Places predictions after multiple retries',
    predictions: [],
    error: lastError?.code,
  });
};

/**
 * Google Places Details Proxy
 * GET /api/location/google-places/details?place_id=...
 * Proxies requests to Google Places Details API to avoid CORS issues
 */
export const googlePlacesDetails = async (req, res) => {
  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
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

      const params = {
        place_id: place_id,
        key: apiKey,
        fields: 'geometry,formatted_address,name,address_components',
      };

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: params,
          timeout: 8000,
          headers: {
            'User-Agent': 'GoElectriQ/1.0',
          },
        }
      );

      const data = response.data;

      return res.json({
        success: true,
        data: data,
      });
    } catch (err) {
      lastError = err;
      console.error(`❌ Google Places details error (Attempt ${attempt + 1}/${maxRetries}):`, err.message);

      // Don't retry on input validation errors
      if (err.response?.status === 400) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid request to Google Places API',
        });
      }

      // Wait before retrying
      if (attempt < maxRetries - 1) {
        const waitTime = 1000 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // All retries failed
  console.error(`❌ Google Places Details API failed after ${maxRetries} attempts:`, lastError?.message);
  res.status(500).json({
    success: false,
    message: lastError?.message || 'Failed to fetch place details after multiple retries',
    error: lastError?.code,
  });
};
