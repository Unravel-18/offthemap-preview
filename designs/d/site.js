// Design D. Every page runs this file; <body data-page> picks the page code.
// Data is a snapshot of the prod API: trips.json (GET /api/trips?locale=en),
// trip/<slug>.json (GET /api/trips/<slug>) and rates.json (GET /api/rates).

const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const store = {
  get: (k) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, v) } catch {} },
}

const CALL = 'https://calendly.com/work-otmadventure/1-on-1'
const WA = 'https://wa.me/393520050586'
const PAGE = document.body.dataset.page

const country = (t) => t.region.split(',').pop().trim()
const day = (iso, opts) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', opts).replace('Sept', 'Sep')
const range = (d) => `${day(d.startsOn, { day: 'numeric', month: 'short' })} – ${day(d.endsOn, { day: 'numeric', month: 'short', year: 'numeric' })}`
const monthKey = (iso) => iso.slice(0, 7)
const tripUrl = (t) => `trip.html?slug=${encodeURIComponent(t.slug)}`
// Mockup only: her copy adds the country to these two names; the API title has none.
const name = (t) => ['okanagan-valley', 'british-columbia'].includes(t.slug) ? `${t.title}, Canada` : t.title

// Prices. A trip is charged in its own currency; any other currency is shown
// as an approximation ("≈") from the ECB rates, the same rule as the app.
// money() leaves a marker that paintPrices() fills, so switching currency
// repaints every price on the page without re-rendering it.
const CURRENCIES = ['EUR', 'GBP', 'USD', 'CAD', 'MXN']
let currency = CURRENCIES.includes(store.get('otm-currency')) ? store.get('otm-currency') : 'EUR'
let perEur = null
const rates = fetch('rates.json').then((r) => r.json()).then((r) => { perEur = r.perEur })
const money = (p) => p ? `<span data-price="${p.amount} ${p.currency}"></span>` : ''
function paintPrices() {
  $$('[data-price]').forEach((el) => {
    const [cents, from] = el.dataset.price.split(' ')
    const exact = from === currency || !perEur
    const value = exact ? cents / 100 : cents / 100 / perEur[from] * perEur[currency]
    const fmt = new Intl.NumberFormat('en-GB', { style: 'currency', currency: exact ? from : currency, maximumFractionDigits: 0 })
    el.textContent = (exact ? '' : '≈ ') + fmt.format(value)
  })
}

// Header, mobile menu, closing call to action and footer are the same on every
// page, so they are written once here.
const NAV = [['trips.html', 'Trips'], ['about.html', 'About'], ['contact.html', 'Contact']]
const here = location.pathname.split('/').pop() || 'index.html'
const navLinks = (attr = () => '') => NAV.map(([href, label], i) =>
  `<a href="${href}"${href === here ? ' aria-current="page"' : ''}${attr(i)}>${label}</a>`).join('')
const langOptions = ['EN', 'ES', 'IT'].map((l) => `<option>${l}</option>`).join('')
const curOptions = CURRENCIES.map((c) => `<option${c === currency ? ' selected' : ''}>${c}</option>`).join('')

const header = $('[data-top]')
header.innerHTML = `
  <div class="top__in">
    <a class="top__logo" href="index.html"><img src="../logos/logo-light.png" alt="Off The Map, home" width="480" height="565"></a>
    <nav class="top__main" aria-label="Main">${navLinks()}</nav>
    <div class="top__util">
      <a class="top__phone" href="${WA}">+39 352 005 0586</a>
      <select data-lang aria-label="Language">${langOptions}</select>
      <select data-cur aria-label="Show prices in">${curOptions}</select>
      <a class="btn btn--solid-light btn--sm" href="${CALL}" target="_blank" rel="noopener">Book a call</a>
    </div>
    <a class="btn btn--solid-light btn--sm top__call" href="${CALL}" target="_blank" rel="noopener">Book a call</a>
    <button class="top__menu" type="button" aria-expanded="false" aria-controls="menu">Menu</button>
  </div>
  <nav class="menu" id="menu" aria-label="Menu" inert>
    <div class="menu__clip">
      <div class="menu__list">
        ${navLinks((i) => ` style="--i:${i}"`)}
        <div class="menu__prefs" style="--i:3">
          <label><span>Language</span><select data-lang>${langOptions}</select></label>
          <label><span>Prices in</span><select data-cur>${curOptions}</select></label>
        </div>
        <p class="menu__contact" style="--i:4"><a href="${WA}">WhatsApp +39 352 005 0586</a></p>
      </div>
    </div>
  </nav>`

