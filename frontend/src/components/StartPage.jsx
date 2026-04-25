import { useState } from 'react'

function StartPage({
  disasterModes,
  location,
  status,
  isSearching,
  onLocationChange,
  onDisasterSelect,
}) {
  const [locationInput, setLocationInput] = useState('San Francisco')
  const [locationStatus, setLocationStatus] = useState(status)
  const hasLocation = Boolean(location)

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
        <p className="eyebrow">SAFEPATH</p>
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
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="City or address"
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
        {!hasLocation && <p className="hint">Set a location to enable disaster search.</p>}
      </section>
    </main>
  )
}

export default StartPage
