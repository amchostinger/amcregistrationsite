/**
 * services/pdfService.js
 * PDF generation for registration records, payment receipts and bulk reports.
 *
 * Every builder returns a Promise<Buffer> rather than streaming straight to the
 * response, so a failure mid-document surfaces as a normal 500 instead of a
 * truncated file the browser has already started downloading.
 *
 * Brand colours: navy #1e3a5f, gold #c9a84c, parchment #f8f6f0
 */

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const NAVY = '#1e3a5f';
const GOLD = '#c9a84c';
const PARCHMENT = '#f8f6f0';
const RULE = '#e8e4da';
const MUTED = '#6b7280';
const DANGER = '#b91c1c';
const SUCCESS = '#15803d';

const CONFERENCE_TZ = 'Africa/Harare';
const LOGO_PATH = path.join(__dirname, '../../client/public/images/amc-logo.png');
const LOGO = fs.existsSync(LOGO_PATH) ? LOGO_PATH : null;

const MARGIN = 48;

// ─── Formatting ───────────────────────────────────────────────────────────────

const money = (value, currency = 'USD') => `${currency} $${Number(value || 0).toFixed(2)}`;

/** Currency-free amount for narrow table columns that carry their own Cur header. */
const amount = (value) => `$${Number(value || 0).toFixed(2)}`;

function formatDate(value) {
  if (!value) return '—';
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: CONFERENCE_TZ,
  });
}

function formatDateTime(value) {
  if (!value) return '—';
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return '—';
  return `${at.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: CONFERENCE_TZ,
  })} CAT`;
}

const fullNameOf = (r) => [r.designation, r.first_name, r.last_name].filter(Boolean).join(' ');

function balanceOf(registrant) {
  if (registrant.balance_due !== null && registrant.balance_due !== undefined) {
    return Math.max(0, Number(registrant.balance_due));
  }
  return Math.max(0, Number(registrant.grand_total || 0) - Number(registrant.amount_paid || 0));
}

function parseDelegates(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Document Primitives ──────────────────────────────────────────────────────

function createDoc({ landscape = false, title } = {}) {
  return new PDFDocument({
    size: 'A4',
    layout: landscape ? 'landscape' : 'portrait',
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: title || 'AMC 2027 Conference',
      Author: 'Africa Methodist Council',
      Creator: 'AMC 2027 Conference Registration System',
    },
  });
}

function finish(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

/** Navy masthead band. Returns the y coordinate just below it. */
function header(doc, { title, subtitle }) {
  const width = doc.page.width;
  const bandHeight = 96;

  doc.rect(0, 0, width, bandHeight).fill(NAVY);

  let textLeft = MARGIN;
  if (LOGO) {
    try {
      doc.image(LOGO, MARGIN, 22, { fit: [52, 52] });
      textLeft = MARGIN + 66;
    } catch {
      // A broken logo file must never take the whole document down.
    }
  }

  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(8)
    .text('AFRICA METHODIST COUNCIL', textLeft, 26, { characterSpacing: 2 });
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15)
    .text(title, textLeft, 40, { width: width - textLeft - MARGIN });
  doc.fillColor(GOLD).font('Helvetica').fontSize(9)
    .text(subtitle || '3rd General Conference · March 9–14, 2027 · Harare, Zimbabwe', textLeft, 62, {
      width: width - textLeft - MARGIN,
    });

  doc.y = bandHeight + 26;
  doc.x = MARGIN;
  return doc.y;
}

/** Gold reference plaque used on the single-record documents. */
function refPlaque(doc, label, value, note) {
  const width = doc.page.width - MARGIN * 2;
  const top = doc.y;
  const height = note ? 62 : 50;

  doc.roundedRect(MARGIN, top, width, height, 5).fill(GOLD);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8)
    .text(label.toUpperCase(), MARGIN, top + 10, { width, align: 'center', characterSpacing: 1.5 });
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(19)
    .text(value, MARGIN, top + 23, { width, align: 'center' });
  if (note) {
    doc.font('Helvetica').fontSize(8)
      .text(note, MARGIN, top + 46, { width, align: 'center' });
  }

  doc.y = top + height + 22;
  doc.x = MARGIN;
}