$$('[data-cta]').forEach((el) => {
  el.className = 'cta'
  el.setAttribute('aria-labelledby', 'cta-title')
  el.innerHTML = `
    <div class="wrap cta__in">
      <h2 id="cta-title">Ready to discover places off the map?</h2>
      <p>Have questions about an itinerary or want to plan a journey with us? Book a 1-on-1 call with our team.</p>
      <div class="cta__actions">
        <a class="btn btn--solid" href="${CALL}" target="_blank" rel="noopener">Book a Call</a>
        <a class="btn btn--line" href="${WA}" target="_blank" rel="noopener">Chat on WhatsApp</a>
      </div>
    </div>`
})

$('[data-foot]').innerHTML = `
  <div class="wrap">
    <div class="foot__cols">
      <div>
        <h3>Off The Map</h3>
        <ul>
          <li><a href="about.html">About</a></li>
          <li><a href="trips.html">Trips</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="contact.html#work">Careers</a></li>
          <li><a href="contact.html#work">Become a Partner</a></li>
        </ul>
      </div>
      <div>
        <h3>Legal</h3>
        <ul>
          <li><a href="#">Terms and conditions</a></li>
          <li><a href="#">Privacy policy</a></li>
          <li><a href="#">Cancellation policy</a></li>
          <li><a href="#">Cookie preferences</a></li>
        </ul>
      </div>
      <div class="foot__talk">
        <h3>Talk to us</h3>
        <ul>
          <li><a href="mailto:hey@otmadventure.com">hey@otmadventure.com</a></li>
          <li><a href="${WA}">WhatsApp +39 352 005 0586</a></li>
          <li><a href="${CALL}" target="_blank" rel="noopener">Book a 1-on-1 call</a></li>
          <li><button class="foot__news" type="button" data-news-open>Get the newsletter</button></li>
          <li class="foot__social"><a href="#">Facebook</a><a href="#">Instagram</a></li>
        </ul>
      </div>
    </div>
    <div class="foot__base">
      <img src="../logos/logo-light.png" alt="Off The Map" width="480" height="565">
      <p>Off The Map Adventure Ltd, Company Number 17411078<br>Registered office: 64 Southwark Bridge Road, London, England, SE1 0AS<br>&copy; 2026 Off The Map</p>
    </div>
  </div>`

// Header turns navy once the page has scrolled under it.
const solid = () => header.classList.toggle('is-solid', scrollY > 40 || header.classList.contains('is-open'))
addEventListener('scroll', solid, { passive: true })
solid()
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

// Native <select> popups cannot be styled, so each desktop one gets a button
// and a listbox in the site's style. The hidden <select> keeps the value and
// fires "change", so code reading select.value works unchanged. The menu on a
// phone keeps native selects: the phone's own picker is the better control.
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
  sel.relabel = label
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

// The language and currency pickers exist twice (header and phone menu);
// a change in one moves the other. Language is a mockup control: only EN
// copy exists so far.
const syncPicker = (attr, value) => $$(`select[${attr}]`).forEach((s) => { s.value = value; s.relabel?.() })
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-cur]')) {
    currency = e.target.value
    store.set('otm-currency', currency)
    syncPicker('data-cur', currency)
    paintPrices()
  } else if (e.target.matches('[data-lang]')) {
    syncPicker('data-lang', e.target.value)
  }
})

