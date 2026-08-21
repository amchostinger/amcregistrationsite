/**
 * scripts/sendBackfillEmails.js
 *
 * One-off backfill: send every existing registrant the email they should
 * already have received. Registrations taken before Resend was configured
 * produced no mail at all, so nobody has their reference number.
 *
 * Which email each registrant gets is decided from their live record:
 *   • balance settled  → payment confirmation (their most recent paid payment)
 *   • balance outstanding → registration confirmation, which renders the
 *     "pending payment" panel showing exactly what they still owe
 *
 * The communications desk is blind-copied on all of them by emailService.
 *
 * Usage:
 *   node scripts/sendBackfillEmails.js                 # dry run — sends nothing
 *   node scripts/sendBackfillEmails.js --send          # actually send
 *   node scripts/sendBackfillEmails.js --send --latest-per-email
 *   node scripts/sendBackfillEmails.js --send --only=AMC2027-00017,AMC2027-00018
 *
 * Flags:
 *   --send              Perform the send. Without it nothing leaves the server.
 *   --latest-per-email  Where one address holds several registrations, mail
 *                       only the most recent — avoids three emails to one person.
 *   --only=REF,REF      Restrict to specific registration references.
 *   --delay=MS          Gap between sends (default 700ms; Resend allows 2/sec).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { query, pool } = require('../config/db');
const emailService = require('../services/emailService');

// ─── Arguments ────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const flagValue = (name) => {
  const match = argv.find((a) => a.startsWith(`--${name}=`));
  return match ? match.slice(name.length + 3) : null;
};

const SEND = hasFlag('send');
const LATEST_PER_EMAIL = hasFlag('latest-per-email');
const ONLY = (flagValue('only') || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const DELAY_MS = Number(flagValue('delay') || 700);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const money = (v) => `$${Number(v || 0).toFixed(2)}`;

function balanceOf(r) {
  if (r.balance_due !== null && r.balance_due !== undefined) return Math.max(0, Number(r.balance_due));
  return Math.max(0, Number(r.grand_total || 0) - Number(r.amount_paid || 0));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(' AMC 2027 — registrant email backfill');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(` Mode        : ${SEND ? 'SEND (live)' : 'DRY RUN — nothing will be sent'}`);
  console.log(` From        : ${emailService.config.FROM}`);
  console.log(` Copies to   : ${emailService.config.ARCHIVE_EMAIL} (bcc)`);
  console.log(` Resend key  : ${emailService.config.live ? 'configured' : 'MISSING — stub mailer active'}`);
  if (ONLY.length) console.log(` Restricted  : ${ONLY.join(', ')}`);
  if (LATEST_PER_EMAIL) console.log(' De-duplicate: latest registration per email address only');
  console.log('');

  const [all] = await query('SELECT * FROM registrants ORDER BY created_at ASC');

  let registrants = ONLY.length
    ? all.filter((r) => ONLY.includes(r.registration_ref.toUpperCase()))
    : all;

  // Flag addresses holding more than one registration — without --latest-per-email
  // each of those registrations gets its own email, which is usually right
  // (distinct references, distinct balances) but is worth seeing first.
  const byEmail = new Map();
  registrants.forEach((r) => {
    const key = (r.email || '').toLowerCase();
    if (!byEmail.has(key)) byEmail.set(key, []);
    byEmail.get(key).push(r);
  });

  const duplicates = [...byEmail.entries()].filter(([, rows]) => rows.length > 1);
  if (duplicates.length) {
    console.log(' Addresses with multiple registrations:');
    duplicates.forEach(([email, rows]) => {
      console.log(`   ${email} → ${rows.map((r) => r.registration_ref).join(', ')}`);
    });
    console.log(LATEST_PER_EMAIL
      ? '   → only the most recent of each will be emailed.\n'
      : '   → each will receive one email per registration. Use --latest-per-email to send just one.\n');
  }

  if (LATEST_PER_EMAIL) {
    registrants = [...byEmail.values()].map((rows) =>
      rows.reduce((latest, r) => (new Date(r.created_at) > new Date(latest.created_at) ? r : latest)));
    registrants.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  // Most recent settled payment per registrant, for the confirmation email.
  const [paidPayments] = await query(
    `SELECT * FROM payments WHERE status = 'paid' ORDER BY paid_at DESC, created_at DESC`
  );
  const latestPaymentFor = new Map();
  paidPayments.forEach((p) => {
    if (!latestPaymentFor.has(p.registrant_id)) latestPaymentFor.set(p.registrant_id, p);
  });

  const plan = registrants.map((r) => {
    const balance = balanceOf(r);
    const payment = latestPaymentFor.get(r.id);
    // A settled balance with no payment row on file (e.g. reconciled by hand)
    // still gets the registration email — it renders as "paid in full".
    const kind = balance <= 0 && payment ? 'payment-confirmation' : 'registration-confirmation';
    return { registrant: r, payment, balance, kind };
  });

  console.log(` ${plan.length} email${plan.length === 1 ? '' : 's'} to send:\n`);
  plan.forEach(({ registrant: r, balance, kind }) => {
    console.log(`   ${r.registration_ref}  ${String(kind).padEnd(25)}  ${String(r.email).padEnd(36)}  balance ${money(balance)}`);
  });
  console.log('');

  if (!SEND) {
    console.log(' Dry run complete. Re-run with --send to deliver these emails.\n');
    return { sent: 0, failed: 0 };
  }

  if (!emailService.config.live) {
    console.error(' ✗ Refusing to run: RESEND_API_KEY is not configured, so nothing would actually be delivered.\n');
    process.exitCode = 1;
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  const failures = [];

  for (const [index, item] of plan.entries()) {
    const { registrant, payment, kind } = item;
    try {
      if (kind === 'payment-confirmation') {
        await emailService.sendPaymentConfirmation(registrant, payment);
      } else {
        await emailService.sendRegistrationConfirmation(registrant);
      }
      sent += 1;
      console.log(`   ✓ ${registrant.registration_ref}  ${registrant.email}`);
    } catch (err) {
      failures.push({ ref: registrant.registration_ref, email: registrant.email, error: err.message });
      console.error(`   ✗ ${registrant.registration_ref}  ${registrant.email} — ${err.message}`);
    }

    // Stay under Resend's rate limit.
    if (index < plan.length - 1) await sleep(DELAY_MS);
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(` Sent: ${sent}   Failed: ${failures.length}`);
  if (failures.length) {
    console.log('\n Failures:');
    failures.forEach((f) => console.log(`   ${f.ref}  ${f.email} — ${f.error}`));
    process.exitCode = 1;
  }
  console.log('');

  return { sent, failed: failures.length };
}

main()
  .catch((err) => {
    console.error('\n✗ Backfill aborted:', err.message, '\n');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
