const { Client } = require('@googlemaps/google-maps-services-js');
const env = require('../../config/env');
const { log } = require('../../utils/logger');

class MapsService {
  constructor() {
    this.client = new Client({});
    this.apiKey = env.GOOGLE_MAPS_API_KEY;
  }

  async findBoothAndRoute(userLocation, boothPincode) {
    try {
      if (!this.apiKey) {
        throw new Error('Google Maps API Key not configured');
      }

      const booths = await this._searchBooths(userLocation, boothPincode);
      if (booths.length === 0) {
        throw new Error('No booths found in this area');
      }

      const primaryBooth = booths[0];
      const route = await this._getDirections(userLocation, primaryBooth);

      return this._formatResponse(booths, route);
    } catch (error) {
      log.error('Maps API Error', { error: error.message });
      return this._getFallbackResponse();
    }
  }

  async _searchBooths(userLocation, boothPincode) {
    const searchRes = await this.client.textSearch({
      params: {
        query: `polling booth near ${boothPincode || 'my location'}`,
        location: (userLocation && userLocation.lat) ? userLocation : undefined,
        radius: 5000,
        key: this.apiKey,
      },
    });
    return searchRes.data.results.slice(0, 3);
  }

  async _getDirections(userLocation, primaryBooth) {
    if (!userLocation || !userLocation.lat || !primaryBooth.geometry) {
      return null;
    }

    try {
      const directionsRes = await this.client.directions({
        params: {
          origin: userLocation,
          destination: primaryBooth.geometry.location,
          mode: 'walking',
          key: this.apiKey,
        },
      });
      return directionsRes.data.routes[0];
    } catch (dirErr) {
      log.warn('Directions API failed, continuing with booth list only', { error: dirErr.message });
      return null;
    }
  }

  _formatResponse(booths, route) {
    const primaryBooth = booths[0];
    return {
      primaryBooth: {
        name: primaryBooth.name,
        address: primaryBooth.formatted_address,
        location: primaryBooth.geometry.location,
        rating: primaryBooth.rating,
      },
      otherBooths: booths.slice(1).map(b => ({
        name: b.name,
        address: b.formatted_address,
        location: b.geometry.location,
      })),
      route,
      summary: `Found ${booths.length} booths nearby. ${route ? `Primary booth is ${route.legs[0].distance.text} away.` : ''}`,
    };
  }

  _getFallbackResponse() {
    return {
      error: true,
      message: 'Could not fetch live booth data. Please visit electoralsearch.eci.gov.in for official booth info.',
      officialLink: 'https://electoralsearch.eci.gov.in/',
    };
  }
}

module.exports = new MapsService();
