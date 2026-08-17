# Address Map App

Search for an address and see it on a map.

## Setup

1. Install dependencies:
   ```
   pnpm install
   ```
2. Start the dev server:
   ```
   pnpm dev
   ```

No API key or account is needed. Map tiles come from OpenStreetMap and address
search from Nominatim, both free and keyless.

## Notes

- Client-side only, no backend.
- Nominatim's usage policy caps automated traffic at roughly one request per
  second. Typing is debounced to stay within it. If you deploy this publicly
  and expect real traffic, run your own Nominatim or Photon instance, or use a
  hosted geocoder, rather than pointing volume at the public endpoint.
- OpenStreetMap's tile servers have their own usage policy and are not intended
  to serve production traffic. For anything public, use a tile host.
- Attribution for both tiles and geocoding is required and is rendered on the
  map; don't remove it.
