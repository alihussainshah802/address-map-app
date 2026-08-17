import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet/dist/leaflet.css'

// Leaflet's default marker resolves its icons with relative URLs, which breaks
// under Vite's asset hashing and silently renders no pin. Importing the images
// so the bundler rewrites them is the fix.
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import './App.css'

const DEFAULT_CENTER = [37.7749, -122.4194]
const DEFAULT_ZOOM = 12
const SELECTED_ZOOM = 16

// Nominatim's usage policy caps automated traffic at roughly one request per
// second, so typing is debounced rather than queried per keystroke.
const SEARCH_DEBOUNCE_MS = 600
const MIN_QUERY_LENGTH = 3

const markerIconDefault = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// react-leaflet exposes the map only through context, so panning has to happen
// from inside MapContainer rather than from App.
function MapFocus({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) map.flyTo(position, SELECTED_ZOOM)
  }, [map, position])

  return null
}

function App() {
  const provider = useMemo(() => new OpenStreetMapProvider(), [])

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  // Guards against a slow earlier request resolving after a newer one and
  // overwriting fresher results.
  const requestIdRef = useRef(0)

  // Picking a result writes its label into the input. Without this the effect
  // below would treat that as a new search and immediately reopen the dropdown
  // the selection just closed.
  const skipSearchRef = useRef(false)

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false
      return
    }

    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    const requestId = ++requestIdRef.current
    setIsSearching(true)

    const timer = setTimeout(async () => {
      try {
        const found = await provider.search({ query: trimmed })
        if (requestId !== requestIdRef.current) return

        setResults(found.slice(0, 5))
        setSearchError(found.length ? null : 'No matches for that address. Try a different search.')
      } catch {
        if (requestId !== requestIdRef.current) return
        setResults([])
        setSearchError('Address lookup failed. Check your connection and try again.')
      } finally {
        if (requestId === requestIdRef.current) setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [provider, query])

  const handleSelect = useCallback((result) => {
    skipSearchRef.current = true
    setSelectedPlace({
      position: [result.y, result.x],
      address: result.label,
    })
    setQuery(result.label)
    setResults([])
    setSearchError(null)
  }, [])

  return (
    <div className="app">
      <MapContainer
        className="map"
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        {selectedPlace && (
          <Marker position={selectedPlace.position} icon={markerIconDefault} />
        )}
        <MapFocus position={selectedPlace?.position} />
      </MapContainer>

      <div className="search-box">
        <input
          type="text"
          className="search-box__input"
          placeholder="Search for an address"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search for an address"
        />
        {results.length > 0 && (
          <ul className="search-results">
            {results.map((result) => (
              <li key={`${result.x},${result.y}`}>
                <button
                  type="button"
                  className="search-results__item"
                  onClick={() => handleSelect(result)}
                >
                  {result.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isSearching && <div className="search-status">Searching…</div>}
      {searchError && <div className="search-error">{searchError}</div>}

      {selectedPlace && (
        <div className="address-card">
          <div className="address-card__text">{selectedPlace.address}</div>
        </div>
      )}
    </div>
  )
}

export default App
