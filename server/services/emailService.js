/**
 * services/emailService.js
 * All transactional emails sent via Resend.
 * Brand colours: navy #1e3a5f, gold #c9a84c, bg #f8f6f0
 *
 * Every delegate-facing message is blind-copied to EMAIL_ARCHIVE_ADDRESS so the
 * communications desk holds the same copy the delegate received, and replies are
 * pointed there too — the sending domain is transactional-only.
 */

const FROM = process.env.RESEND_FROM_EMAIL || 'AMC 2027 Conference <conference@amcconference2027.org>';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'communications@africamethodistcouncil.org';
const ARCHIVE_EMAIL = process.env.EMAIL_ARCHIVE_ADDRESS || 'communications@africamethodistcouncil.org';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'communications@africamethodistcouncil.org';
const CONFERENCE_TZ = 'Africa/Harare';

// A placeholder key is worse than no key — it produces a live client that 401s
// on every send — so anything that isn't a real Resend key falls back to the stub.
const API_KEY = process.env.RESEND_API_KEY;
const HAS_REAL_KEY = typeof API_KEY === 'string' && API_KEY.startsWith('re_');

let resend;
if (HAS_REAL_KEY) {
  const { Resend } = require('resend');
  resend = new Resend(API_KEY);
} else {
  if (API_KEY) console.warn('[EmailService] RESEND_API_KEY is not a valid Resend key — falling back to console stub.');
  // Dummy mailer — logs email content to console instead of sending.
  resend = {
    emails: {
      send: async (payload) => {
        console.log('[EmailService STUB] Would send email:', {
          to: payload.to,
          bcc: payload.bcc,
          subject: payload.subject,
        });
        return { data: { id: 'stub-email-id' }, error: null };
      },
    },
  };
}

// ─── Send Wrapper ─────────────────────────────────────────────────────────────

/**
 * Single exit point for outbound mail. Applies the standing from/reply-to/BCC
 * policy and normalises Resend's `{ data, error }` shape into a thrown error, so
 * callers can rely on a rejected promise meaning "not delivered".
 *
 * @param {object}  opts
 * @param {string|string[]} opts.to
 * @param {string}  opts.subject
 * @param {string}  opts.html
 * @param {boolean} [opts.archive=true] — BCC the communications desk. Set false
 *   for mail already addressed to them, so they don't get two copies.
 */
async function send({ to, subject, html, archive = true }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) throw new Error('No recipient address for outbound email.');

  const payload = {
    from: FROM,
    to: recipients,
    reply_to: REPLY_TO,
    subject,
    html,
  };

  // Don't archive a copy back to the desk when they are already a recipient.
  if (archive && ARCHIVE_EMAIL && !recipients.includes(ARCHIVE_EMAIL)) {
    payload.bcc = [ARCHIVE_EMAIL];
  }

  const { data, error } = await resend.emails.send(payload);
  if (error) {
    const message = error.message || JSON.stringify(error);
    console.error('[EmailService] Send failed:', { to: recipients, subject, error: message });
    throw new Error(`Resend: ${message}`);
  }
  console.log('[EmailService] Sent:', { id: data?.id, to: recipients, subject });
  return data;
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

const money = (value, currency = 'USD') => `${currency} $${Number(value || 0).toFixed(2)}`;

function formatDate(value) {
  const at = value ? new Date(value) : new Date();
  if (Number.isNaN(at.getTime())) return '—';
  return at.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: CONFERENCE_TZ,
  });
}

function formatDateTime(value) {
  const at = value ? new Date(value) : new Date();
  if (Number.isNaN(at.getTime())) return '—';
  return `${at.toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: CONFERENCE_TZ,
  })} CAT`;
}

const fullNameOf = (r) => [r.designation, r.first_name, r.last_name].filter(Boolean).join(' ');

/**
 * What the registrant still owes. `balance_due` is the authoritative column, but
 * it is derived, so fall back to grand_total − amount_paid if it is missing.
 */
function balanceOf(registrant) {
  if (registrant.balance_due !== null && registrant.balance_due !== undefined) {
    return Math.max(0, Number(registrant.balance_due));
  }
  return Math.max(0, Number(registrant.grand_total || 0) - Number(registrant.amount_paid || 0));
}

// ─── HTML Layout Helpers ──────────────────────────────────────────────────────

