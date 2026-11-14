import type { DemographicSnapshot } from '../types'

const COLORS = {
  working: '#00BAF2',
  kids: '#FFB300',
  seniors: '#002970',
  cols: ['#7DD3FC', '#38BDF8', '#00BAF2', '#0EA5E9', '#0284C7', '#0369A1', '#002970'],
}

function Donut({
  working,
  kids,
  seniors,
  total,
}: {
  working: number
  kids: number
  seniors: number
  total: number
}) {
  const r = 54
  const c = 2 * Math.PI * r
  const parts = [
    { key: 'working', pct: working, color: COLORS.working },
    { key: 'kids', pct: kids, color: COLORS.kids },
    { key: 'seniors', pct: seniors, color: COLORS.seniors },
  ]
  let offset = 0

  return (
    <div className="age-donut-wrap">
      <svg viewBox="0 0 140 140" className="age-donut" aria-hidden="true">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#eef3f7" strokeWidth="18" />
        {parts.map((p) => {
          const len = (p.pct / 100) * c
          const dash = `${len} ${c - len}`
          const el = (
            <circle
              key={p.key}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth="18"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform="rotate(-90 70 70)"
            />
          )
          offset += len
          return el
        })}
        <text x="70" y="66" textAnchor="middle" className="age-donut-total">
          {total.toLocaleString()}
        </text>
        <text x="70" y="82" textAnchor="middle" className="age-donut-sub">
          people
        </text>
      </svg>
      <ul className="age-donut-legend">
        <li>
          <i style={{ background: COLORS.working }} />
          <div>
            <strong>Working age</strong>
            <span>
              {working}% · {Math.round((working / 100) * total).toLocaleString()} people
            </span>
          </div>
        </li>
        <li>
          <i style={{ background: COLORS.kids }} />
          <div>
            <strong>Kids</strong>
            <span>
              {kids}% · {Math.round((kids / 100) * total).toLocaleString()} people
            </span>
          </div>
        </li>
        <li>
          <i style={{ background: COLORS.seniors }} />
          <div>
            <strong>Seniors</strong>
            <span>
              {seniors}% · {Math.round((seniors / 100) * total).toLocaleString()} people
            </span>
          </div>
        </li>
      </ul>
    </div>
  )
}

function StackStrip({
  working,
  kids,
  seniors,
}: {
  working: number
  kids: number
  seniors: number
}) {
  return (
    <div className="age-stack" aria-label="Age group share">
      <div className="age-stack-bar">
        <i style={{ width: `${working}%`, background: COLORS.working }} title={`Working ${working}%`} />
        <i style={{ width: `${kids}%`, background: COLORS.kids }} title={`Kids ${kids}%`} />
        <i style={{ width: `${seniors}%`, background: COLORS.seniors }} title={`Seniors ${seniors}%`} />
      </div>
      <div className="age-stack-labels">
        <span>
          <b style={{ color: COLORS.working }}>{working}%</b> working
        </span>
        <span>
          <b style={{ color: '#b45309' }}>{kids}%</b> kids
        </span>
        <span>
          <b style={{ color: COLORS.seniors }}>{seniors}%</b> seniors
        </span>
      </div>
    </div>
  )
}

function AgeColumns({
  buckets,
}: {
  buckets: DemographicSnapshot['ageBuckets']
  total: number
}) {
  const max = Math.max(...buckets.map((b) => b.count), 1)
  return (
    <div className="age-cols" role="img" aria-label="People by age band">
      <div className="age-cols-plot">
        {buckets.map((b, idx) => {
          const h = Math.max(8, Math.round((b.count / max) * 100))
          return (
            <div key={b.label} className="age-col">
              <strong>{b.count.toLocaleString()}</strong>
              <div className="age-col-shaft">
                <i
                  style={{
                    height: `${h}%`,
                    background: COLORS.cols[idx % COLORS.cols.length],
                  }}
                />
              </div>
              <em>{b.label}</em>
              <span>{b.percent}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AgeMixCharts({ demo }: { demo: DemographicSnapshot }) {
  return (
    <div className="age-mix">
      <div className="age-mix-grid">
        <div className="age-mix-block">
          <h4>Big picture</h4>
          <p className="age-mix-hint">Share of working age, kids and seniors</p>
          <Donut
            working={demo.workingAgePercent}
            kids={demo.childrenPercent}
            seniors={demo.seniorsPercent}
            total={demo.totalPeople}
          />
        </div>
        <div className="age-mix-block">
          <h4>Age bands</h4>
          <p className="age-mix-hint">People in each age group</p>
          <AgeColumns buckets={demo.ageBuckets} total={demo.totalPeople} />
        </div>
      </div>
      <div className="age-mix-block age-mix-strip">
        <h4>One-look split</h4>
        <StackStrip
          working={demo.workingAgePercent}
          kids={demo.childrenPercent}
          seniors={demo.seniorsPercent}
        />
      </div>
    </div>
  )
}