function sectionTitle(doc, text) {
  ensureSpace(doc, 42);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(text, MARGIN, doc.y);
  doc.moveDown(0.3);
  const y = doc.y;
  doc.moveTo(MARGIN, y).lineTo(doc.page.width - MARGIN, y).lineWidth(1).strokeColor(GOLD).stroke();
  doc.y = y + 10;
  doc.x = MARGIN;
}

/** Break to a new page when fewer than `needed` points remain in the body. */
function ensureSpace(doc, needed) {
  const bottom = doc.page.height - MARGIN - 24; // leave room for the footer
  if (doc.y + needed > bottom) {
    doc.addPage();
    doc.y = MARGIN;
    doc.x = MARGIN;
    return true;
  }
  return false;
}

/**
 * Label/value rows. Rows are measured before drawing so a long value wraps
 * inside its own striped band instead of overlapping the next row.
 */
function detailRows(doc, rows, opts = {}) {
  const labelWidth = opts.labelWidth || 150;
  const width = doc.page.width - MARGIN * 2;
  const valueWidth = width - labelWidth - 24;

  rows.filter(([, value]) => value !== undefined && value !== null && value !== '')
    .forEach(([label, value, tone]) => {
      const text = String(value);
      const textHeight = doc.font('Helvetica').fontSize(9).heightOfString(text, { width: valueWidth });
      const rowHeight = Math.max(22, textHeight + 12);

      ensureSpace(doc, rowHeight);
      const top = doc.y;

      doc.rect(MARGIN, top, labelWidth, rowHeight).fill(PARCHMENT);
      doc.rect(MARGIN, top, width, rowHeight).lineWidth(0.5).strokeColor(RULE).stroke();
      doc.moveTo(MARGIN + labelWidth, top).lineTo(MARGIN + labelWidth, top + rowHeight)
        .lineWidth(0.5).strokeColor(RULE).stroke();

      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
        .text(label, MARGIN + 8, top + 6, { width: labelWidth - 16 });
      doc.fillColor(tone || '#1a1a1a').font(tone ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
        .text(text, MARGIN + labelWidth + 10, top + 6, { width: valueWidth });

      doc.y = top + rowHeight;
      doc.x = MARGIN;
    });

  doc.moveDown(1);
}

function calloutBox(doc, title, body, accent = NAVY) {
  const width = doc.page.width - MARGIN * 2;
  const innerWidth = width - 32;
  const titleHeight = doc.font('Helvetica-Bold').fontSize(10).heightOfString(title, { width: innerWidth });
  const bodyHeight = doc.font('Helvetica').fontSize(9).heightOfString(body, { width: innerWidth });
  const height = titleHeight + bodyHeight + 26;

  ensureSpace(doc, height + 14);
  const top = doc.y;

  doc.rect(MARGIN, top, width, height).fill('#f0f4f8');
  doc.rect(MARGIN, top, 4, height).fill(accent);
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10)
    .text(title, MARGIN + 16, top + 9, { width: innerWidth });
  doc.fillColor('#444').font('Helvetica').fontSize(9)
    .text(body, MARGIN + 16, top + 11 + titleHeight, { width: innerWidth });

  doc.y = top + height + 16;
  doc.x = MARGIN;
}

/**
 * Simple column table for the bulk reports.
 *
 * Declared widths are scaled to the printable width before anything is drawn.
 * Without that, a column set totalling more than the page allows runs silently
 * off the right edge and the last columns are simply invisible in the PDF.
 *
 * @param {Array<{label:string,width:number,key:string,align?:string,format?:Function}>} columns
 */