function wrapEmail(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1e3a5f;padding:32px 40px;text-align:center;">
            <div style="color:#c9a84c;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Africa Methodist Council</div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">3rd General Conference 2027</div>
            <div style="color:#c9a84c;font-size:14px;margin-top:6px;">March 9–14, 2027 · Harare, Zimbabwe</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${bodyHtml}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#1e3a5f;padding:20px 40px;text-align:center;">
            <p style="color:#c9a84c;font-size:12px;margin:0;">© 2027 Africa Methodist Council · <a href="https://africamethodistcouncil.org" style="color:#c9a84c;">africamethodistcouncil.org</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function tableRow(label, value) {
  return `<tr>
    <td style="padding:8px 12px;background:#f8f6f0;font-weight:600;color:#1e3a5f;width:180px;border:1px solid #e8e4da;">${label}</td>
    <td style="padding:8px 12px;color:#1a1a1a;border:1px solid #e8e4da;">${value || '—'}</td>
  </tr>`;
}

function refBanner(ref, caption = 'Please save this reference number') {
  return `<div style="background:#c9a84c;border-radius:6px;padding:20px;text-align:center;margin-bottom:28px;">
      <div style="color:#1e3a5f;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Registration Reference</div>
      <div style="color:#1e3a5f;font-size:28px;font-weight:700;margin-top:6px;">${ref}</div>
      <div style="color:#1e3a5f;font-size:12px;margin-top:4px;">${caption}</div>
    </div>`;
}

function noticeBox(title, bodyHtml, accent = '#1e3a5f') {
  return `<div style="background:#f0f4f8;border-left:4px solid ${accent};padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;color:#1e3a5f;font-weight:600;">${title}</p>
      <div style="margin:8px 0 0;color:#555;font-size:14px;">${bodyHtml}</div>
    </div>`;
}

/** Money owed / settled block, shared by the registration and reminder emails. */
function balancePanel(registrant) {
  const balance = balanceOf(registrant);
  const settled = balance <= 0;

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      ${tableRow('Total due', money(registrant.grand_total))}
      ${tableRow('Amount received', money(registrant.amount_paid))}
      <tr>
        <td style="padding:10px 12px;background:${settled ? '#eaf7ee' : '#fdf1f1'};font-weight:700;color:#1e3a5f;width:180px;border:1px solid #e8e4da;">Outstanding balance</td>
        <td style="padding:10px 12px;font-weight:700;color:${settled ? '#15803d' : '#b91c1c'};border:1px solid #e8e4da;">${money(balance)}</td>
      </tr>
    </table>`;
}

function paymentInstructions(registrant) {
  return `You can pay online with EcoCash, Visa or Mastercard through Paynow, or arrange a bank transfer.
    Quote your reference <strong>${registrant.registration_ref}</strong> on any payment.
    <div style="margin-top:14px;">
      <a href="${process.env.CLIENT_URL || 'https://amcconference2027.org'}/register?ref=${encodeURIComponent(registrant.registration_ref)}"
         style="display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:6px;">
        Complete your payment
      </a>
    </div>`;
}

// ─── Email 1: Registration Received ──────────────────────────────────────────

/**
 * Sent on sign-up and re-sendable from the admin panel. The body branches on the
 * live balance, so a registrant who has already paid never receives a "payment
 * pending" notice from a re-send.
 */
async function sendRegistrationConfirmation(registrant) {
  const fullName = fullNameOf(registrant);
  const balance = balanceOf(registrant);
  const settled = balance <= 0;

  const html = wrapEmail('Registration Received – AMC 2027', `
    <h2 style="color:#1e3a5f;margin:0 0 8px;">Registration Received</h2>
    <p style="color:#555;margin:0 0 24px;">Thank you, ${fullName}. Your registration for the 3rd General Conference has been received.</p>

    ${refBanner(registrant.registration_ref)}

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      ${tableRow('Full Name', fullName)}
      ${tableRow('Email', registrant.email)}
      ${tableRow('Category', registrant.category)}
      ${tableRow('Office', registrant.office)}
      ${tableRow('Church', registrant.church)}
      ${tableRow('Country', registrant.country)}
      ${tableRow('Delegation size', registrant.num_people)}
      ${tableRow('Accommodation', registrant.accommodation ? `Yes (${registrant.accommodation_nights || 0} night${Number(registrant.accommodation_nights) !== 1 ? 's' : ''})` : 'No')}
      ${registrant.hotel_name ? tableRow('Preferred hotel', registrant.hotel_name) : ''}
      ${tableRow('Registered on', formatDate(registrant.created_at))}
    </table>

    <h3 style="color:#1e3a5f;margin:0 0 12px;font-size:16px;">Payment Summary</h3>
    ${balancePanel(registrant)}

    ${settled
      ? noticeBox('Payment received — your place is confirmed',
          'Your registration fee has been paid in full. No further action is needed. We look forward to welcoming you to Harare.',
          '#22c55e')
      : noticeBox('Pending payment — action required',
          `Your registration is <strong>not yet confirmed</strong>. An amount of <strong>${money(balance)}</strong> is still outstanding and your place is held only until payment is received.<br/><br/>${paymentInstructions(registrant)}`,
          '#c9a84c')}

    <p style="color:#777;font-size:13px;">Questions? Reply to this email or contact us at <a href="mailto:${REPLY_TO}" style="color:#1e3a5f;">${REPLY_TO}</a></p>
  `);

  return send({
    to: registrant.email,
    subject: `Registration Received – AMC 2027 Conference [${registrant.registration_ref}]`,
    html,
  });
}

// ─── Email 2: Payment Confirmed ───────────────────────────────────────────────

async function sendPaymentConfirmation(registrant, payment) {
  const fullName = fullNameOf(registrant);
  const balance = balanceOf(registrant);

  const html = wrapEmail('Payment Confirmed – AMC 2027', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#22c55e;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;color:#fff;">✓</div>
      <h2 style="color:#1e3a5f;margin:12px 0 4px;">Payment Confirmed!</h2>
      <p style="color:#555;margin:0;">Thank you, ${fullName}. Your payment has been received.</p>
    </div>

    ${refBanner(registrant.registration_ref, 'Present this reference at registration')}

    <h3 style="color:#1e3a5f;margin:0 0 12px;font-size:16px;">Payment Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      ${tableRow('Amount Paid', money(payment.amount, payment.currency))}
      ${tableRow('Payment Method', payment.payment_method)}
      ${tableRow('Payment Date', formatDateTime(payment.paid_at))}
      ${tableRow('Transaction Reference', payment.paynow_reference)}
      ${tableRow('Total due', money(registrant.grand_total))}
      ${tableRow('Amount received to date', money(registrant.amount_paid))}
      <tr>
        <td style="padding:10px 12px;background:${balance <= 0 ? '#eaf7ee' : '#fdf1f1'};font-weight:700;color:#1e3a5f;width:180px;border:1px solid #e8e4da;">Outstanding balance</td>
        <td style="padding:10px 12px;font-weight:700;color:${balance <= 0 ? '#15803d' : '#b91c1c'};border:1px solid #e8e4da;">${money(balance)}</td>
      </tr>
    </table>

    <h3 style="color:#1e3a5f;margin:0 0 12px;font-size:16px;">Registration</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      ${tableRow('Full Name', fullName)}
      ${tableRow('Category', registrant.category)}
      ${tableRow('Church', registrant.church)}
      ${tableRow('Country', registrant.country)}
      ${registrant.accommodation ? tableRow('Accommodation', `${registrant.accommodation_nights} night(s) – booked separately`) : ''}
      ${registrant.hotel_name ? tableRow('Preferred hotel', registrant.hotel_name) : ''}
    </table>

    ${balance > 0
      ? noticeBox('A balance remains',
          `We have recorded this payment, but <strong>${money(balance)}</strong> is still outstanding on your registration.<br/><br/>${paymentInstructions(registrant)}`,
          '#c9a84c')
      : noticeBox('Your registration is fully confirmed',
          'Your registration fee has been settled in full. Your place at the 3rd General Conference is secured.',
          '#22c55e')}

    ${noticeBox('What to Bring', `
      <ul style="margin:0;padding-left:20px;">
        <li>A copy of this confirmation email (digital or printed)</li>
        <li>Valid passport or national ID</li>
        <li>Your registration reference: <strong>${registrant.registration_ref}</strong></li>
      </ul>`, '#c9a84c')}

    ${noticeBox('Conference Venue',
      'Rainbow Towers Hotel &amp; Conference Centre<br/>Pennefather Avenue, Harare, Zimbabwe<br/>March 9–14, 2027')}

    <p style="color:#777;font-size:13px;">We look forward to welcoming you to Harare. For queries, contact <a href="mailto:${REPLY_TO}" style="color:#1e3a5f;">${REPLY_TO}</a></p>
  `);

  return send({
    to: registrant.email,
    subject: `Payment Confirmed – AMC 2027 Conference ✓ [${registrant.registration_ref}]`,
    html,
  });
}

