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


function App() {
 const [disaster, setDisaster] = useState('wildfire')
 const [location, setLocation] = useState('Westwood, Los Angeles')
 const [transport, setTransport] = useState('car')
 const [severity, setSeverity] = useState(70)
 const [groupSize, setGroupSize] = useState(2)
 const [checked, setChecked] = useState({})


 const rankedShelters = useMemo(() => {
   return shelterData
     .map((shelter) => {
       const safetyScore = shelter.safety[disaster]
       const distanceScore = Math.max(0, 100 - shelter.distanceMi * 2.7)
       const availability = Math.max(0, shelter.capacity - shelter.avgCrowd)
       const availabilityScore = (availability / shelter.capacity) * 100
       const crowdPenalty =
         (severity / 100) * (1 - availability / shelter.capacity) * 14
       const total =
         safetyScore * 0.55 +
         distanceScore * 0.25 +
         availabilityScore * 0.2 -
         crowdPenalty
       const eta = Math.round(
         (shelter.distanceMi / transportSpeed[transport]) *
           60 *
           (1 + severity / 260),
       )
       return {
         ...shelter,
         score: Math.round(Math.min(100, Math.max(0, total))),
         eta,
         availability,
       }
     })
     .sort((a, b) => b.score - a.score)
 }, [disaster, severity, transport])


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
   <main className="app-shell">
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


         <label className="field">
           Current location
           <input
             value={location}
             onChange={(e) => setLocation(e.target.value)}
             placeholder="e.g. Santa Monica"
           />
         </label>


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


         <label className="field">
           Incident severity: {severity}/100
           <input
             type="range"
             min="10"
             max="100"
             value={severity}
             onChange={(e) => setSeverity(Number(e.target.value))}
           />
         </label>


         <div className="formula">
           Ranked by disaster safety, distance from <strong>{location}</strong>,
           and crowd load.
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