function dataTable(doc, declaredColumns, rows) {
  const startX = MARGIN;
  const rowPadding = 6;

  const available = doc.page.width - MARGIN * 2;
  const declared = declaredColumns.reduce((s, c) => s + c.width, 0);
  const scale = declared > available ? available / declared : 1;
  const columns = scale === 1
    ? declaredColumns
    : declaredColumns.map((c) => ({ ...c, width: c.width * scale }));

  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  const drawHead = () => {
    const top = doc.y;
    doc.rect(startX, top, totalWidth, 20).fill(NAVY);
    let x = startX;
    columns.forEach((col) => {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5)
        .text(col.label.toUpperCase(), x + 5, top + 6.5, { width: col.width - 10, align: col.align || 'left', lineBreak: false });
      x += col.width;
    });
    doc.y = top + 20;
    doc.x = startX;
  };

  drawHead();

  rows.forEach((row, index) => {
    const cells = columns.map((col) => {
      const raw = col.format ? col.format(row) : row[col.key];
      return raw === null || raw === undefined || raw === '' ? '—' : String(raw);
    });

    // `nowrap` columns hold short atomic values — statuses, dates, amounts —
    // that read as damaged when split ("PENDIN/G"), so they never contribute
    // wrapped height and are drawn on a single line.
    const height = Math.max(18, ...cells.map((text, i) => (columns[i].nowrap
      ? 18
      : doc.font('Helvetica').fontSize(8).heightOfString(text, { width: columns[i].width - 10 }) + rowPadding * 2)));

    if (ensureSpace(doc, height)) drawHead();

    const top = doc.y;
    if (index % 2 === 1) doc.rect(startX, top, totalWidth, height).fill(PARCHMENT);
    doc.moveTo(startX, top + height).lineTo(startX + totalWidth, top + height)
      .lineWidth(0.5).strokeColor(RULE).stroke();

    let x = startX;
    columns.forEach((col, i) => {
      doc.fillColor(col.tone ? col.tone(row) : '#1a1a1a').font('Helvetica').fontSize(8)
        .text(cells[i], x + 5, top + rowPadding, {
          width: col.width - 10,
          align: col.align || 'left',
          lineBreak: !col.nowrap,
        });
      x += col.width;
    });

    doc.y = top + height;
    doc.x = startX;
  });
}

/**
 * Footer + page numbers. Called once, after all content, so the total page
 * count is known — bufferPages keeps the earlier pages editable until then.
 */
function paginate(doc, label) {
  const range = doc.bufferedPageRange();
  const generated = formatDateTime(new Date());

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);

    // The footer deliberately sits inside the bottom margin. pdfkit treats any
    // text crossing that margin as overflow and silently appends a fresh page —
    // which would add one blank page per real page — so the margin is dropped
    // for the duration of the write and restored immediately after.
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const y = doc.page.height - MARGIN + 4;
    doc.moveTo(MARGIN, y - 8).lineTo(doc.page.width - MARGIN, y - 8)
      .lineWidth(0.5).strokeColor(RULE).stroke();
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
      .text(`${label} · Generated ${generated}`, MARGIN, y, {
        width: doc.page.width - MARGIN * 2,
        align: 'left',
        lineBreak: false,
      });
    doc.fillColor(MUTED).font('Helvetica').fontSize(7.5)
      .text(`Page ${i - range.start + 1} of ${range.count}`, MARGIN, y, {
        width: doc.page.width - MARGIN * 2,
        align: 'right',
        lineBreak: false,
      });

    doc.page.margins.bottom = bottomMargin;
  }
}

// ─── Shared Record Blocks ─────────────────────────────────────────────────────