// ─── Email 3: Outstanding Payment Reminder ───────────────────────────────────

/**
 * A standalone nudge for registrants still carrying a balance. Sent from the
 * admin panel's Email Actions, and by scripts/sendBackfillEmails.js.
 */
async function sendPaymentReminder(registrant) {
  const fullName = fullNameOf(registrant);
  const balance = balanceOf(registrant);

  const html = wrapEmail('Payment Outstanding – AMC 2027', `
    <h2 style="color:#1e3a5f;margin:0 0 8px;">Your Payment Is Still Outstanding</h2>
    <p style="color:#555;margin:0 0 24px;">Dear ${fullName}, our records show that your registration for the 3rd General Conference has not yet been paid for.</p>

    ${refBanner(registrant.registration_ref, 'Quote this reference on your payment')}

    ${balancePanel(registrant)}

    ${noticeBox('Please complete your payment',
      `Your place is <strong>held but not confirmed</strong> until the outstanding <strong>${money(balance)}</strong> is received.<br/><br/>${paymentInstructions(registrant)}`,
      '#c9a84c')}

    <p style="color:#777;font-size:13px;">If you have already paid, please ignore this message or reply with your proof of payment so we can update your record. Contact us at <a href="mailto:${REPLY_TO}" style="color:#1e3a5f;">${REPLY_TO}</a></p>
  `);

  return send({
    to: registrant.email,
    subject: `Payment Outstanding – AMC 2027 Conference [${registrant.registration_ref}]`,
    html,
  });
}

