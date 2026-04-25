import { useMemo, useState } from 'react'
import './App.css'


const disasterModes = {
 wildfire: {
   label: 'Wildfire',
   headline: 'Smoke + fire perimeter conditions',
 },
 earthquake: {
   label: 'Earthquake',
   headline: 'Aftershock and structural risk conditions',
 },
 tsunami: {
   label: 'Tsunami',
   headline: 'Coastal flooding + elevation conditions',
 },
}


const shelterData = [
 {
   id: 'pasadena-civic',
   name: 'Pasadena Civic Relief Center',
   city: 'Pasadena',
   distanceMi: 8.7,
   coords: { lat: 34.1478, lng: -118.1445 },
   avgCrowd: 410,
   capacity: 700,
   safety: { wildfire: 93, earthquake: 86, tsunami: 79 },
   amenities: ['Pet-friendly', 'Medical support', 'Charging'],
 },
 {
   id: 'glendale-hub',
   name: 'Glendale Transit Shelter Hub',
   city: 'Glendale',
   distanceMi: 12.9,
   coords: { lat: 34.1425, lng: -118.2551 },
   avgCrowd: 290,
   capacity: 540,
   safety: { wildfire: 84, earthquake: 90, tsunami: 74 },
   amenities: ['Transit access', 'Food kits', 'Family zone'],
 },
 {
   id: 'cal-state-la',
   name: 'Cal State LA Emergency Arena',
   city: 'Los Angeles',
   distanceMi: 15.2,
   coords: { lat: 34.0669, lng: -118.1686 },
   avgCrowd: 580,
   capacity: 1100,
   safety: { wildfire: 89, earthquake: 88, tsunami: 81 },
   amenities: ['Large capacity', 'Wi-Fi', 'Mental health support'],
 },
 {
   id: 'pomona-fairplex',
   name: 'Pomona Fairplex Safe Grounds',
   city: 'Pomona',
   distanceMi: 23.8,
   coords: { lat: 34.086, lng: -117.7653 },
   avgCrowd: 360,
   capacity: 920,
   safety: { wildfire: 91, earthquake: 84, tsunami: 88 },
   amenities: ['Vehicle lots', 'Cooling center', 'Supply station'],
 },
]


const goBagItems = {
 common: [
   'Water (1 gallon per person)',
   '3-day non-perishable food',
   'Phone charger + power bank',
   'Medication and first aid kit',
   'IDs and insurance copies',
 ],
 wildfire: ['N95 masks', 'Protective goggles', 'Long-sleeve clothing'],
 earthquake: ['Whistle', 'Work gloves', 'Battery radio'],
 tsunami: ['Waterproof pouch', 'Dry clothes', 'Printed inland route'],
}


const transportSpeed = { car: 30, transit: 21, bike: 11, walk: 3.2 }


function getSafetyLabel(score) {
 if (score >= 90) return 'Very Safe'
 if (score >= 80) return 'Stable'
 if (score >= 70) return 'Caution'
 return 'High Risk'
}

function toRadians(value) {
 return (value * Math.PI) / 180
}

function haversineDistanceMi(start, end) {
 const earthRadiusMi = 3958.8
 const dLat = toRadians(end.lat - start.lat)
 const dLng = toRadians(end.lng - start.lng)
 const a =
   Math.sin(dLat / 2) ** 2 +
   Math.cos(toRadians(start.lat)) *
     Math.cos(toRadians(end.lat)) *
     Math.sin(dLng / 2) ** 2
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
 return earthRadiusMi * c
}


