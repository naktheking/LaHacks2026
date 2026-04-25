function getSourceLabel(source) {
  const labels = {
    federal_static: 'Federal/static',
    state_official_static: 'State official',
    openstreetmap: 'OpenStreetMap',
    google_places: 'Google Places',
    web_scrape: 'Web result',
  }
  return labels[source] ?? source
}

function formatDistance(km) {
  if (km === undefined || km === null) return 'Distance unavailable'
  return `${km} km away`
}

function ReliefCentersList({ shelters, selectedPlaceId, onSelect }) {
  return (
    <section className="panel list-panel">
      <h2>Relief centers</h2>
      <p className="muted">Showing the top {shelters.length} ranked results.</p>

      <div className="relief-list">
        {shelters.map((shelter, index) => (
          <article
            key={shelter.place_id}
            className={shelter.place_id === selectedPlaceId ? 'relief-card selected' : 'relief-card'}
          >
            <div className="rank">#{index + 1}</div>
            <div>
              <h3>{shelter.name}</h3>
              <p>{shelter.address}</p>
              <div className="chips">
                <span>{formatDistance(shelter.dist_km)}</span>
                <span>{getSourceLabel(shelter.source)}</span>
                <span>Safety {shelter.safety_rating ?? 'N/A'}</span>
                {shelter.is_federal && <span>Official</span>}
              </div>
              <div className="card-actions">
                {shelter.coords && (
                  <button type="button" onClick={() => onSelect(shelter.place_id)}>
                    Show route
                  </button>
                )}
                {shelter.source_url && (
                  <a href={shelter.source_url} target="_blank" rel="noreferrer">
                    Source
                  </a>
                )}
              </div>
            </div>
            <strong className="score">{shelter.score ?? '-'}</strong>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ReliefCentersList
