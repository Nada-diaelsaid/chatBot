import WeatherService from "../services/weather.service.ts";
import type { Request, Response } from "express";

export default class WeatherController {
    static async getWeather(req: Request, res: Response) {
        try {
            const {q} = req.query;
            if (!q) {
                return res.status(400).json({ success: false, error: 'Location is required' });
            }
            const weather = await WeatherService.getWeather(q as string);
            return res.json({sucess: true, weather});
        } catch (error: any) {
            console.error("Weather API error:", error)
            return res.status(500).json({ success: false, error: error.message });
        }

    }
}