// Design D. Everything below the hero is built from trips.json, a snapshot of
// the prod API (GET /api/trips?locale=en), so the counts are real data.

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const country = (t) => t.region.split(',').pop().trim()
const money = (p) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: p.currency, maximumFractionDigits: 0 }).format(p.amount / 100)
const day = (iso, opts) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', opts).replace('Sept', 'Sep')
const range = (d) => `${day(d.startsOn, { day: 'numeric', month: 'short' })} – ${day(d.endsOn, { day: 'numeric', month: 'short', year: 'numeric' })}`
const monthKey = (iso) => iso.slice(0, 7)
// Mockup only: her copy adds the country to these two names; the API title has none.
const name = (t) => ['okanagan-valley', 'british-columbia'].includes(t.slug) ? `${t.title}, Canada` : t.title

// Mockup only: her longer featured-trip copy is not in the API yet.
const FEATURED = {
  'southern-italy': 'A fifteen night slow journey across six regions, from Rome to Sicily. Explore coastal villages, historic towns, and local workshops with maximum six guests, accompanied by a dedicated host and a chef.',
  'okanagan-valley': 'A ten night journey, exploring the heart of Canada’s premier wine valley. Featuring curated vineyard tastings, scenic trails, and hyper-local seasonal gastronomy.',
  'british-columbia': 'From the urban energy of Vancouver and Victoria to the peaks of Whistler and the vineyards of Okanagan Valley. A fourteen-night journey exploring Western Canada’s iconic cities alongside pristine lakes and coastal wild.',
}

// Header turns navy once the hero is behind it.
const header = $('[data-top]')
const solid = () => header.classList.toggle('is-solid', scrollY > 40 || header.classList.contains('is-open'))
addEventListener('scroll', solid, { passive: true })
// Mobile menu. Open/closed is one class on the header; CSS does the motion.
// inert keeps the hidden links out of the tab order.
const menuBtn = $('.top__menu')
const setMenu = (open) => {
  header.classList.toggle('is-open', open)
  $('#menu').inert = !open
  menuBtn.setAttribute('aria-expanded', String(open))
  menuBtn.textContent = open ? 'Close' : 'Menu'
  solid()
}
menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('is-open')))
$$('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)))
// A tap on the dimmed page (the header's own ::before) closes the menu.
header.addEventListener('click', (e) => { if (e.target === header) setMenu(false) })
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); menuBtn.focus() }
})

// Native <select> popups cannot be styled, so each one gets a button and a
// listbox in the site's style. The hidden <select> keeps the value and fires
// "change", so code reading select.value works unchanged.
let ddCount = 0
function dropdown(sel) {
  const id = `dd${++ddCount}`
  const box = document.createElement('div')
  box.className = 'dd'
  box.innerHTML = `<button type="button" class="dd__btn" aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}"></button>
    <ul class="dd__list" id="${id}" role="listbox" hidden></ul>`
  sel.before(box)
  box.append(sel)
  sel.hidden = true
  const btn = $('.dd__btn', box)
  const list = $('.dd__list', box)
  const name = sel.getAttribute('aria-label') ?? sel.closest('label')?.querySelector('span')?.textContent ?? ''
  let active = 0

  const label = () => {
    btn.textContent = sel.selectedOptions[0]?.textContent ?? ''
    btn.setAttribute('aria-label', `${name}: ${btn.textContent}`)
  }
  const highlight = (i) => {
    active = (i + sel.options.length) % sel.options.length
    $$('li', list).forEach((li, n) => li.classList.toggle('is-active', n === active))
    btn.setAttribute('aria-activedescendant', `${id}-${active}`)
    list.children[active]?.scrollIntoView({ block: 'nearest' })
  }
  const close = () => {
    list.hidden = true
    btn.setAttribute('aria-expanded', 'false')
    btn.removeAttribute('aria-activedescendant')
  }
  const open = () => {
    list.innerHTML = [...sel.options].map((o, i) =>
      `<li role="option" id="${id}-${i}" aria-selected="${o.selected}">${esc(o.textContent)}</li>`).join('')
    list.classList.remove('is-up')
    list.hidden = false
    const room = innerHeight - btn.getBoundingClientRect().bottom
    list.classList.toggle('is-up', room < list.offsetHeight + 24 && btn.getBoundingClientRect().top > room)
    btn.setAttribute('aria-expanded', 'true')
    highlight(sel.selectedIndex)
  }
  const choose = (i) => {
    sel.selectedIndex = i
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    label()
    close()
    btn.focus()
  }

  btn.addEventListener('click', (e) => { e.preventDefault(); list.hidden ? open() : close() })
  btn.addEventListener('keydown', (e) => {
    const opened = !list.hidden
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      opened ? highlight(active + (e.key === 'ArrowDown' ? 1 : -1)) : open()
    } else if ((e.key === 'Enter' || e.key === ' ') && opened) {
      e.preventDefault()
      choose(active)
    } else if (e.key === 'Escape' && opened) {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') close()
  })
  list.addEventListener('mousedown', (e) => e.preventDefault())
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li')
    if (li) choose([...list.children].indexOf(li))
  })
  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('li')
    if (li) highlight([...list.children].indexOf(li))
  })
  document.addEventListener('click', (e) => { if (!box.contains(e.target)) close() })
  label()
}
$$('.top__util select').forEach(dropdown)

