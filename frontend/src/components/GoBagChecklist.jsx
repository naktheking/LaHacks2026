import { useMemo, useState } from 'react'

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

function GoBagChecklist({ disaster }) {
  const [checked, setChecked] = useState({})
  const items = useMemo(() => [...goBagItems.common, ...goBagItems[disaster]], [disaster])
  const checkedCount = items.filter((item) => checked[item]).length
  const progress = Math.round((checkedCount / items.length) * 100)

  return (
    <section className="panel checklist-panel">
      <h2>Go-bag checklist</h2>
      <p className="muted">
        {checkedCount}/{items.length} packed ({progress}%)
      </p>
      <div className="progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <ul className="checklist">
        {items.map((item) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                checked={Boolean(checked[item])}
                onChange={() => setChecked((prev) => ({ ...prev, [item]: !prev[item] }))}
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default GoBagChecklist
