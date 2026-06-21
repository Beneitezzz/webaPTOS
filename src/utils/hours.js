// openingHours array: index 0=lunes, 1=martes, ..., 5=sábado, 6=domingo
// JS Date.getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
// Mapping: Sunday(0)→6, Monday(1)→0, Tue(2)→1, ..., Sat(6)→5
function jsDayToIndex(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1
}

function inSlot(cur, open, close) {
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  return cur >= oh * 60 + om && cur < ch * 60 + cm
}

// Returns true if open, false if closed, null if no data
export function isOpenNow(openingHours) {
  if (!openingHours?.length) return null
  const now = new Date()
  const today = openingHours[jsDayToIndex(now.getDay())]
  if (!today || today.closed) return false
  if (!today.open || !today.close) return null
  const cur = now.getHours() * 60 + now.getMinutes()
  if (inSlot(cur, today.open, today.close)) return true
  if (today.open2 && today.close2) return inSlot(cur, today.open2, today.close2)
  return false
}

const DAY_ABBREV = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Returns compact human-readable string grouping consecutive days with same hours
// e.g. "Lun–Vie: 9:00–20:00 | Sáb: 9:00–13:00 | Dom: Cerrado"
export function formatOpeningHours(openingHours) {
  if (!openingHours?.length) return null
  const parts = []
  let i = 0
  while (i < openingHours.length) {
    const cur = openingHours[i]
    let j = i + 1
    while (j < openingHours.length) {
      const next = openingHours[j]
        if (
        next.closed === cur.closed &&
        next.open === cur.open && next.close === cur.close &&
        (next.open2 ?? '') === (cur.open2 ?? '') &&
        (next.close2 ?? '') === (cur.close2 ?? '')
      ) j++
      else break
    }
    const range = i === j - 1 ? DAY_ABBREV[i] : `${DAY_ABBREV[i]}–${DAY_ABBREV[j - 1]}`
    if (cur.closed) parts.push(`${range}: Cerrado`)
    else if (cur.open2 && cur.close2) parts.push(`${range}: ${cur.open}–${cur.close} y ${cur.open2}–${cur.close2}`)
    else parts.push(`${range}: ${cur.open}–${cur.close}`)
    i = j
  }
  return parts.join(' | ')
}