function registrationBody(doc, registrant, payments = []) {
  const balance = balanceOf(registrant);
  const settled = balance <= 0;

  refPlaque(doc, 'Registration Reference', registrant.registration_ref,
    settled ? 'Paid in full — confirmed' : `Outstanding balance ${money(balance)}`);

  sectionTitle(doc, 'Registrant Details');
  detailRows(doc, [
    ['Full Name', fullNameOf(registrant)],
    ['Email', registrant.email],
    ['Phone', registrant.phone],
    ['Category', registrant.category],
    ['Office', registrant.office],
    ['Church', registrant.church],
    ['Country', registrant.country],
    ['Delegation Size', registrant.num_people],
    ['Registered On', formatDateTime(registrant.created_at)],
    ['Registration Status', String(registrant.registration_status || '').toUpperCase(),
      registrant.registration_status === 'confirmed' ? SUCCESS : undefined],
    ['Payment Status', String(registrant.payment_status || '').toUpperCase(),
      registrant.payment_status === 'paid' ? SUCCESS : DANGER],
  ]);

  if (registrant.accommodation) {
    sectionTitle(doc, 'Accommodation');
    detailRows(doc, [
      ['Nights', registrant.accommodation_nights],
      ['Preferred Hotel', registrant.hotel_name || 'Self-arranged'],
      ['Room Type', registrant.hotel_room_type],
      ['Rooms', registrant.hotel_rooms],
      ['Rate per Night', registrant.hotel_price_usd ? money(registrant.hotel_price_usd) : null],
    ]);
  }

  sectionTitle(doc, 'Financial Summary');
  detailRows(doc, [
    ['Conference Total', money(registrant.conference_total)],
    ['Hotel Total', money(registrant.hotel_total)],
    ['Grand Total', money(registrant.grand_total)],
    ['Amount Paid', money(registrant.amount_paid)],
    ['Balance Due', money(balance), settled ? SUCCESS : DANGER],
  ]);

  const delegates = parseDelegates(registrant.delegate_details);
  if (delegates.length) {
    sectionTitle(doc, 'Additional Delegates');
    delegates.forEach((delegate, index) => {
      ensureSpace(doc, 40);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
        .text(`Delegate ${index + 2}`, MARGIN, doc.y);
      doc.moveDown(0.4);
      detailRows(doc, [
        ['Name', [delegate.designation, delegate.first_name, delegate.last_name].filter(Boolean).join(' ')],
        ['Email', delegate.email],
        ['Phone', delegate.phone],
        ['Category', delegate.category],
        ['Office', delegate.office],
        ['Church', delegate.church],
        ['Country', delegate.country],
      ]);
    });
  }

  if (registrant.dietary_requirements || registrant.special_requests) {
    sectionTitle(doc, 'Requirements & Requests');
    detailRows(doc, [
      ['Dietary Requirements', registrant.dietary_requirements],
      ['Special Requests', registrant.special_requests],
    ]);
  }

  sectionTitle(doc, 'Payment History');
  if (!payments.length) {
    doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(9)
      .text('No payment records on file.', MARGIN, doc.y);
    doc.moveDown(1.2);
  } else {
    dataTable(doc, [
      { label: 'Date', width: 110, format: (p) => formatDate(p.paid_at || p.created_at) },
      { label: 'Method', width: 80, format: (p) => p.payment_method },
      { label: 'Reference', width: 175, format: (p) => p.paynow_reference },
      { label: 'Status', width: 70, format: (p) => String(p.status || '').toUpperCase(),
        tone: (p) => (p.status === 'paid' ? SUCCESS : DANGER) },
      { label: 'Amount', width: 64, align: 'right', format: (p) => money(p.amount, p.currency) },
    ], payments);
    doc.moveDown(1.2);
  }

  calloutBox(doc,
    settled ? 'Registration Confirmed' : 'Payment Outstanding',
    settled
      ? `This registration has been paid in full. Present reference ${registrant.registration_ref} together with a valid passport or national ID at the conference registration desk.\n\nVenue: Rainbow Towers Hotel & Conference Centre, Pennefather Avenue, Harare, Zimbabwe.`
      : `An amount of ${money(balance)} remains outstanding on this registration. The delegate's place is held but not confirmed until payment is received. Payment can be made online via Paynow (EcoCash, Visa, Mastercard) or by bank transfer, quoting reference ${registrant.registration_ref}.`,
    settled ? SUCCESS : GOLD);
}

// ─── Public Builders ──────────────────────────────────────────────────────────

/** One-page (or more) record for a single registration. */
async function buildRegistrationPdf(registrant, payments = []) {
  const doc = createDoc({ title: `Registration ${registrant.registration_ref}` });
  header(doc, { title: 'Registration Record' });
  registrationBody(doc, registrant, payments);
  paginate(doc, `Registration ${registrant.registration_ref}`);
  return finish(doc);
}

