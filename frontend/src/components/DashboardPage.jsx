import { useMemo, useState } from 'react'
import DirectionsMap from './DirectionsMap'
import GoBagChecklist from './GoBagChecklist'
import ReliefCentersList from './ReliefCentersList'
import SourceChecks from './SourceChecks'

function DashboardPage({
  disaster,
  disasterModes,
  location,
  results,
  onBack,
  onSearch,
  isSearching,
}) {
  const shelters = useMemo(() => (results.shelters ?? []).slice(0, 10), [results.shelters])
  const [selectedPlaceId, setSelectedPlaceId] = useState(shelters[0]?.place_id ?? null)
  const selectedShelter =
    shelters.find((shelter) => shelter.place_id === selectedPlaceId) ?? shelters[0] ?? null

  return (
    <main className="dashboard-page" data-disaster={disaster}>
      <header className="dashboard-header">
        <button type="button" className="back-button" onClick={onBack}>
          Back
        </button>
        <div>
          <p className="eyebrow">{disasterModes[disaster]} mode</p>
          <h1>Top 10 relief centers</h1>
          <p className="muted">{location?.label}</p>
        </div>
        <div className="header-actions">
          {Object.entries(disasterModes).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={key === disaster ? 'mode-button active' : 'mode-button'}
              disabled={isSearching}
              onClick={() => onSearch(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="dashboard-grid">
        <ReliefCentersList
          shelters={shelters}
          selectedPlaceId={selectedShelter?.place_id}
          onSelect={setSelectedPlaceId}
        />
        <DirectionsMap location={location} selectedShelter={selectedShelter} />
        <GoBagChecklist disaster={disaster} />
        <SourceChecks sources={results.sourceStatus ?? []} />
      </section>
    </main>
  )
}

export default DashboardPage