// A horizontal rail with arrows and a progress line, used by the trip cards.
function rail(name) {
  const el = $(`[data-rail="${name}"]`)
  const bar = $(`[data-progress="${name}"] span`)
  const [prev, next] = $$(`[data-arrows="${name}"] button`)
  const sync = () => {
    const max = el.scrollWidth - el.clientWidth
    const seen = el.clientWidth / el.scrollWidth
    bar.style.width = `${Math.min(100, seen * 100)}%`
    bar.style.transform = `translateX(${max > 0 ? (el.scrollLeft / max) * ((1 - seen) / seen) * 100 : 0}%)`
    if (prev) { prev.disabled = el.scrollLeft <= 2; next.disabled = el.scrollLeft >= max - 2 }
  }
  prev?.addEventListener('click', () => el.scrollBy({ left: -el.clientWidth * 0.9, behavior: 'smooth' }))
  next?.addEventListener('click', () => el.scrollBy({ left: el.clientWidth * 0.9, behavior: 'smooth' }))
  el.addEventListener('scroll', sync, { passive: true })
  addEventListener('resize', sync)
  return sync
}

function card(t) {
  const deps = t.departures.filter((d) => d.status === 'open')
  const first = deps[0]
  const nights = first?.nights
  const gallery = t.gallery.length
    ? `<div class="card__slides">${t.gallery.map((src, i) => `<img src="${esc(src)}" alt="" loading="lazy" ${i ? '' : 'fetchpriority="low"'}>`).join('')}</div>
       <button class="card__next" type="button" aria-label="Next photo of ${esc(t.title)}">&rsaquo;</button>
       <div class="card__dots"><span style="width:${100 / t.gallery.length}%"></span></div>`
    : `<div class="card__empty">Photos soon</div>`
  const dates = deps.length ? deps.map(range).join('<br>') : `Dates: ${esc(t.datesNote ?? 'to be announced')}`
  const details = [nights && `${nights} nights`, `${t.groupSizeMax} travelers per trip`, t.fromPrice && money(t.fromPrice)].filter(Boolean).join(' &nbsp;·&nbsp; ')
  const action = deps.length
    ? `<a class="link" href="../c/trip.html">View Trip</a>`
    : `<a class="link" href="#contact">Join Priority Access</a>`
  return `<article class="card">
    <div class="card__gal">${gallery}</div>
    <div class="card__body">
      <h3><a href="../c/trip.html">${esc(name(t))}</a></h3>
      <p class="card__meta">${details}</p>
      ${t.summary ? `<p class="card__desc">${esc(t.summary)}</p>` : ''}
      <p class="card__dates">${dates}</p>
      ${action}
    </div>
  </article>`
}

