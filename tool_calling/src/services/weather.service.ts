export default class WeatherService {
    static async getWeather(location: string) {
        // For more info visit: https://www.weatherapi.com/docs/
        const url = `http://api.weatherapi.com/v1/current.json?q=${encodeURIComponent(location)}&key=${process.env.WEATHER_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch weather data: ${response?.statusText}`);
        }
        const data = await response.json();
        return data;
    }
}