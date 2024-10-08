import { zodFunction } from 'openai/helpers/zod';
import { fetchJSON } from '../../utils/fetchJson';
import { z } from 'zod';

interface Coordinate {
  lat: number;
  lon: number;
}

interface ForecastUrls {
  forecast: string;
  forecastHourly: string;
}

// TODO: pull this from env vars
const assistantLocation = 'Fort Collins, CO';
const cachedCoordinateForecastUrl = new Map<string, ForecastUrls>();

async function getLatLongForLocation(_location: string): Promise<Coordinate> {
  // TODO: actually geocode the location
  const lat = 40.5853;
  const lon = -105.0844;
  return { lat, lon };
}

async function getForecastUrls(location: string): Promise<ForecastUrls> {
  const cachedLocation = cachedCoordinateForecastUrl.get(location);
  if (cachedLocation) {
    return cachedLocation;
  }

  // geo code the location
  const { lat, lon } = await getLatLongForLocation(location);

  // first the forecast URLs for the location
  const data = await fetchJSON(`https://api.weather.gov/points/${lat},${lon}`);
  const forecastUrls = {
    forecast: data.properties.forecast,
    forecastHourly: data.properties.forecastHourly,
  };

  cachedCoordinateForecastUrl.set(location, forecastUrls);
  return forecastUrls;
}

async function _getWeatherForecast(location: string, useHourly = false) {
  // get the urls to fetch the forecast
  const urls = await getForecastUrls(location);

  const forecastUrl = useHourly ? urls.forecastHourly : urls.forecast;
  const data = await fetchJSON(forecastUrl);

  const forecast = JSON.stringify(data.properties);
  return forecast;
}

const NoParameters = z.object({});

export const getWeatherForecast = zodFunction({
  name: 'getWeatherForecast',
  description: 'Gets the weather forecast.',
  parameters: NoParameters,
  function: async (_args = {}) => {
    const forecast = await _getWeatherForecast(assistantLocation);
    return forecast;
  },
});

export const getHourlyWeatherForecast = zodFunction({
  name: 'getHourlyWeatherForecast',
  description: 'Gets the hourly weather forecast.',
  parameters: NoParameters,
  function: async (_args = {}) => {
    const forecast = await _getWeatherForecast(assistantLocation, true);
    return forecast;
  },
});