// ─── Email 4: Admin — New Registration Alert ──────────────────────────────────

async function sendAdminNewRegistrationNotification(registrant) {
  const fullName = fullNameOf(registrant);

  const html = wrapEmail('New Registration Alert', `
    <h2 style="color:#1e3a5f;margin:0 0 16px;">New Registration Submitted</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      ${tableRow('Reference', registrant.registration_ref)}
      ${tableRow('Full Name', fullName)}
      ${tableRow('Email', registrant.email)}
      ${tableRow('Phone', registrant.phone)}
      ${tableRow('Category', registrant.category)}
      ${tableRow('Office', registrant.office)}
      ${tableRow('Church', registrant.church)}
      ${tableRow('Country', registrant.country)}
      ${tableRow('Accommodation', registrant.accommodation ? 'Yes' : 'No')}
      ${tableRow('Delegation Size', registrant.num_people)}
      ${tableRow('Total due', money(registrant.grand_total))}
      ${tableRow('Outstanding balance', money(balanceOf(registrant)))}
      ${tableRow('Dietary Requirements', registrant.dietary_requirements)}
      ${tableRow('Special Requests', registrant.special_requests)}
      ${tableRow('Submitted', formatDateTime(registrant.created_at))}
    </table>
    <p style="color:#555;font-size:13px;">Payment status: <strong>${registrant.payment_status || 'pending'}</strong>. View the <a href="${process.env.CLIENT_URL}/admin/registrations" style="color:#1e3a5f;">admin dashboard</a> for details.</p>
  `);

  return send({
    to: ADMIN_EMAIL,
    archive: false, // already addressed to the desk
    subject: `[AMC Admin] New Registration: ${fullName} (${registrant.category}) – ${registrant.registration_ref}`,
    html,
  });
}

// ─── Email 5: Admin — Payment Received Alert ──────────────────────────────────

async function sendAdminPaymentNotification(registrant, payment) {
  const fullName = fullNameOf(registrant);

  const html = wrapEmail('Payment Received', `
    <h2 style="color:#1e3a5f;margin:0 0 16px;">Payment Received</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      ${tableRow('Reference', registrant.registration_ref)}
      ${tableRow('Name', fullName)}
      ${tableRow('Email', registrant.email)}
      ${tableRow('Category', registrant.category)}
      ${tableRow('Amount', money(payment.amount, payment.currency))}
      ${tableRow('Method', payment.payment_method)}
      ${tableRow('Paynow Ref', payment.paynow_reference)}
      ${tableRow('Paid At', formatDateTime(payment.paid_at))}
      ${tableRow('Total due', money(registrant.grand_total))}
      ${tableRow('Outstanding balance', money(balanceOf(registrant)))}
    </table>
    <p style="color:#555;font-size:13px;">Registration status is now <strong>${registrant.registration_status || 'confirmed'}</strong>. View the <a href="${process.env.CLIENT_URL}/admin/payments" style="color:#1e3a5f;">payments dashboard</a>.</p>
  `);

  return send({
    to: ADMIN_EMAIL,
    archive: false, // already addressed to the desk
    subject: `[AMC Admin] Payment Received: ${fullName} – ${money(payment.amount, payment.currency)} – ${registrant.registration_ref}`,
    html,
  });
}

module.exports = {
  sendRegistrationConfirmation,
  sendPaymentConfirmation,
  sendPaymentReminder,
  sendAdminNewRegistrationNotification,
  sendAdminPaymentNotification,
  // exported for diagnostics / scripts
  config: { FROM, ADMIN_EMAIL, ARCHIVE_EMAIL, REPLY_TO, live: HAS_REAL_KEY },
};
