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
  const [customItems, setCustomItems] = useState([])
  const [removedItems, setRemovedItems] = useState([])
  const [customInput, setCustomInput] = useState('')
  const items = useMemo(
    () =>
      [...goBagItems.common, ...goBagItems[disaster], ...customItems].filter(
        (item) => !removedItems.includes(item),
      ),
    [customItems, disaster, removedItems],
  )
  const checkedCount = items.filter((item) => checked[item]).length
  const progress = Math.round((checkedCount / items.length) * 100)

  function addCustomItem(event) {
    event.preventDefault()
    const nextItem = customInput.trim()

    if (!nextItem || items.includes(nextItem)) {
      setCustomInput('')
      return
    }

    setCustomItems((prev) => [...prev, nextItem])
    setCustomInput('')
  }

  function removeItem(item) {
    setCustomItems((prev) => prev.filter((customItem) => customItem !== item))
    setRemovedItems((prev) => (prev.includes(item) ? prev : [...prev, item]))
    setChecked((prev) => {
      const next = { ...prev }
      delete next[item]
      return next
    })
  }

  return (
    <section className="panel checklist-panel">
      <h2>Go-bag checklist</h2>
      <p className="muted">
        {checkedCount}/{items.length} packed ({progress}%)
      </p>
      <div className="progress">
        <span style={{ width: `${progress}%` }} />
      </div>
      <form className="custom-checklist-form" onSubmit={addCustomItem}>
        <label>
          Add your own item
          <input
            value={customInput}
            onChange={(event) => setCustomInput(event.target.value)}
            placeholder="Pet food, spare glasses, cash..."
          />
        </label>
        <button type="submit">Add</button>
      </form>
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
            <button type="button" onClick={() => removeItem(item)} aria-label={`Remove ${item}`}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default GoBagChecklist
