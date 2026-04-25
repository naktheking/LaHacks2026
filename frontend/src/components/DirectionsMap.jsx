const MAPS_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY ?? import.meta.env.VITE_GOOGLE_MAPS_KEY

function DirectionsMap({ location, selectedShelter }) {
  const hasRoute = Boolean(location?.coords && selectedShelter?.coords)
  const origin = hasRoute ? `${location.coords.lat},${location.coords.lng}` : ''
  const destination = hasRoute
    ? `${selectedShelter.coords.lat},${selectedShelter.coords.lng}`
    : ''

  const embedUrl =
    MAPS_KEY && hasRoute
      ? `https://www.google.com/maps/embed/v1/directions?${new URLSearchParams({
          key: MAPS_KEY,
          origin,
          destination,
          mode: 'driving',
        })}`
      : ''

  const externalUrl = hasRoute
    ? `https://www.google.com/maps/dir/?${new URLSearchParams({
        api: '1',
        origin,
        destination,
        travelmode: 'driving',
      })}`
    : ''

  return (
    <section className="panel map-panel">
      <div className="section-heading">
        <h2>Directions</h2>
        {externalUrl && (
          <a href={externalUrl} target="_blank" rel="noreferrer">
            Open in Google Maps
          </a>
        )}
      </div>
      <p className="muted">
        {selectedShelter ? `Route to ${selectedShelter.name}` : 'Select a relief center.'}
      </p>

      <div className="map-widget">
        {embedUrl ? (
          <iframe
            title="Google Maps directions"
            src={embedUrl}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="map-empty">
            <strong>Google map unavailable</strong>
            <span>
              {!MAPS_KEY
                ? 'Set VITE_GOOGLE_MAPS_EMBED_KEY in frontend/.env and enable Maps Embed API.'
                : 'Search a location and select a result with coordinates.'}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

export default DirectionsMap
