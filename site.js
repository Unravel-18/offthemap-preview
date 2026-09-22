// Shared by both pages: the currency switcher, the footer folds, and a
// departure chosen from a date pill.

// Currency is display only. A trip is priced and charged in its own currency
// (MXN for the Okanagan); another choice converts what is shown and marks it
// approximate. Anything that is actually charged keeps the MXN figure and
// carries the conversion underneath it.
// ponytail: fixed mock rates; the app reads a table the scheduler refreshes daily.
const RATES = { MXN: 1, USD: 0.054, EUR: 0.049 }

function approx(mxn, cur) {
  const n = Math.round(mxn * RATES[cur]).toLocaleString('en')
  return cur === 'EUR' ? `≈ €${n}` : `≈ $${n} ${cur}`
}

function applyCurrency(cur) {
  if (!RATES[cur]) cur = 'MXN'
  for (const el of document.querySelectorAll('[data-mxn]')) {
    const text = cur === 'MXN' ? '' : approx(+el.dataset.mxn, cur)
    if ('charge' in el.dataset) {
      el.querySelector('.approx').textContent = text
    } else {
      el.dataset.orig ??= el.textContent
      el.textContent = text || el.dataset.orig
    }
  }
  for (const s of document.querySelectorAll('.top__cur')) s.value = cur
}

let saved = 'MXN'
try { saved = localStorage.getItem('otm-currency') || 'MXN' } catch {}
applyCurrency(saved)
for (const s of document.querySelectorAll('.top__cur')) {
  s.addEventListener('change', () => {
    applyCurrency(s.value)
    try { localStorage.setItem('otm-currency', s.value) } catch {}
  })
}

// Footer: Legal and Language fold on a phone, and stay open where there is room.
const wide = matchMedia('(min-width: 700px)')
const folds = document.querySelectorAll('.foot__acc')
const syncFolds = () => folds.forEach(d => { d.open = wide.matches })
wide.addEventListener('change', syncFolds)
syncFolds()
for (const d of folds) {
  d.querySelector('summary').addEventListener('click', e => { if (wide.matches) e.preventDefault() })
}

// A date pill chooses that departure in the booking form: from the homepage by
// ?departure=, on the trip page directly.
const departure = document.querySelector('select[name="departure"]')
if (departure) {
  const note = document.querySelector('[data-seats-note]')
  // A full departure takes no deposit, so the button stops offering one.
  const btn = document.querySelector('[data-book-btn]')
  const payLabel = btn.textContent
  const showSeats = () => {
    const o = departure.selectedOptions[0]
    const full = o.dataset.seats === '0'
    note.textContent = full
      ? 'This departure is full. Join the waitlist and we write to you if a seat opens.'
      : `${o.dataset.seats} of 6 seats still free on this departure.`
    btn.textContent = full ? 'Join the waitlist' : payLabel
    btn.classList.toggle('btn--book', !full)
    btn.classList.toggle('btn--line', full)
  }
  const choose = value => {
    if (![...departure.options].some(o => o.value === value)) return
    departure.value = value
    showSeats()
  }
  departure.addEventListener('change', showSeats)
  choose(new URLSearchParams(location.search).get('departure'))
  for (const a of document.querySelectorAll('[data-departure]')) {
    a.addEventListener('click', () => choose(a.dataset.departure))
  }
}