/** Receipt for a single payment row, with the registrant it belongs to. */
async function buildPaymentPdf(payment, registrant) {
  const doc = createDoc({ title: `Payment ${payment.paynow_reference || payment.id}` });
  const isPaid = payment.status === 'paid';

  header(doc, { title: isPaid ? 'Official Payment Receipt' : 'Payment Record' });

  refPlaque(doc, isPaid ? 'Amount Received' : 'Amount Due',
    money(payment.amount, payment.currency),
    `Registration ${registrant.registration_ref} · ${String(payment.status || '').toUpperCase()}`);

  sectionTitle(doc, 'Payment Details');
  detailRows(doc, [
    ['Receipt Number', `AMC-RCPT-${String(payment.id).padStart(6, '0')}`],
    ['Transaction Reference', payment.paynow_reference],
    ['Amount', money(payment.amount, payment.currency)],
    ['Currency', payment.currency],
    ['Payment Method', payment.payment_method],
    ['Status', String(payment.status || '').toUpperCase(), isPaid ? SUCCESS : DANGER],
    ['Gateway Status', payment.paynow_status_raw],
    ['Initiated', formatDateTime(payment.created_at)],
    ['Paid At', payment.paid_at ? formatDateTime(payment.paid_at) : 'Not yet paid'],
  ]);

  sectionTitle(doc, 'Paid By');
  detailRows(doc, [
    ['Registration Reference', registrant.registration_ref],
    ['Full Name', fullNameOf(registrant)],
    ['Email', registrant.email],
    ['Phone', registrant.phone],
    ['Category', registrant.category],
    ['Church', registrant.church],
    ['Country', registrant.country],
  ]);

  sectionTitle(doc, 'Account Position');
  const balance = balanceOf(registrant);
  detailRows(doc, [
    ['Grand Total', money(registrant.grand_total)],
    ['Total Received', money(registrant.amount_paid)],
    ['Balance Due', money(balance), balance <= 0 ? SUCCESS : DANGER],
  ]);

  calloutBox(doc,
    isPaid ? 'Receipt Acknowledgement' : 'Payment Not Yet Settled',
    isPaid
      ? `Received with thanks the sum of ${money(payment.amount, payment.currency)} from ${fullNameOf(registrant)} in respect of registration ${registrant.registration_ref} for the Africa Methodist Council 3rd General Conference 2027.\n\nThis is a computer-generated receipt and is valid without a signature.`
      : `This payment has the status "${payment.status}" and has not been settled. It does not constitute a receipt. Outstanding balance on the registration is ${money(balance)}.`,
    isPaid ? SUCCESS : GOLD);

  paginate(doc, `Payment receipt · ${registrant.registration_ref}`);
  return finish(doc);
}

/**
 * Bulk registrations report: summary page followed by the full listing, and
 * optionally a detailed record per registrant.
 *
 * @param {Array}  registrations
 * @param {object} [opts]
 * @param {string} [opts.filterSummary] — human description of the active filters
 * @param {boolean}[opts.detailed=false] — append a full page per registrant
 */
async function buildRegistrationsReportPdf(registrations, opts = {}) {
  const { filterSummary, detailed = false } = opts;
  const doc = createDoc({ landscape: true, title: 'AMC 2027 Registrations Report' });

  header(doc, { title: 'Registrations Report' });

  const totals = registrations.reduce((acc, r) => ({
    grand: acc.grand + Number(r.grand_total || 0),
    paid: acc.paid + Number(r.amount_paid || 0),
    balance: acc.balance + balanceOf(r),
    confirmed: acc.confirmed + (r.registration_status === 'confirmed' ? 1 : 0),
    settled: acc.settled + (r.payment_status === 'paid' ? 1 : 0),
  }), { grand: 0, paid: 0, balance: 0, confirmed: 0, settled: 0 });

  sectionTitle(doc, 'Summary');
  detailRows(doc, [
    ['Records in report', registrations.length],
    ['Filters applied', filterSummary || 'None — all registrations'],
    ['Confirmed registrations', totals.confirmed],
    ['Fully paid registrations', totals.settled],
    ['Total expected', money(totals.grand)],
    ['Total received', money(totals.paid), SUCCESS],
    ['Total outstanding', money(totals.balance), totals.balance > 0 ? DANGER : SUCCESS],
  ], { labelWidth: 190 });

  // Widths total the 746pt printable width of landscape A4 at these margins.
  sectionTitle(doc, 'Registrations');
  dataTable(doc, [
    { label: 'Ref', width: 82, key: 'registration_ref', nowrap: true },
    { label: 'Name', width: 118, format: (r) => fullNameOf(r) },
    { label: 'Email', width: 138, key: 'email' },
    { label: 'Category', width: 60, key: 'category', nowrap: true },
    { label: 'Country', width: 66, key: 'country' },
    // 'CONFIRMED' measures 48pt at 8pt Helvetica; these carry it plus padding.
    { label: 'Reg.', width: 66, nowrap: true, format: (r) => String(r.registration_status || '').toUpperCase(),
      tone: (r) => (r.registration_status === 'confirmed' ? SUCCESS : MUTED) },
    { label: 'Pay', width: 54, nowrap: true, format: (r) => String(r.payment_status || '').toUpperCase(),
      tone: (r) => (r.payment_status === 'paid' ? SUCCESS : DANGER) },
    { label: 'Total', width: 52, align: 'right', nowrap: true, format: (r) => amount(r.grand_total) },
    { label: 'Paid', width: 52, align: 'right', nowrap: true, format: (r) => amount(r.amount_paid) },
    { label: 'Balance', width: 56, align: 'right', nowrap: true, format: (r) => amount(balanceOf(r)),
      tone: (r) => (balanceOf(r) > 0 ? DANGER : SUCCESS) },
  ], registrations);

  if (detailed) {
    registrations.forEach((registrant) => {
      doc.addPage({ size: 'A4', layout: 'portrait', margin: MARGIN });
      header(doc, { title: 'Registration Record' });
      registrationBody(doc, registrant, registrant.payments || []);
    });
  }

  paginate(doc, `AMC 2027 registrations · ${registrations.length} record${registrations.length === 1 ? '' : 's'}`);
  return finish(doc);
}