function wireGallery(art) {
  const slides = $('.card__slides', art)
  if (!slides) return
  const dot = $('.card__dots span', art)
  const n = slides.children.length
  $('.card__next', art).addEventListener('click', () => {
    const i = Math.round(slides.scrollLeft / slides.clientWidth)
    slides.scrollTo({ left: ((i + 1) % n) * slides.clientWidth, behavior: 'smooth' })
  })
  slides.addEventListener('scroll', () => {
    dot.style.transform = `translateX(${Math.round(slides.scrollLeft / slides.clientWidth) * 100}%)`
  }, { passive: true })
}

fetch('trips.json').then((r) => r.json()).then((all) => {
  // Her brief: the home block shows the first six journeys, the rest live on /trips.
  const trips = all.slice(0, 6)
  const countries = [...new Set(trips.map(country))]

  // Trip cards with tabs and finder
  const state = { country: '', month: '' }
  const tabs = $('[data-tabs]')
  tabs.innerHTML = ['', ...countries].map((c) =>
    `<button type="button" role="tab" data-country="${esc(c)}">${c ? esc(c) : 'All trips'}</button>`).join('')
  const syncTrips = rail('trips')
  const render = () => {
    const list = trips.filter((t) =>
      (!state.country || country(t) === state.country) &&
      (!state.month || t.departures.some((d) => monthKey(d.startsOn) === state.month)))
    const out = $('[data-rail="trips"]')
    out.innerHTML = list.length ? list.map(card).join('') : '<p>No departures match. Try another month or show all trips.</p>'
    $$('.card', out).forEach(wireGallery)
    out.scrollLeft = 0
    $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.country === state.country)))
    syncTrips()
  }
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (!b) return
    Object.assign(state, { country: b.dataset.country, month: '' })
    render()
  })
  $('[data-count]').textContent = all.length

  const where = $('[data-where]')
  where.insertAdjacentHTML('beforeend', countries.map((c) => `<option>${esc(c)}</option>`).join(''))
  const months = [...new Set(trips.flatMap((t) => t.departures.map((d) => monthKey(d.startsOn))))].sort()
  $('[data-when]').insertAdjacentHTML('beforeend', months.map((m) =>
    `<option value="${m}">${day(m + '-01', { month: 'long', year: 'numeric' })}</option>`).join(''))
  $$('[data-finder] select').forEach(dropdown)
  $('[data-finder]').addEventListener('submit', (e) => {
    e.preventDefault()
    Object.assign(state, { country: where.value, month: $('[data-when]').value })
    render()
    $('#where').scrollIntoView()
  })
  render()

  // Featured trips: three journeys on sale, her longer copy
  const bySlug = Object.fromEntries(all.map((t) => [t.slug, t]))
  $('[data-featured]').innerHTML = Object.entries(FEATURED).map(([slug, text]) => {
    const t = bySlug[slug]
    if (!t) return ''
    const deps = t.departures.filter((d) => d.status === 'open')
    const details = [deps[0] && `${deps[0].nights} nights`, `${t.groupSizeMax} travelers`, t.fromPrice && money(t.fromPrice)].filter(Boolean).join(' &nbsp;·&nbsp; ')
    return `<article class="feat">
      ${t.gallery[0] ? `<img src="${esc(t.gallery[0])}" alt="" loading="lazy">` : ''}
      <h3>${esc(name(t))}</h3>
      <p class="feat__meta">${details}</p>
      <p>${esc(text)}</p>
      <p class="feat__dates">${deps.map(range).join('<br>')}</p>
      <div class="feat__actions">
        <a class="btn btn--solid" href="../c/trip.html">View Itinerary</a>
        <a class="btn btn--line" href="#where">Explore all trips</a>
      </div>
    </article>`
  }).join('')
})
