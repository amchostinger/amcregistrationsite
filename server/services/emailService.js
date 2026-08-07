/**
 * services/emailService.js
 * All transactional emails sent via Resend.
 * Brand colours: navy #1e3a5f, gold #c9a84c, bg #f8f6f0
 */

const FROM = process.env.RESEND_FROM_EMAIL || 'conference@africamethodistcouncil.org';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'genesec@africamethodistcouncil.org';

// Use real Resend only when an API key is configured; otherwise use a console stub.
let resend;
if (process.env.RESEND_API_KEY) {
  const { Resend } = require('resend');
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  // Dummy mailer — logs email content to console instead of sending.
  resend = {
    emails: {
      send: async (payload) => {
        console.log('[EmailService STUB] Would send email:', {
          to: payload.to,
          subject: payload.subject,
        });
        return { data: { id: 'stub-email-id' }, error: null };
      },
    },
  };
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

// ─── Email 1: Registration Received ──────────────────────────────────────────

async function sendRegistrationConfirmation(registrant) {
  const fullName = `${registrant.designation} ${registrant.first_name} ${registrant.last_name}`;

  const html = wrapEmail('Registration Received – AMC 2027', `
    <h2 style="color:#1e3a5f;margin:0 0 8px;">Registration Received</h2>
    <p style="color:#555;margin:0 0 24px;">Thank you, your registration has been received and is being processed.</p>

    <div style="background:#c9a84c;border-radius:6px;padding:20px;text-align:center;margin-bottom:28px;">
      <div style="color:#1e3a5f;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Your Registration Reference</div>
      <div style="color:#1e3a5f;font-size:28px;font-weight:700;margin-top:6px;">${registrant.registration_ref}</div>
      <div style="color:#1e3a5f;font-size:12px;margin-top:4px;">Please save this reference number</div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      ${tableRow('Full Name', fullName)}
      ${tableRow('Email', registrant.email)}
      ${tableRow('Category', registrant.category)}
      ${tableRow('Office', registrant.office)}
      ${tableRow('Church', registrant.church)}
      ${tableRow('Country', registrant.country)}
      ${tableRow('Accommodation', registrant.accommodation ? `Yes (${registrant.accommodation_nights || 0} night${registrant.accommodation_nights !== 1 ? 's' : ''})` : 'No')}
      ${registrant.hotel_name ? tableRow('Preferred hotel', registrant.hotel_name) : ''}
      ${registrant.hotel_website_url ? tableRow('Hotel website', registrant.hotel_website_url) : ''}
    </table>

    <div style="background:#f0f4f8;border-left:4px solid #1e3a5f;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;color:#1e3a5f;font-weight:600;">Next Step: Complete Payment</p>
      <p style="margin:8px 0 0;color:#555;font-size:14px;">Your registration will be confirmed once payment is received. Please proceed to pay using your registration reference.</p>
    </div>

    <p style="color:#777;font-size:13px;">If you have any questions, contact us at <a href="mailto:${FROM}" style="color:#1e3a5f;">${FROM}</a></p>
  `);

  return resend.emails.send({
    from: FROM,
    to: registrant.email,
    subject: `Registration Received – AMC 2027 Conference [${registrant.registration_ref}]`,
    html,
  });
}

// ─── Email 2: Payment Confirmed ───────────────────────────────────────────────

async function sendPaymentConfirmation(registrant, payment) {
  const fullName = `${registrant.designation} ${registrant.first_name} ${registrant.last_name}`;

  const html = wrapEmail('Payment Confirmed – AMC 2027', `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#22c55e;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;color:#fff;">✓</div>
      <h2 style="color:#1e3a5f;margin:12px 0 4px;">Payment Confirmed!</h2>
      <p style="color:#555;margin:0;">Your registration for AMC 2027 is now fully confirmed.</p>
    </div>

    <div style="background:#c9a84c;border-radius:6px;padding:20px;text-align:center;margin-bottom:28px;">
      <div style="color:#1e3a5f;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Booking Reference</div>
      <div style="color:#1e3a5f;font-size:28px;font-weight:700;margin-top:6px;">${registrant.registration_ref}</div>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      ${tableRow('Full Name', fullName)}
      ${tableRow('Category', registrant.category)}
      ${tableRow('Church', registrant.church)}
      ${tableRow('Country', registrant.country)}
      ${tableRow('Amount Paid', `$${Number(payment.amount).toFixed(2)} ${payment.currency}`)}
      ${tableRow('Payment Method', payment.payment_method)}
      ${tableRow('Payment Date', new Date(payment.paid_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}
      ${registrant.accommodation ? tableRow('Accommodation', `${registrant.accommodation_nights} night(s) – booked separately`) : ''}
      ${registrant.hotel_name ? tableRow('Preferred hotel', registrant.hotel_name) : ''}
      ${registrant.hotel_website_url ? tableRow('Hotel website', registrant.hotel_website_url) : ''}
    </table>

    <div style="background:#f0f4f8;border-left:4px solid #c9a84c;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;color:#1e3a5f;font-weight:600;">What to Bring</p>
      <ul style="margin:8px 0 0;padding-left:20px;color:#555;font-size:14px;">
        <li>A copy of this confirmation email (digital or printed)</li>
        <li>Valid passport or national ID</li>
        <li>Your registration reference: <strong>${registrant.registration_ref}</strong></li>
      </ul>
    </div>

    <div style="background:#f0f4f8;border-left:4px solid #1e3a5f;padding:16px;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;color:#1e3a5f;font-weight:600;">Conference Venue</p>
      <p style="margin:8px 0 0;color:#555;font-size:14px;">Rainbow Towers Hotel & Conference Centre<br/>Pennefather Avenue, Harare, Zimbabwe<br/>March 9–14, 2027</p>
    </div>

    <p style="color:#777;font-size:13px;">We look forward to welcoming you to Harare. For queries, contact <a href="mailto:${FROM}" style="color:#1e3a5f;">${FROM}</a></p>
  `);

  return resend.emails.send({
    from: FROM,
    to: registrant.email,
    subject: `Payment Confirmed – AMC 2027 Conference ✓ [${registrant.registration_ref}]`,
    html,
  });
}

// ─── Email 3: Admin — New Registration Alert ──────────────────────────────────

async function sendAdminNewRegistrationNotification(registrant) {
  const fullName = `${registrant.designation} ${registrant.first_name} ${registrant.last_name}`;

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
      ${tableRow('Dietary Requirements', registrant.dietary_requirements)}
      ${tableRow('Special Requests', registrant.special_requests)}
      ${tableRow('Submitted', new Date().toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC')}
    </table>
    <p style="color:#555;font-size:13px;">Payment status: <strong>Pending</strong>. View the <a href="${process.env.CLIENT_URL}/admin/registrations" style="color:#1e3a5f;">admin dashboard</a> for details.</p>
  `);

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[AMC Admin] New Registration: ${fullName} (${registrant.category}) – ${registrant.registration_ref}`,
    html,
  });
}

// ─── Email 4: Admin — Payment Received Alert ──────────────────────────────────

async function sendAdminPaymentNotification(registrant, payment) {
  const fullName = `${registrant.designation} ${registrant.first_name} ${registrant.last_name}`;

  const html = wrapEmail('Payment Received', `
    <h2 style="color:#1e3a5f;margin:0 0 16px;">Payment Received</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:24px;">
      ${tableRow('Reference', registrant.registration_ref)}
      ${tableRow('Name', fullName)}
      ${tableRow('Category', registrant.category)}
      ${tableRow('Amount', `$${Number(payment.amount).toFixed(2)} ${payment.currency}`)}
      ${tableRow('Method', payment.payment_method)}
      ${tableRow('Paynow Ref', payment.paynow_reference)}
      ${tableRow('Paid At', new Date().toLocaleString('en-GB', { timeZone: 'UTC' }) + ' UTC')}
    </table>
    <p style="color:#555;font-size:13px;">Registration is now <strong>Confirmed</strong>. View the <a href="${process.env.CLIENT_URL}/admin/payments" style="color:#1e3a5f;">payments dashboard</a>.</p>
  `);

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[AMC Admin] Payment Received: ${fullName} – $${Number(payment.amount).toFixed(2)} – ${registrant.registration_ref}`,
    html,
  });
}

module.exports = {
  sendRegistrationConfirmation,
  sendPaymentConfirmation,
  sendAdminNewRegistrationNotification,
  sendAdminPaymentNotification,
};