/** Bulk payments report: summary page followed by the full listing. */
async function buildPaymentsReportPdf(payments, opts = {}) {
  const { filterSummary } = opts;
  const doc = createDoc({ landscape: true, title: 'AMC 2027 Payments Report' });

  header(doc, { title: 'Payments Report' });

  // One row per registration, so these totals reconcile with the registrations
  // report. Rows with status 'unpaid' carry no payment record at all.
  const totals = payments.reduce((acc, p) => {
    const value = Number(p.amount || 0);
    return {
      received: acc.received + (p.status === 'paid' ? value : 0),
      outstanding: acc.outstanding + balanceOf(p),
      paidCount: acc.paidCount + (p.status === 'paid' ? 1 : 0),
      awaiting: acc.awaiting + (p.status === 'paid' ? 0 : 1),
      neverStarted: acc.neverStarted + (p.status === 'unpaid' ? 1 : 0),
    };
  }, { received: 0, outstanding: 0, paidCount: 0, awaiting: 0, neverStarted: 0 });

  sectionTitle(doc, 'Summary');
  detailRows(doc, [
    ['Registrations in report', payments.length],
    ['Filters applied', filterSummary || 'None — all registrations'],
    ['Settled in full', totals.paidCount, SUCCESS],
    ['Awaiting payment', totals.awaiting, totals.awaiting > 0 ? DANGER : SUCCESS],
    ['— of which never started a payment', totals.neverStarted],
    ['Value received', money(totals.received), SUCCESS],
    ['Value outstanding', money(totals.outstanding), totals.outstanding > 0 ? DANGER : SUCCESS],
  ], { labelWidth: 190 });

  sectionTitle(doc, 'Payments by Registration');
  dataTable(doc, [
    { label: 'Date', width: 74, nowrap: true, format: (p) => formatDate(p.activity_at || p.paid_at || p.created_at) },
    { label: 'Ref', width: 80, key: 'registration_ref', nowrap: true },
    { label: 'Name', width: 116, format: (p) => fullNameOf(p) },
    { label: 'Category', width: 58, key: 'category', nowrap: true },
    { label: 'Transaction Reference', width: 132, key: 'paynow_reference' },
    { label: 'Method', width: 56, key: 'payment_method', nowrap: true },
    // 'CANCELLED' measures 48pt at 8pt Helvetica; this carries it plus padding.
    { label: 'Status', width: 62, nowrap: true, format: (p) => String(p.status || '').toUpperCase(),
      tone: (p) => (p.status === 'paid' ? SUCCESS : DANGER) },
    { label: 'Paid', width: 56, align: 'right', nowrap: true,
      format: (p) => (p.status === 'paid' ? amount(p.amount) : amount(0)) },
    { label: 'Balance', width: 58, align: 'right', nowrap: true, format: (p) => amount(balanceOf(p)),
      tone: (p) => (balanceOf(p) > 0 ? DANGER : SUCCESS) },
  ], payments);

  paginate(doc, `AMC 2027 payments · ${payments.length} record${payments.length === 1 ? '' : 's'}`);
  return finish(doc);
}

module.exports = {
  buildRegistrationPdf,
  buildPaymentPdf,
  buildRegistrationsReportPdf,
  buildPaymentsReportPdf,
};
