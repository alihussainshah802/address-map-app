# Address Map App

Search for an address and see it on a map.

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Add your Google Maps API key to `.env.local`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_key
   ```
   The key needs the **Maps JavaScript API** and **Places API** enabled in Google Cloud Console.
3. Start the dev server:
   ```
   npm run dev
   ```

## Notes

- Client-side only, no backend.
- For local dev an unrestricted key works, but restrict it by HTTP referrer in Google Cloud Console before deploying anywhere public.