// Newsletter, as a popup rather than a section (her ask, 7 Nov). It opens once
// per visitor: after 25 s or half way down the page, whichever comes first,
// and from "Get the newsletter" in the footer at any time.
const news = document.createElement('dialog')
news.className = 'news'
news.setAttribute('aria-labelledby', 'news-title')
news.innerHTML = `
  <img class="news__img" src="https://api.otmadventure.com/storage/trips/okanagan-valley/kelowna-7b4d36e6-1600.webp" alt="">
  <form method="dialog"><button class="news__close" aria-label="Close">&times;</button></form>
  <div class="news__body">
    <h2 id="news-title">New journeys, first</h2>
    <p>New trips and open dates, sent to your inbox. Unsubscribe at any time.</p>
    <form class="news__form" data-news-form>
      <label class="visually-hidden" for="news-email">Email address</label>
      <input id="news-email" type="email" name="email" placeholder="Your email address" autocomplete="email" required>
      <button class="btn btn--solid" type="submit">Subscribe</button>
    </form>
    <p class="news__small">By subscribing you accept our <a href="#">privacy policy</a>.</p>
  </div>`
document.body.append(news)
const openNews = () => { if (!news.open) news.showModal() }
news.addEventListener('click', (e) => { if (e.target === news) news.close() })
$('[data-news-form]', news).addEventListener('submit', (e) => {
  e.preventDefault()
  // Mockup: nothing is sent. The list (Mailgun or our own table) comes after her OK.
  $('.news__body', news).innerHTML = `<h2 id="news-title">Subscribed</h2><p>We will write when there is a new journey to share.</p>`
})
$$('[data-news-open]').forEach((b) => b.addEventListener('click', openNews))
if (!store.get('otm-news-seen')) {
  const auto = () => {
    if (store.get('otm-news-seen') || header.classList.contains('is-open') || document.querySelector('dialog[open]')) return
    store.set('otm-news-seen', '1')
    removeEventListener('scroll', half)
    openNews()
  }
  const half = () => { if (scrollY > (document.documentElement.scrollHeight - innerHeight) / 2) auto() }
  setTimeout(auto, 25000)
  addEventListener('scroll', half, { passive: true })
}

