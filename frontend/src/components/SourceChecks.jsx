function statusText(source) {
  if (source.ok) return `${source.count} found`
  return source.error ?? 'failed'
}

function SourceChecks({ sources }) {
  return (
    <section className="panel source-panel">
      <h2>Source checks</h2>
      <div className="source-list">
        {sources.map((source) => (
          <div key={source.name} className={source.ok ? 'source ok' : 'source failed'}>
            <span>{source.name}</span>
            <strong>{source.ok ? 'OK' : 'Check'}</strong>
            <small>{statusText(source)}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SourceChecks
