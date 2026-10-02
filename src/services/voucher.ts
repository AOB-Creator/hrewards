import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Booking, Hotel, Locale, RoomType } from '@/domain/types';
import { translate } from '@/i18n';

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Generates the booking voucher PDF (TZ 5.2) and opens the share sheet. */
export async function shareVoucher(b: Booking, hotel: Hotel, room: RoomType, locale: Locale, money: (n: number) => string) {
  const t = (k: string, p?: Record<string, string | number>) => translate(locale, k, p);
  const rows: [string, string][] = [
    [t('book.number'), b.number],
    [t('bk.guest'), `${b.guest.firstName} ${b.guest.lastName} · ${b.guest.phone}`],
    [t('search.checkIn'), `${b.checkIn} · ${hotel.checkInTime}`],
    [t('search.checkOut'), `${b.checkOut} · ${hotel.checkOutTime}`],
    [t('bk.room'), `${room.name[locale]} × ${b.rooms}`],
    [t('common.guests'), t('bk.guests', { a: b.adults, c: b.children })],
    [t('book.total'), money(b.price.total)],
    [t('bk.paid'), money(b.paid)],
    [t('book.dueAtHotel'), money(Math.max(0, b.price.total - b.paid))],
  ];
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#121212;padding:36px}
    .brand{font-size:22px;font-weight:600;letter-spacing:-.5px}
    h1{font-size:26px;font-weight:500;margin:28px 0 4px}
    .muted{color:#8B8B90}
    table{width:100%;border-collapse:collapse;margin-top:24px}
    td{padding:12px 0;border-bottom:1px solid #E6E6E8;font-size:14px}
    td:last-child{text-align:right}
    .status{display:inline-block;padding:6px 12px;border-radius:99px;background:#121212;color:#fff;font-size:12px;margin-top:12px}
    .foot{margin-top:28px;font-size:12px}
  </style></head><body>
  <div class="brand">ESCAPE°</div>
  <h1>${esc(hotel.name)}</h1>
  <div class="muted">${esc(hotel.address[locale])} · ${esc(hotel.phone)}</div>
  <div class="status">${esc(t(`status.${b.status}`))}</div>
  <table>${rows.map(([k, v]) => `<tr><td class="muted">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
  ${b.guest.specialRequests ? `<p class="foot"><b>${esc(t('book.requests'))}:</b> ${esc(b.guest.specialRequests)}</p>` : ''}
  <p class="foot muted">${esc(t('book.successBody'))}</p>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: b.number });
  }
}