// A horizontal rail with arrows and a progress line, used by the trip cards.
function rail(name) {
  const el = $(`[data-rail="${name}"]`)
  const bar = $(`[data-progress="${name}"] span`)
  const [prev, next] = $$(`[data-arrows="${name}"] button`)
  const sync = () => {
    const max = el.scrollWidth - el.clientWidth
    const seen = el.clientWidth / el.scrollWidth
    if (bar) {
      bar.style.width = `${Math.min(100, seen * 100)}%`
      bar.style.transform = `translateX(${max > 0 ? (el.scrollLeft / max) * ((1 - seen) / seen) * 100 : 0}%)`
    }
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
  const nights = deps[0]?.nights
  const gallery = t.gallery.length
    ? `<div class="card__slides">${t.gallery.map((src) => `<img src="${esc(src)}" alt="" loading="lazy">`).join('')}</div>
       <button class="card__next" type="button" aria-label="Next photo of ${esc(t.title)}">&rsaquo;</button>
       <div class="card__dots"><span style="width:${100 / t.gallery.length}%"></span></div>`
    : `<div class="card__empty">Photos soon</div>`
  const dates = deps.length ? deps.map(range).join('<br>') : `Dates: ${esc(t.datesNote ?? 'to be announced')}`
  const details = [nights && `${nights} nights`, `${t.groupSizeMax} travelers per trip`, t.fromPrice && `from ${money(t.fromPrice)}`].filter(Boolean).join(' &nbsp;·&nbsp; ')
  const action = deps.length
    ? `<a class="link" href="${tripUrl(t)}">View Trip</a>`
    : `<a class="link" href="contact.html">Join Priority Access</a>`
  return `<article class="card">
    <div class="card__gal">${gallery}</div>
    <div class="card__body">
      <h3><a href="${tripUrl(t)}">${esc(name(t))}</a></h3>
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

// Country tabs over a list of trips; `draw` paints the filtered list.
function countryTabs(trips, draw) {
  const tabs = $('[data-tabs]')
  const countries = [...new Set(trips.map(country))]
  tabs.innerHTML = ['', ...countries].map((c) =>
    `<button type="button" role="tab" data-country="${esc(c)}">${c ? esc(c) : 'All trips'}</button>`).join('')
  const select = (c) => $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.country === c)))
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (b) draw(b.dataset.country)
  })
  return { countries, select }
}

const PAGES = {}

// Mockup only: her longer featured-trip copy is not in the API yet.
const FEATURED = {
  'southern-italy': 'A fifteen night slow journey across six regions, from Rome to Sicily. Explore coastal villages, historic towns, and local workshops with maximum six guests, accompanied by a dedicated host and a chef.',
  'okanagan-valley': 'A ten night journey, exploring the heart of Canada’s premier wine valley. Featuring curated vineyard tastings, scenic trails, and hyper-local seasonal gastronomy.',
  'british-columbia': 'From the urban energy of Vancouver and Victoria to the peaks of Whistler and the vineyards of Okanagan Valley. A fourteen-night journey exploring Western Canada’s iconic cities alongside pristine lakes and coastal wild.',
}

PAGES.home = (all) => {
  // Her brief: the home block shows the first six journeys, the rest live on /trips.
  const trips = all.slice(0, 6)
  const state = { country: '', month: '' }
  const syncTrips = rail('trips')
  const render = () => {
    const list = trips.filter((t) =>
      (!state.country || country(t) === state.country) &&
      (!state.month || t.departures.some((d) => monthKey(d.startsOn) === state.month)))
    const out = $('[data-rail="trips"]')
    out.innerHTML = list.length ? list.map(card).join('') : '<p>No departures match. Try another month or show all trips.</p>'
    $$('.card', out).forEach(wireGallery)
    out.scrollLeft = 0
    tabs.select(state.country)
    paintPrices()
    syncTrips()
  }
  const tabs = countryTabs(trips, (c) => { Object.assign(state, { country: c, month: '' }); render() })
  $('[data-count]').textContent = all.length

  const where = $('[data-where]')
  where.insertAdjacentHTML('beforeend', tabs.countries.map((c) => `<option>${esc(c)}</option>`).join(''))
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

  // Featured trips: three journeys on sale, her longer copy
  const bySlug = Object.fromEntries(all.map((t) => [t.slug, t]))
  $('[data-featured]').innerHTML = Object.entries(FEATURED).map(([slug, text]) => {
    const t = bySlug[slug]
    if (!t) return ''
    const deps = t.departures.filter((d) => d.status === 'open')
    const details = [deps[0] && `${deps[0].nights} nights`, `${t.groupSizeMax} travelers`, t.fromPrice && `from ${money(t.fromPrice)}`].filter(Boolean).join(' &nbsp;·&nbsp; ')
    return `<article class="feat">
      ${t.gallery[0] ? `<img src="${esc(t.gallery[0])}" alt="" loading="lazy">` : ''}
      <h3>${esc(name(t))}</h3>
      <p class="feat__meta">${details}</p>
      <p>${esc(text)}</p>
      <p class="feat__dates">${deps.map(range).join('<br>')}</p>
      <div class="feat__actions">
        <a class="btn btn--solid" href="${tripUrl(t)}">View Itinerary</a>
        <a class="btn btn--line" href="trips.html">Explore all trips</a>
      </div>
    </article>`
  }).join('')
  render()
}

PAGES.trips = (all) => {
  const grid = $('[data-grid]')
  const draw = (c) => {
    const list = all.filter((t) => !c || country(t) === c)
    grid.innerHTML = list.map(card).join('')
    $$('.card', grid).forEach(wireGallery)
    $('[data-shown]').textContent = `${list.length} ${list.length === 1 ? 'journey' : 'journeys'}`
    tabs.select(c)
    paintPrices()
  }
  const tabs = countryTabs(all, draw)
  draw(new URLSearchParams(location.search).get('country') ?? '')
}

// Labels for the keys of `included` in the API.
const INCLUDED = { accommodation: 'Accommodation', lodgingBasis: 'Rooms', food: 'Food', transfers: 'Getting around', activities: 'Activities', accompaniment: 'Hosting' }
const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`

PAGES.trip = async () => {
  const slug = new URLSearchParams(location.search).get('slug') ?? 'okanagan-valley'
  const res = await fetch(`trip/${encodeURIComponent(slug)}.json`)
  if (!res.ok) {
    $('[data-trip]').innerHTML = `<section class="page-head"><div class="wrap"><h1>Trip not found</h1>
      <p class="lede">This journey is not on the site. <a href="trips.html">See all trips</a>.</p></div></section>`
    return
  }
  const t = (await res.json()).data
  document.title = `${t.title} | Off The Map`
  const deps = t.departures.filter((d) => d.status === 'open')
  const first = deps[0]
  const hero = t.gallery[0]?.large
  const nights = first?.nights

  const facts = [
    nights && ['Duration', `${nights} nights`],
    ['Group', t.groupSizeMin && t.groupSizeMin !== t.groupSizeMax ? `${t.groupSizeMin} to ${t.groupSizeMax} travelers` : `Up to ${t.groupSizeMax} travelers`],
    ['Departures', deps.length ? `${deps.length} in ${[...new Set(deps.map((d) => d.startsOn.slice(0, 4)))].join(', ')}` : esc(t.datesNote ?? 'To be announced')],
    t.depositPercent && ['To reserve', `${t.depositPercent}% deposit`],
  ].filter(Boolean)

  const notes = [['The territory', t.territory], ['Who it is for', t.audience], ['Climate', t.climate]].filter(([, v]) => v)

  const itinerary = t.itinerary?.length
    ? t.itinerary.map((d, i) => `
      <details class="day"${i ? '' : ' open'}>
        <summary><span class="day__n">Day ${d.dayNumber}</span><span class="day__t">${esc(d.title)}</span></summary>
        <div class="day__body">
          ${d.blocks.map((b) => `<div class="day__block"><h4>${b.time ? `${esc(b.time)}, ` : ''}${esc(b.title)}</h4><p>${esc(b.description)}</p></div>`).join('')}
          ${d.included?.length ? `<p class="day__inc"><strong>Included:</strong> ${d.included.map(esc).join(', ')}</p>` : ''}
        </div>
      </details>`).join('')
    : `<p class="trip__soon">The day-by-day itinerary for this journey is being written. Book a call and we will walk you through it.</p>`

  const inc = t.included
    ? Object.entries(t.included).map(([k, v]) => `<div><h4>${esc(INCLUDED[k] ?? k)}</h4>${Array.isArray(v) ? list(v) : `<p>${esc(v)}</p>`}</div>`).join('')
    : ''

  const departures = deps.length
    ? `<ul class="book__deps" role="radiogroup" aria-label="Departure dates">${deps.map((d, i) => `
        <li><label>
          <input type="radio" name="dep" value="${d.id}"${i ? '' : ' checked'}>
          <span class="book__date">${range(d)}</span>
          <span class="book__meta">${d.spotsLeft} of ${d.totalSpots} spots left</span>
          <span class="book__price">${money(d.basePrice)}</span>
        </label></li>`).join('')}</ul>`
    : `<p class="book__none">Dates ${esc(t.datesNote ?? 'to be announced')}. Join priority access and hear first.</p>`

  $('[data-trip]').innerHTML = `
    <section class="trip-hero">
      ${hero ? `<img class="hero__img" src="${esc(hero)}" alt="">` : ''}
      <div class="trip-hero__in wrap">
        <p class="trip-hero__region">${esc(t.region)}</p>
        <h1>${esc(name(t))}</h1>
        ${t.summary ? `<p class="trip-hero__sub">${esc(t.summary)}</p>` : ''}
      </div>
    </section>

    <nav class="trip-nav" aria-label="On this page">
      <div class="wrap">
        <a href="#overview">Overview</a><a href="#itinerary">Itinerary</a>${inc || t.notIncluded?.length ? '<a href="#included">What’s included</a>' : ''}${t.team?.length ? '<a href="#host">Your host</a>' : ''}<a href="#dates">Dates and prices</a>
      </div>
    </nav>

    <div class="wrap trip-body">
      <div class="trip-main">
        <section id="overview" aria-labelledby="overview-title">
          <h2 id="overview-title" class="visually-hidden">Overview</h2>
          <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
          ${t.description ? `<p class="trip__intro">${esc(t.description)}</p>` : ''}
          ${notes.length ? `<div class="notes">${notes.map(([k, v]) => `<div><h3>${k}</h3><p>${esc(v)}</p></div>`).join('')}</div>` : ''}
        </section>

        ${t.gallery.length > 1 ? `<div class="trip-gal">
          <div class="rail" data-rail="gal">${t.gallery.map((g) => `<img src="${esc(g.small)}" alt="${esc(g.alt ?? '')}" loading="lazy">`).join('')}</div>
          <div class="trip-gal__ctrl">
            <div class="arrows" data-arrows="gal"><button type="button" aria-label="Previous photos">&larr;</button><button type="button" aria-label="Next photos">&rarr;</button></div>
            <div class="progress" data-progress="gal"><span></span></div>
          </div>
        </div>` : ''}

        <section id="itinerary" aria-labelledby="itin-title">
          <h2 id="itin-title">Itinerary</h2>
          ${itinerary}
        </section>

        ${inc || t.notIncluded?.length ? `<section id="included" aria-labelledby="inc-title">
          <h2 id="inc-title">What’s included</h2>
          <div class="inc">${inc}${t.notIncluded?.length ? `<div><h4>Not included</h4>${list(t.notIncluded)}</div>` : ''}</div>
          ${t.paidOnArrival?.note ? `<p class="inc__arrival">${esc(t.paidOnArrival.note)}</p>` : ''}
        </section>` : ''}

        ${t.team?.length ? `<section id="host" aria-labelledby="host-title">
          <h2 id="host-title">${t.team.length > 1 ? 'Your hosts' : 'Your host'}</h2>
          ${t.team.map((m) => `<div class="host">
            <h3>${esc(m.name)}</h3>
            <p class="host__role">${esc(m.role.charAt(0).toUpperCase() + m.role.slice(1))}${m.languages?.length ? `, speaks ${m.languages.map((l) => ({ it: 'Italian', en: 'English', es: 'Spanish', fr: 'French', de: 'German' }[l] ?? l)).join(' and ')}` : ''}</p>
            <p>${esc(m.bio)}</p>
          </div>`).join('')}
        </section>` : ''}
      </div>

      <aside class="book" id="dates" aria-labelledby="book-title">
        <h2 id="book-title" class="book__title">Dates and prices</h2>
        ${t.fromPrice ? `<p class="book__from">From <strong>${money(t.fromPrice)}</strong> per person</p>` : ''}
        ${departures}
        ${deps.length ? `<a class="btn btn--solid book__go" href="#">Reserve with ${t.depositPercent}% deposit</a>
          <p class="book__terms">Pay the rest monthly or in one payment, due 60 days before departure.</p>`
          : `<a class="btn btn--solid book__go" href="contact.html">Join Priority Access</a>`}
        <div class="book__call">
          <p>Questions before you book?</p>
          <a class="btn btn--line" href="${CALL}" target="_blank" rel="noopener">Book a call</a>
        </div>
      </aside>
    </div>

    <div class="book-bar">
      ${t.fromPrice ? `<p>From <strong>${money(t.fromPrice)}</strong></p>` : '<p></p>'}
      <a class="btn btn--line btn--sm" href="${CALL}" target="_blank" rel="noopener">Book a call</a>
      <a class="btn btn--solid btn--sm" href="#dates">See dates</a>
    </div>`

  if (t.gallery.length > 1) rail('gal')()
  paintPrices()
}

const data = PAGE === 'home' || PAGE === 'trips' ? fetch('trips.json').then((r) => r.json()) : Promise.resolve()
Promise.all([data, rates.catch(() => {})]).then(([all]) => PAGES[PAGE]?.(all)).then(paintPrices)
