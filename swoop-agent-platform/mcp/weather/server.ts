/**
 * Weather MCP Server — read-only.
 *
 * Wraps the OpenWeather API for forecast and current conditions.
 * Falls back to cached DB weather data if API is unavailable.
 *
 * Run: npx tsx mcp/weather/server.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getVaultCredential } from '../../vaults/schema.ts';

const server = new McpServer({ name: 'weather', version: '1.0.0' });

async function getClubCoords(clubId: string): Promise<{ lat: number; lon: number }> {
  const result = await sql`
    SELECT latitude, longitude FROM club WHERE club_id = ${clubId} LIMIT 1
  `;
  if (!result.rows[0]) throw new Error(`Club not found: ${clubId}`);
  return {
    lat: result.rows[0]['latitude'] as number,
    lon: result.rows[0]['longitude'] as number,
  };
}

// ---------------------------------------------------------------------------
// Tool: get_forecast
// ---------------------------------------------------------------------------

server.tool(
  'get_forecast',
  'Get a 5-day weather forecast for a club location. Returns condition, high/low, and precipitation probability.',
  {
    club_id: z.string(),
    days: z.number().int().min(1).max(5).optional().default(3),
  },
  async ({ club_id, days }) => {
    try {
      const apiKey = getVaultCredential('openweather_api_key');
      const { lat, lon } = await getClubCoords(club_id);

      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial&cnt=${days * 8}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`OpenWeather error: ${resp.status}`);

      const data = await resp.json() as { list: Array<{
        dt_txt: string;
        main: { temp_max: number; temp_min: number };
        weather: Array<{ description: string; main: string }>;
        pop: number;
        wind: { speed: number };
      }> };

      // Reduce to one entry per day (noon forecast)
      const byDay: Record<string, (typeof data.list)[0]> = {};
      for (const item of data.list) {
        const date = item.dt_txt.split(' ')[0]!;
        if (!byDay[date] || item.dt_txt.includes('12:00')) {
          byDay[date] = item;
        }
      }

      const forecast = Object.entries(byDay).slice(0, days).map(([date, item]) => ({
        date,
        condition: item.weather[0]?.description ?? 'unknown',
        temp_high: Math.round(item.main.temp_max),
        temp_low: Math.round(item.main.temp_min),
        precipitation_pct: Math.round((item.pop ?? 0) * 100),
        wind_mph: Math.round(item.wind.speed),
        playable: item.weather[0]?.main !== 'Thunderstorm' && item.pop < 0.7,
      }));

      return { content: [{ type: 'text', text: JSON.stringify(forecast) }] };
    } catch {
      // Fall back to cached weather data
      const result = await sql`
        SELECT date, condition, temp_high, temp_low, precipitation_pct
        FROM weather_cache
        WHERE club_id = ${club_id}
          AND date >= CURRENT_DATE
        ORDER BY date
        LIMIT ${days}
      `;
      return { content: [{ type: 'text', text: JSON.stringify(result.rows) }] };
    }
  },
);

// ---------------------------------------------------------------------------
// Tool: get_conditions
// ---------------------------------------------------------------------------

server.tool(
  'get_conditions',
  'Get current weather conditions for a club location.',
  {
    club_id: z.string(),
  },
  async ({ club_id }) => {
    try {
      const apiKey = getVaultCredential('openweather_api_key');
      const { lat, lon } = await getClubCoords(club_id);

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`OpenWeather error: ${resp.status}`);

      const data = await resp.json() as {
        weather: Array<{ description: string; main: string }>;
        main: { temp: number; humidity: number };
        wind: { speed: number };
        visibility: number;
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            condition: data.weather[0]?.description ?? 'unknown',
            temp_f: Math.round(data.main.temp),
            humidity_pct: data.main.humidity,
            wind_mph: Math.round(data.wind.speed),
            visibility_miles: Math.round((data.visibility ?? 0) / 1609),
            playable: data.weather[0]?.main !== 'Thunderstorm',
          }),
        }],
      };
    } catch {
      const result = await sql`
        SELECT condition, temp_high AS temp_f, precipitation_pct
        FROM weather_cache
        WHERE club_id = ${club_id} AND date = CURRENT_DATE
        LIMIT 1
      `;
      return { content: [{ type: 'text', text: JSON.stringify(result.rows[0] ?? { condition: 'unavailable' }) }] };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
