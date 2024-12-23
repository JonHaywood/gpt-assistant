import { zodFunction } from 'openai/helpers/zod';
// @ts-expect-error - no types
import Geocodio from 'geocodio-library-node';
import { z } from 'zod';
import { ADDRESS, GEOCODIO_API_KEY } from '../../config';
import { parentLogger } from '../../logger';
import { fetchJSON } from '../../utils/fetchJson';

/**
 * @file Tools for getting weather forecasts. Uses the Weather.gov API
 * to get the forecast for a lat/lon. Uses the Geocodio API to get the
 * latitude and longitude for a location.
 * @see https://www.weather.gov/documentation/services-web-api
 * @see https://api.weather.gov/openapi.json - for Swagger docs
 */

const logger = parentLogger.child({ filename: 'weather' });

const geocoder = new Geocodio(GEOCODIO_API_KEY);

interface Coordinate {
  lat: number;
  lon: number;
}

interface ForecastUrls {
  forecast: string;
  forecastHourly: string;
}

/**
 * Cache the forecast URLs for a location to avoid repeated geocoding.
 */
const cachedCoordinateForecastUrl = new Map<string, ForecastUrls>();

async function getLatLongForLocation(
  location: string,
): Promise<Coordinate | undefined> {
  const response = await geocoder.geocode(location);
  if (response.error) {
    logger.error(response.error, 'Error geocoding location');
    return;
  }
  if (response.results.length === 0) {
    logger.error(null, 'Could not find location');
    return;
  }

  const { lat, lng: lon } = response.results[0].location;
  return { lat, lon };
}

async function getForecastUrls(
  location: string,
): Promise<ForecastUrls | undefined> {
  const cachedLocation = cachedCoordinateForecastUrl.get(location);
  if (cachedLocation) {
    return cachedLocation;
  }

  // geo code the location
  const result = await getLatLongForLocation(location);
  if (!result) return;

  // first the forecast URLs for the location
  const { lat, lon } = result;
  const data = await fetchJSON(`https://api.weather.gov/points/${lat},${lon}`);
  const forecastUrls = {
    forecast: data.properties.forecast,
    forecastHourly: data.properties.forecastHourly,
  };

  cachedCoordinateForecastUrl.set(location, forecastUrls);
  return forecastUrls;
}

async function _getWeatherForecast(location: string | null, useHourly = false) {
  if (!location) {
    location = ADDRESS;
    if (!location) return 'Location has not been configured.';
  }

  // get the urls to fetch the forecast
  const urls = await getForecastUrls(location);
  if (!urls) return 'Could not get forecast for location.';

  const forecastUrl = useHourly ? urls.forecastHourly : urls.forecast;
  const data = await fetchJSON(forecastUrl);

  const forecast = JSON.stringify(data.properties);
  return forecast;
}

const ForecastParameters = z.object({
  location: z
    .union([z.string(), z.null()])
    .describe(
      "Location to get the forecast for in the format of '<City>, <State Abbr>'. Leave empty to use the assistant's location.",
    ),
});

export const getWeatherForecast = zodFunction({
  name: 'getWeatherForecast',
  description: 'Gets the weather forecast.',
  parameters: ForecastParameters,
  function: async ({ location }) => {
    const forecast = await _getWeatherForecast(location);
    return forecast;
  },
});

export const getHourlyWeatherForecast = zodFunction({
  name: 'getHourlyWeatherForecast',
  description: 'Gets the hourly weather forecast.',
  parameters: ForecastParameters,
  function: async ({ location }) => {
    const forecast = await _getWeatherForecast(location, true);
    return forecast;
  },
});
