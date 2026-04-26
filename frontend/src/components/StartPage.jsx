import { useState, useEffect, useRef } from 'react'

const MAPS_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_KEY ?? import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY
const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-places-script'

function loadGooglePlaces() {
  if (!MAPS_KEY) {
    return Promise.reject(new Error('Missing Google Maps API key.'))
  }

  if (window.google?.maps?.places) {
    return Promise.resolve(window.google)
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID)

    window.initSafePathPlaces = () => {
      if (window.google?.maps?.places) {
        resolve(window.google)
        return
      }

      reject(new Error('Google Places did not load.'))
    }

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Google Places failed to load.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({
      key: MAPS_KEY,
      libraries: 'places',
      callback: 'initSafePathPlaces',
    })}`
    script.async = true
    script.defer = true
    script.onerror = () => reject(new Error('Google Places failed to load.'))
    document.head.appendChild(script)
  })
}

function StartPage({
  disasterModes,
  location,
  status,
  isSearching,
  onLocationChange,
  onDisasterSelect,
}) {
  const [locationInput, setLocationInput] = useState('')
  const [locationStatus, setLocationStatus] = useState(status)
  const inputRef = useRef(null)
  const hasLocation = Boolean(location)
  const inputRef = useRef(null)
  const autocompleteRef = useRef(null)

  useEffect(() => {
    if (window.google?.maps?.places) {
      initAutocomplete()
      return
    }

    if (document.querySelector('#gmaps-script')) return

    const script = document.createElement('script')
    script.id = 'gmaps-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = initAutocomplete
    document.head.appendChild(script)

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [])

  function initAutocomplete() {
    if (!inputRef.current || autocompleteRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (!place.geometry) return

      const label = place.formatted_address || place.name
      setLocationInput(label)
      onLocationChange({
        label,
        coords: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
        source: 'autocomplete',
      })
      setLocationStatus(`Location set to ${label}.`)
    })
  }

  useEffect(() => {
    let listener = null
    let isMounted = true

    loadGooglePlaces()
      .then((google) => {
        if (!isMounted || !inputRef.current) {
          return
        }

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
          types: ['geocode'],
        })

        listener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const label = place.formatted_address || place.name || inputRef.current.value.trim()
          const geometry = place.geometry?.location

          if (!label) {
            return
          }

          setLocationInput(label)
          onLocationChange({
            label,
            coords: geometry ? { lat: geometry.lat(), lng: geometry.lng() } : null,
            source: 'google_places_autocomplete',
          })
          setLocationStatus(`Location set to ${label}.`)
        })
      })
      .catch(() => {
        // Keep the manual text entry path available if Places cannot load.
      })

    return () => {
      isMounted = false
      listener?.remove()
    }
  }, [onLocationChange])

  function useTypedLocation(event) {
    event.preventDefault()
    const label = locationInput.trim()

    if (!label) {
      setLocationStatus('Enter a city or address.')
      return
    }

    onLocationChange({ label, coords: null, source: 'typed' })
    setLocationStatus(`Location set to ${label}.`)
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Browser location is unavailable.')
      return
    }

    setLocationStatus('Requesting location permission...')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = {
          label: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
          coords: { lat: coords.latitude, lng: coords.longitude },
          source: 'browser',
        }
        onLocationChange(nextLocation)
        setLocationStatus('Current location set.')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('Location permission denied. Enter a city or address.')
          return
        }

        setLocationStatus('Could not read current location.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
    )
  }

  return (
    <main className="start-page">
      <section className="start-panel">
        <p className="eyebrow">SafeRoute</p>
        <h1>Find relief centers fast.</h1>

        <div className="disaster-actions" aria-label="Choose disaster type">
          {Object.entries(disasterModes).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="primary-choice"
              disabled={!hasLocation || isSearching}
              onClick={() => onDisasterSelect(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <form className="location-form" onSubmit={useTypedLocation}>
          <label>
            Location
            <input
              ref={inputRef}
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="City or address"
              autoComplete="off"
            />
          </label>
          <div className="location-actions">
            <button type="submit" className="secondary-action">
              Set location
            </button>
            <button type="button" className="secondary-action" onClick={useCurrentLocation}>
              Use my location
            </button>
          </div>
        </form>

        <p className="status-line">
          {location ? `Ready: ${location.label}` : locationStatus || status}
        </p>
      </section>
    </main>
  )
}

export default StartPage
