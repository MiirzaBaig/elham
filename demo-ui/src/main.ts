import { io } from 'socket.io-client';
import { Lang, t } from './i18n';

type Slot = { id: string; startsAt: string; endsAt: string };
type Booking = {
  id: string;
  slotId: string;
  customerName: string;
  customerEmail: string;
  status: 'active' | 'cancelled';
};
type LiveEvent = {
  kind: 'slot.booked' | 'slot.released';
  slotId: string;
  bookingId: string;
  available: boolean;
  at: string;
};

const STORAGE_KEY = 'demo-ui-bookings';

let lang: Lang = 'ar';
let selectedSlot: Slot | null = null;
let connected = false;
let slotsLoading = true;
let submitting = false;
let cachedSlots: Slot[] = [];
let myBookings: Booking[] = loadBookings();

const app = document.getElementById('app')!;
const eventLog: LiveEvent[] = [];

function loadBookings(): Booking[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

function saveBookings() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(myBookings));
}

function formatRange(startsAt: string, endsAt: string, locale: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(start);
  const time = `${start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  return { date, time };
}

async function fetchSlots(): Promise<Slot[]> {
  const res = await fetch('/slots');
  if (!res.ok) throw new Error('Failed to load slots');
  const data = (await res.json()) as { slots: Slot[] };
  return data.slots;
}

function shimmerSlots(count = 3) {
  return `<div class="shimmer-stack" aria-busy="true" aria-label="Loading">${Array.from({ length: count })
    .map(
      () => `<div class="shimmer-card">
        <div class="shimmer line w55"></div>
        <div class="shimmer line w35"></div>
        <div class="shimmer pill"></div>
      </div>`,
    )
    .join('')}</div>`;
}

function renderSlotList(locale: string, strings: ReturnType<typeof t>) {
  if (slotsLoading) return shimmerSlots();
  if (cachedSlots.length === 0) {
    return `<p class="muted empty-state">${strings.noSlots}</p>`;
  }
  return cachedSlots
    .map((slot, i) => {
      const { date, time } = formatRange(slot.startsAt, slot.endsAt, locale);
      return `<article class="slot" style="--i:${i}">
          <div class="slot-body">
            <time>${time}</time>
            <small>${date}</small>
          </div>
          <button type="button" class="btn btn-primary btn-book" data-slot-id="${slot.id}">${strings.book}</button>
        </article>`;
    })
    .join('');
}

function renderEvents(strings: ReturnType<typeof t>) {
  if (eventLog.length === 0) {
    return `<p class="muted empty-state">${strings.noEvents}</p>`;
  }
  return eventLog
    .map((ev, i) => {
      const label =
        ev.kind === 'slot.booked' ? strings.eventBooked : strings.eventReleased;
      const cls = ev.kind === 'slot.booked' ? 'event booked' : 'event released';
      return `<article class="${cls}" style="--i:${i}">
        <div class="event-head">
          <strong>${label}</strong>
          <span class="event-meta">${new Date(ev.at).toLocaleTimeString()}</span>
        </div>
        <div class="event-ids">
          <span><code>slot</code> ${ev.slotId.slice(0, 8)}…</span>
          <span><code>booking</code> ${ev.bookingId.slice(0, 8)}…</span>
        </div>
        <span class="event-avail tag ${ev.available ? 'tag-ok' : 'tag-muted'}">${ev.available ? strings.available : strings.unavailable}</span>
      </article>`;
    })
    .join('');
}

function renderMyBookings(strings: ReturnType<typeof t>) {
  const active = myBookings.filter((b) => b.status === 'active');
  if (active.length === 0) {
    return `<p class="muted empty-state">${strings.noMyBookings}</p>`;
  }
  return active
    .map(
      (b, i) => `<article class="booking-card" style="--i:${i}">
        <div class="booking-card-body">
          <strong>${b.customerName}</strong>
          <small>${b.customerEmail}</small>
          <span class="badge">${strings.statusActive}</span>
        </div>
        <button type="button" class="btn btn-outline" data-cancel-id="${b.id}">${strings.cancel}</button>
      </article>`,
    )
    .join('');
}

function bindSlotButtons(message?: { type: 'ok' | 'err'; text: string }) {
  document.querySelectorAll('[data-slot-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.slotId!;
      selectedSlot = cachedSlots.find((s) => s.id === id) ?? null;
      render(message);
    });
  });
}

function bindHandlers(message?: { type: 'ok' | 'err'; text: string }) {
  const strings = t(lang);

  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = (btn as HTMLElement).dataset.lang as Lang;
      if (next && next !== lang) {
        lang = next;
        render(message);
      }
    });
  });

  document.getElementById('refresh')?.addEventListener('click', () => {
    void loadSlots(message);
  });

  document.getElementById('back')?.addEventListener('click', () => {
    selectedSlot = null;
    render(message);
  });

  document.getElementById('book-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedSlot || submitting) return;
    submitting = true;
    render(message);
    const fd = new FormData(e.target as HTMLFormElement);
    const customerName = String(fd.get('name') ?? '').trim();
    const customerEmail = String(fd.get('email') ?? '').trim();
    try {
      const res = await fetch('/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          customerName,
          customerEmail,
        }),
      });
      const body = (await res.json()) as { booking?: Booking; error?: { message: string } };
      submitting = false;
      if (!res.ok) {
        render({ type: 'err', text: body?.error?.message ?? strings.bookingFail });
        return;
      }
      if (body.booking) {
        myBookings = [body.booking, ...myBookings.filter((b) => b.id !== body.booking!.id)];
        saveBookings();
      }
      selectedSlot = null;
      render({ type: 'ok', text: strings.bookingOk });
      await loadSlots({ type: 'ok', text: strings.bookingOk });
    } catch {
      submitting = false;
      render({ type: 'err', text: strings.bookingFail });
    }
  });

  document.querySelectorAll('[data-cancel-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = (btn as HTMLElement).dataset.cancelId!;
      btn.classList.add('is-loading');
      try {
        const res = await fetch(`/bookings/${id}`, { method: 'DELETE' });
        const body = (await res.json()) as { booking?: Booking; error?: { message: string } };
        if (!res.ok) {
          render({ type: 'err', text: body?.error?.message ?? strings.cancelFail });
          return;
        }
        if (body.booking) {
          myBookings = myBookings.map((b) => (b.id === id ? body.booking! : b));
          saveBookings();
        }
        render({ type: 'ok', text: strings.cancelOk });
        await loadSlots({ type: 'ok', text: strings.cancelOk });
      } catch {
        render({ type: 'err', text: strings.cancelFail });
      }
    });
  });

  bindSlotButtons(message);
}

function render(message?: { type: 'ok' | 'err'; text: string }) {
  const strings = t(lang);
  const locale = lang === 'ar' ? 'ar-SA' : 'en-GB';
  document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';

  app.innerHTML = `
    <div class="shell">
      <header class="hero">
        <div class="hero-brand">
          <img src="/favicon.svg" width="40" height="40" alt="" class="brand-mark" />
          <div>
            <h1>${strings.title}</h1>
            <p>${strings.subtitle}</p>
          </div>
        </div>
        <div class="toolbar">
          <span class="status-pill ${connected ? 'live' : ''}">
            <span class="dot"></span>
            ${connected ? strings.live : strings.offline}
          </span>
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" class="lang-opt ${lang === 'ar' ? 'active' : ''}" data-lang="ar">العربية</button>
            <button type="button" class="lang-opt ${lang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
          </div>
          <a class="btn btn-ghost btn-icon-link" href="http://localhost:3000/docs" target="_blank" rel="noreferrer">${strings.docs}</a>
        </div>
      </header>

      <div class="grid grid-main">
        <section class="panel card">
          <div class="panel-head">
            <h2>${strings.availableSlots}</h2>
            <button type="button" class="btn btn-ghost btn-sm ${slotsLoading ? 'is-loading' : ''}" id="refresh" ${slotsLoading ? 'disabled' : ''}>${strings.refresh}</button>
          </div>
          <div class="slots" id="slots-list">${renderSlotList(locale, strings)}</div>
        </section>

        <section class="panel card">
          <h2 class="panel-title">${selectedSlot ? strings.book : strings.myBookings}</h2>
          ${
            selectedSlot
              ? `<form id="book-form" class="book-form">
                  <div class="slot-preview-card">
                    <span class="preview-label">${strings.selectedSlot}</span>
                    <p>${formatRange(selectedSlot.startsAt, selectedSlot.endsAt, locale).date}</p>
                    <strong>${formatRange(selectedSlot.startsAt, selectedSlot.endsAt, locale).time}</strong>
                  </div>
                  <label>${strings.name}<input name="name" required autocomplete="name" /></label>
                  <label>${strings.email}<input name="email" type="email" required autocomplete="email" /></label>
                  <div class="form-actions">
                    <button type="button" class="btn btn-ghost" id="back">${strings.back}</button>
                    <button class="btn btn-primary ${submitting ? 'is-loading' : ''}" type="submit" ${submitting ? 'disabled' : ''}>${strings.submit}</button>
                  </div>
                </form>`
              : `<div id="my-bookings" class="booking-list">${renderMyBookings(strings)}</div>`
          }
          ${message ? `<div class="toast toast-enter ${message.type}" role="status">${message.text}</div>` : ''}
        </section>

        <aside class="panel card panel-events">
          <h2 class="panel-title">${strings.events}</h2>
          <p class="muted events-hint">${strings.eventsHint}</p>
          <div class="events">${renderEvents(strings)}</div>
        </aside>
      </div>

      <footer class="site-footer">
        <p class="footer-note">${strings.footer}</p>
        <p class="footer-credit">
          ${strings.builtBy}
          <a href="https://www.meetmirza.com/" target="_blank" rel="noopener noreferrer" class="footer-link">${strings.portfolio}</a>
        </p>
      </footer>
    </div>
  `;

  bindHandlers(message);
}

async function loadSlots(message?: { type: 'ok' | 'err'; text: string }) {
  slotsLoading = true;
  const list = document.getElementById('slots-list');
  const refreshBtn = document.getElementById('refresh');
  if (list) {
    list.innerHTML = shimmerSlots();
    refreshBtn?.classList.add('is-loading');
    refreshBtn?.setAttribute('disabled', 'true');
  } else {
    render(message);
  }

  try {
    cachedSlots = await fetchSlots();
    slotsLoading = false;
    render(message);
  } catch {
    slotsLoading = false;
    cachedSlots = [];
    render(message);
    const errList = document.getElementById('slots-list');
    if (errList) errList.innerHTML = `<p class="muted empty-state">${t(lang).bookingFail}</p>`;
  }
}

const socket = io({ path: '/socket.io' });

socket.on('connect', () => {
  connected = true;
  render();
});

socket.on('disconnect', () => {
  connected = false;
  render();
});

function pushEvent(
  kind: LiveEvent['kind'],
  payload: { slotId: string; bookingId: string; available: boolean },
) {
  eventLog.unshift({ kind, ...payload, at: new Date().toISOString() });
  if (eventLog.length > 15) eventLog.pop();
}

socket.on('slot.booked', (payload: { slotId: string; bookingId: string; available: boolean }) => {
  pushEvent('slot.booked', payload);
  render();
  void loadSlots();
});

socket.on('slot.released', (payload: { slotId: string; bookingId: string; available: boolean }) => {
  pushEvent('slot.released', payload);
  render();
  void loadSlots();
});

render();
void loadSlots();