function App() {
 const [disaster, setDisaster] = useState('wildfire')
 const [locationLabel, setLocationLabel] = useState('Westwood, Los Angeles (default)')
 const [userCoords, setUserCoords] = useState(null)
 const [addressQuery, setAddressQuery] = useState('')
 const [locationStatus, setLocationStatus] = useState(
   'Using default location. Enable location permission for live distance ranking.',
 )
 const [isLocating, setIsLocating] = useState(false)
 const [isSearchingAddress, setIsSearchingAddress] = useState(false)
 const [transport, setTransport] = useState('car')
 const [groupSize, setGroupSize] = useState(2)
 const [checked, setChecked] = useState({})

 const requestCurrentLocation = () => {
   if (!navigator.geolocation) {
     setLocationStatus('Geolocation is not supported in this browser.')
     return
   }

   setIsLocating(true)
   setLocationStatus('Requesting location permission...')

   navigator.geolocation.getCurrentPosition(
     ({ coords }) => {
       const nextCoords = { lat: coords.latitude, lng: coords.longitude }
       setUserCoords(nextCoords)
       setLocationLabel(
         `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
       )
       setLocationStatus('Live location enabled. Rankings now use your current location.')
       setIsLocating(false)
     },
     (error) => {
       let message = 'Unable to access your location.'
       if (error.code === error.PERMISSION_DENIED) {
         message = 'Location permission denied. Rankings are using the default location.'
       } else if (error.code === error.TIMEOUT) {
         message = 'Location request timed out. Try again.'
       }
       setLocationStatus(message)
       setIsLocating(false)
     },
     { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 },
   )
 }

 const useSearchedAddress = async () => {
   if (!addressQuery.trim()) {
     setLocationStatus('Enter an address to search.')
     return
   }

   setIsSearchingAddress(true)
   setLocationStatus('Searching for that address...')

   try {
     const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(addressQuery.trim())}`
     const response = await fetch(endpoint)
     if (!response.ok) {
       throw new Error('Address lookup failed.')
     }

     const results = await response.json()
     if (!results.length) {
       setLocationStatus('No matching address found. Try a more specific search.')
       setIsSearchingAddress(false)
       return
     }

     const bestMatch = results[0]
     const nextCoords = {
       lat: Number(bestMatch.lat),
       lng: Number(bestMatch.lon),
     }
     setUserCoords(nextCoords)
     setLocationLabel(bestMatch.display_name)
     setLocationStatus('Address location selected. Rankings now use this searched address.')
   } catch (error) {
     setLocationStatus('Could not search that address right now. Please try again.')
   } finally {
     setIsSearchingAddress(false)
   }
 }


 const rankedShelters = useMemo(() => {
   return shelterData
     .map((shelter) => {
       const safetyScore = shelter.safety[disaster]
       const distanceMi = userCoords
         ? haversineDistanceMi(userCoords, shelter.coords)
         : shelter.distanceMi
       const distanceScore = Math.max(0, 100 - distanceMi * 2.7)
       const availability = Math.max(0, shelter.capacity - shelter.avgCrowd)
       const availabilityScore = (availability / shelter.capacity) * 100
       const total =
         safetyScore * 0.58 + distanceScore * 0.27 + availabilityScore * 0.15
       const eta = Math.max(1, Math.round((distanceMi / transportSpeed[transport]) * 60 * 1.08))
       return {
         ...shelter,
         distanceMi: Number(distanceMi.toFixed(1)),
         score: Math.round(Math.min(100, Math.max(0, total))),
         eta,
         availability,
       }
     })
     .sort((a, b) => b.score - a.score)
 }, [disaster, transport, userCoords])


 const topShelter = rankedShelters[0]
 const checklistItems = useMemo(
   () => [...goBagItems.common, ...goBagItems[disaster]],
   [disaster],
 )
 const checkedCount = checklistItems.filter((item) => checked[item]).length
 const progress = Math.round((checkedCount / checklistItems.length) * 100)


 const toggleCheck = (item) => {
   setChecked((prev) => ({ ...prev, [item]: !prev[item] }))
 }


 return (
   <main className="app-shell" data-disaster={disaster}>
     <header className="hero">
       <p className="eyebrow">SOCAL EVACUATION PROTOTYPE</p>
       <h1>Find your fastest route to a safer shelter.</h1>
       <p className="hero-copy">
         Frontend-only demo with mock shelter ranking logic. Later, replace
         mock data with live hazard, shelter, and routing APIs.
       </p>
       <div className="hero-stats">
         <div>
           <span>Best shelter</span>
           <strong>{topShelter?.name}</strong>
         </div>
         <div>
           <span>ETA</span>
           <strong>{topShelter?.eta} min</strong>
         </div>
         <div>
           <span>Mode</span>
           <strong>{disasterModes[disaster].label}</strong>
         </div>
       </div>
     </header>


     <section className="grid two-up">
       <article className="panel">
         <h2>Evacuation inputs</h2>
         <p className="muted">{disasterModes[disaster].headline}</p>


         <div className="tabs" role="tablist" aria-label="disaster type">
           {Object.entries(disasterModes).map(([key, value]) => (
             <button
               key={key}
               type="button"
               className={key === disaster ? 'tab active' : 'tab'}
               onClick={() => setDisaster(key)}
             >
               {value.label}
             </button>
           ))}
         </div>


         <div className="location-card">
           <p className="field-label">Location for ranking</p>
           <p className="location-value">{locationLabel}</p>
           <p className="muted small">{locationStatus}</p>
           <label className="field">
             Search address
             <input
               value={addressQuery}
               onChange={(e) => setAddressQuery(e.target.value)}
               placeholder="e.g. 405 Hilgard Ave, Los Angeles"
             />
           </label>
           <div className="location-actions">
             <button
               type="button"
               className="location-btn"
               onClick={useSearchedAddress}
               disabled={isSearchingAddress}
             >
               {isSearchingAddress ? 'Searching...' : 'Use searched address'}
             </button>
             <button
               type="button"
               className="location-btn"
               onClick={requestCurrentLocation}
               disabled={isLocating}
             >
               {isLocating ? 'Getting location...' : 'Use my current location'}
             </button>
           </div>
         </div>


         <div className="field-row">
           <label className="field">
             Transport
             <select
               value={transport}
               onChange={(e) => setTransport(e.target.value)}
             >
               <option value="car">Car</option>
               <option value="transit">Public Transit</option>
               <option value="bike">Bike</option>
               <option value="walk">Walking</option>
             </select>
           </label>
           <label className="field">
             Group size
             <input
               type="number"
               min="1"
               max="12"
               value={groupSize}
               onChange={(e) => setGroupSize(Number(e.target.value) || 1)}
             />
           </label>
         </div>


         <div className="formula">
           Ranked by disaster safety, distance from <strong>{locationLabel}</strong>,
           and shelter crowd load.
         </div>
       </article>


       <article className="panel">
         <h2>Map preview</h2>
         <p className="muted">Use this area for Google Maps + hazard overlays later.</p>
         <div className="map">
           <div className="grid-overlay" />
           <div className="pin origin">You</div>
           <div className="route primary" />
           <div className="route alternate" />
           <div className="pin shelter one">1</div>
           <div className="pin shelter two">2</div>
           <div className="pin hazard">Hazard</div>
         </div>
         <div className="mini-stats">
           <div>
             <span>Top route</span>
             <strong>{topShelter?.eta} min</strong>
           </div>
           <div>
             <span>Capacity left</span>
             <strong>{topShelter?.availability}</strong>
           </div>
           <div>
             <span>Suggested</span>
             <strong>Leave in 20-30 min</strong>
           </div>
         </div>
       </article>
     </section>


     <section className="grid two-up">
       <article className="panel">
         <h2>Shelters near you</h2>
         <p className="muted">Prototype ranking for Southern California shelters.</p>
         <div className="list">
           {rankedShelters.map((shelter, idx) => (
             <article key={shelter.id} className="shelter-card">
               <div className="rank">#{idx + 1}</div>
               <div>
                 <h3>{shelter.name}</h3>
                 <p className="muted small">
                   {shelter.city} • {shelter.distanceMi} mi
                 </p>
                 <div className="chips">
                   {shelter.amenities.map((amenity) => (
                     <span key={amenity}>{amenity}</span>
                   ))}
                 </div>
               </div>
               <div className="score">
                 <strong>{shelter.score}</strong>
                 <span>{getSafetyLabel(shelter.safety[disaster])}</span>
                 <small>{shelter.eta} min ETA</small>
               </div>
             </article>
           ))}
         </div>
       </article>


       <article className="panel">
         <h2>Go-bag checklist</h2>
         <p className="muted">
           {checkedCount}/{checklistItems.length} packed ({progress}%)
         </p>
         <div className="progress">
           <span style={{ width: `${progress}%` }} />
         </div>
         <ul className="checklist">
           {checklistItems.map((item) => (
             <li key={item}>
               <label>
                 <input
                   type="checkbox"
                   checked={Boolean(checked[item])}
                   onChange={() => toggleCheck(item)}
                 />
                 <span>{item}</span>
               </label>
             </li>
           ))}
         </ul>
         <div className="formula">
           Hook backend later: <code>/api/incidents</code>,{' '}
           <code>/api/shelters</code>, <code>/api/routes</code>.
         </div>
       </article>
     </section>


     <footer className="footer">Static frontend prototype. No backend integration yet.</footer>
   </main>
 )
}


export default App
