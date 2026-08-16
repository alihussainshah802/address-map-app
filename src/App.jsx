import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import './App.css'

const LIBRARIES = ['places']
const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 }
const DEFAULT_ZOOM = 12
const SELECTED_ZOOM = 16

function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [map, setMap] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const autocompleteRef = useRef(null)

  const onMapLoad = useCallback((mapInstance) => setMap(mapInstance), [])

  useEffect(() => {
    const el = autocompleteRef.current
    if (!isLoaded || !el) return

    const handleSelect = async (event) => {
      const place = event.placePrediction.toPlace()
      await place.fetchFields({ fields: ['location', 'formattedAddress'] })

      if (!place.location) {
        setSearchError('No details found for that address. Try a different search.')
        return
      }

      setSearchError(null)
      const location = { lat: place.location.lat(), lng: place.location.lng() }
      setSelectedPlace({
        location,
        address: place.formattedAddress ?? 'Selected location',
      })

      setMap((currentMap) => {
        if (currentMap) {
          currentMap.panTo(location)
          currentMap.setZoom(SELECTED_ZOOM)
        }
        return currentMap
      })
    }

    el.addEventListener('gmp-select', handleSelect)
    return () => el.removeEventListener('gmp-select', handleSelect)
  }, [isLoaded])

  if (loadError) {
    return (
      <div className="status-message status-message--error">
        Failed to load Google Maps. Check your API key and enabled APIs (Maps JavaScript API, Places API).
      </div>
    )
  }

  if (!isLoaded) {
    return <div className="status-message">Loading map…</div>
  }

  return (
    <div className="app">
      <GoogleMap
        mapContainerClassName="map"
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {selectedPlace && <Marker position={selectedPlace.location} />}
      </GoogleMap>

      <div className="search-box">
        <gmp-place-autocomplete
          ref={autocompleteRef}
          placeholder="Search for an address"
          class="search-box__autocomplete"
        />
      </div>

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
