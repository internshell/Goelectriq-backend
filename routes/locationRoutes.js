import express from 'express';
import { reverseGeocode, estimateDistance, googlePlacesAutocomplete, googlePlacesDetails } from '../controllers/locationController.js';

const router = express.Router();

// GET /api/location/reverse-geocode?lat=...&lon=...
router.get('/reverse-geocode', reverseGeocode);

// POST /api/location/estimate { pickup, drop }
router.post('/estimate', estimateDistance);

// GET /api/location/google-places/autocomplete?input=...
router.get('/google-places/autocomplete', googlePlacesAutocomplete);

// GET /api/location/google-places/details?place_id=...
router.get('/google-places/details', googlePlacesDetails);

export default router;
