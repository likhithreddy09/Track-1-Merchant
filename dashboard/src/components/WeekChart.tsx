/** Soft bar chart for 7-day demand — Pathao-style calm graphics */
export function WeekChart({
  week,
}: {
  week: { day: string; index: number; label: string }[]
}) {
  const max = Math.max(...week.map((d) => d.index), 1)
  const peak = week.reduce((a, d) => (d.index > a.index ? d : a))

  return (
    <div className="wk-chart">
      <div className="wk-chart-hd">
        <div>
          <strong>7-day demand</strong>
          <span>Shelf plan index</span>
        </div>
        <em>Peak {peak.day}</em>
      </div>
      <div className="wk-bars" role="img" aria-label="Weekly demand bars">
        {week.map((d) => {
          const h = Math.round((d.index / max) * 100)
          const isPeak = d.day === peak.day
          return (
            <div key={d.day} className={`wk-col ${isPeak ? 'peak' : ''}`}>
              <b>{d.index}</b>
              <div className="wk-bar-track">
                <i style={{ height: `${Math.max(8, h)}%` }} />
              </div>
              <span>{d.day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
