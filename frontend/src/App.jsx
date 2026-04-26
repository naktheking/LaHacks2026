import { useState } from 'react'
import DashboardPage from './components/DashboardPage'
import StartPage from './components/StartPage'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'

const disasterModes = {
  wildfire: 'Wildfire',
  earthquake: 'Earthquake',
  tsunami: 'Tsunami',
}

function App() {
  const [location, setLocation] = useState(null)
  const [disaster, setDisaster] = useState('wildfire')
  const [results, setResults] = useState(null)
  const [status, setStatus] = useState('Enter a location or use your current location.')
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState('start')

  async function searchReliefCenters(nextDisaster) {
    if (!location) {
      setStatus('Set a location before choosing a disaster.')
      return
    }

    setDisaster(nextDisaster)
    setIsSearching(true)
    setStatus(`Searching ${disasterModes[nextDisaster]} relief centers...`)

    try {
      const query = new URLSearchParams({
        disaster: nextDisaster,
        radiusKm: '50',
        ...(location.coords
          ? { lat: String(location.coords.lat), lng: String(location.coords.lng) }
          : { location: location.label }),
      })
      const response = await fetch(`${API_BASE}/api/shelters?${query}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Relief center search failed.')
      }

      setResults(data)
      setLocation({
        label: data.query.location,
        coords: { lat: data.query.lat, lng: data.query.lng },
        source: data.query.locationSource,
      })
      setStatus(`Found ${data.shelters.length} top relief center${data.shelters.length === 1 ? '' : 's'}.`)
      setPage('dashboard')
    } catch (error) {
      setResults(null)
      setStatus(error.message)
    } finally {
      setIsSearching(false)
    }
  }

  if (page === 'dashboard' && results) {
    return (
      <DashboardPage
        disaster={disaster}
        disasterModes={disasterModes}
        location={location}
        results={results}
        onBack={() => setPage('start')}
        onSearch={searchReliefCenters}
        isSearching={isSearching}
      />
    )
  }

  return (
    <StartPage
      disasterModes={disasterModes}
      location={location}
      status={status}
      isSearching={isSearching}
      onLocationChange={setLocation}
      onDisasterSelect={searchReliefCenters}
    />
  )
}

export default App
