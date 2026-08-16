/**
 * components/registration/PaymentStep.jsx
 * Step 3 — Payment method selection and initiation.
 * Three flows:
 *   ecocash     → enter mobile number → USSD push prompt via Paynow
 *   bank        → display bank details + reference, delegate pays manually
 *   visa        → redirect to Paynow web checkout
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatCurrency, calculateTotal } from '../../lib/utils';

// Bank details shown to the delegate
const BANK_DETAILS = {
  bank:       'ECOBANK',
  branch:     'Samora Machel',
  account:    '5718000012056',
  swift:      'ECOCZWHXXXX',
  accountName:'THE METHODIST CHURCH IN ZIMBABWE ',
  reference:  'Use your Registration Ref as payment reference',
};

const PAYMENT_METHODS = [
  {
    id: 'ecocash',
    label: 'EcoCash',
    description: 'Mobile money — pay securely via Paynow',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    description: 'Pay into our account — email proof of payment',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11"/>
      </svg>
    ),
  },
  {
    id: 'visa',
    label: 'Visa / Mastercard',
    description: 'Secure card payment via Paynow',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
      </svg>
    ),
  },
];

export default function PaymentStep({ formData, registrationRef, onInitiate, onBack, isLoading }) {
  const [method, setMethod] = useState('ecocash');
  const [mobilePhone, setMobilePhone] = useState('');
  const navigate = useNavigate();

  // Clear phone when switching away from mobile money methods
  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    // Immediately clear phone number when switching away from mobile money
    if (!['ecocash', 'telecash'].includes(newMethod)) {
      setMobilePhone('');
    }
  };

  const { category, hotel_id, hotel_name, hotel_website_url, num_people, delegate_details } = formData;
  const people = Math.max(1, Number(num_people || 1));
  const total = calculateTotal(category, num_people || 1, delegate_details || []);
  const feeLabel = Array.isArray(delegate_details) && delegate_details.length > 0
    ? 'Registration fee total'
    : `Registration fee (${category}) × ${people} person${people !== 1 ? 's' : ''}`;

  const handlePay = async () => {
    try {
      const result = await onInitiate({ paymentMethod: method, mobilePhone });
      if (method === 'bank') {
        // No redirect — delegate pays manually; go to status page to show instructions
        navigate(`/payment-status?ref=${registrationRef}&method=bank`);
        return;
      }
      if (result?.paymentId && !result?.redirectUrl) {
        // Mobile: poll status page
        navigate(`/payment-status?paymentId=${result.paymentId}&ref=${registrationRef}`);
      }
      // Card redirect handled automatically by useRegistration (window.location)
    } catch {
      // Error already set in hook
    }
  };

  const selected = PAYMENT_METHODS.find((m) => m.id === method);

  return (
    <div className="space-y-6">

      {/* ── Summary ───────────────────────────────────────────────── */}
      <div className="rounded-xl p-5 border" style={{ background: 'rgba(26,47,78,0.04)', borderColor: 'rgba(26,47,78,0.12)' }}>
        <h3 className="font-display font-semibold mb-4" style={{ color: 'var(--color-navy)', fontFamily: 'Cinzel, serif' }}>
          Payment Summary
        </h3>
        <div className="space-y-2 font-body text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-muted)' }}>
              {feeLabel}
            </span>
            <span className="font-semibold">{formatCurrency(total)}</span>
          </div>
          {hotel_id && (
            <div className="space-y-3 pb-2">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Accommodation is separate from registration.</p>
                <p className="mt-1">Your conference fee is paid here. Book and pay for your preferred hotel directly on the hotel website.</p>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-muted)' }}>
                  Preferred hotel (paid separately):
                </span>
                <span className="font-semibold">{hotel_name}</span>
              </div>
              {hotel_website_url && (
                <div className="text-right text-xs">
                  <a href={hotel_website_url} target="_blank" rel="noreferrer" className="underline text-blue-600">
                    Visit hotel website
                  </a>
                </div>
              )}
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold" style={{ borderColor: 'rgba(26,47,78,0.15)', color: 'var(--color-navy)' }}>
            <span>Total Due</span>
            <span className="text-lg">{formatCurrency(total)}</span>
          </div>
        </div>
        <p className="font-body text-xs mt-3" style={{ color: 'var(--color-muted)' }}>
          Ref: <span className="font-semibold" style={{ color: 'var(--color-navy)' }}>{registrationRef}</span>
        </p>
      </div>

      {/* ── Method Selection ──────────────────────────────────────── */}
      <div>
        <p className="form-label mb-3">Payment Method <span className="text-red-500">*</span></p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((pm) => {
            const active = method === pm.id;
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => handleMethodChange(pm.id)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all duration-150"
                style={active
                  ? { borderColor: 'var(--color-navy)', background: 'var(--color-navy)', color: 'white' }
                  : { borderColor: '#e5e7eb', background: 'white', color: 'var(--color-charcoal)' }
                }
              >
                <span>{pm.icon}</span>
                <span className="font-body font-semibold text-sm">{pm.label}</span>
                <span className="font-body text-[11px] leading-tight opacity-70">{pm.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EcoCash Flow ─────────────────────────────────────────── */}
      {/* Handled on Paynow's hosted page, exactly like the card flow — the
          subscriber enters their own number and approves there. */}
      {method === 'ecocash' && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: '#e5e7eb', background: '#fafafa' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: 'var(--color-navy)' }}>1</div>
            <div>
              <p className="font-body font-semibold text-sm" style={{ color: 'var(--color-navy)' }}>Continue to Paynow</p>
              <p className="font-body text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                You will be redirected to Paynow&apos;s secure page to enter your EcoCash number.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white" style={{ background: 'var(--color-navy)' }}>2</div>
            <p className="font-body text-sm pt-1" style={{ color: 'var(--color-muted)' }}>
              Approve the <strong>{formatCurrency(total)}</strong> prompt on your phone, then check your email for confirmation.
            </p>
          </div>
        </div>
      )}

      {/* ── Bank Transfer Flow ───────────────────────────────────── */}
      {method === 'bank' && (
        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: '#e5e7eb', background: '#fafafa' }}>
          <p className="font-body font-semibold text-sm mb-2" style={{ color: 'var(--color-navy)' }}>
            Transfer <strong>{formatCurrency(total)}</strong> to the following account:
          </p>
          <dl className="font-body text-sm space-y-2">
            {[
              ['Bank',           BANK_DETAILS.bank],
              ['Branch',         BANK_DETAILS.branch],
              ['Account Name',   BANK_DETAILS.accountName],
              ['Account Number', BANK_DETAILS.account],
              ['SWIFT / BIC',    BANK_DETAILS.swift],
              ['Reference',      registrationRef],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-36 flex-shrink-0 font-semibold" style={{ color: 'var(--color-navy)' }}>{k}</dt>
                <dd style={{ color: 'var(--color-charcoal)' }}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="font-body text-xs pt-2 border-t" style={{ borderColor: '#e5e7eb', color: 'var(--color-muted)' }}>
            After payment, email your proof of payment to{' '}
            <a href="mailto:conference@africamethodistcouncil.org" className="underline break-words" style={{ color: 'var(--color-navy)' }}>
              conference@africamethodistcouncil.org
            </a>{' '}
            with your registration reference in the subject line. Your registration will be confirmed within 24 hours.
          </p>
        </div>
      )}

      {/* ── Card / Visa Flow ─────────────────────────────────────── */}
      {method === 'visa' && (
        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: '#e5e7eb', background: '#fafafa' }}>
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="8" fill="#1a1f71"/>
              <text x="6" y="32" style={{ fontFamily: 'Arial', fontWeight: 700, fontSize: 20, fill: 'white', letterSpacing: 1 }}>VISA</text>
            </svg>
            <svg className="w-10 h-6 flex-shrink-0" viewBox="0 0 60 38" fill="none">
              <circle cx="23" cy="19" r="14" fill="#EB001B"/>
              <circle cx="37" cy="19" r="14" fill="#F79E1B"/>
              <path d="M30 7.5a14 14 0 010 23 14 14 0 010-23z" fill="#FF5F00"/>
            </svg>
            <p className="font-body text-sm" style={{ color: 'var(--color-muted)' }}>
              You will be redirected to the Paynow secure checkout to complete payment.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-body" style={{ color: 'var(--color-muted)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            256-bit SSL encrypted — your card details are never stored on our servers.
          </div>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────── */}
      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline" disabled={isLoading}>
          &larr; Back
        </button>
        <button
          type="button"
          onClick={handlePay}
          disabled={isLoading}
          className="btn-gold min-w-[180px]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Processing&hellip;
            </span>
          ) : method === 'bank' ? (
            'Confirm & View Bank Details'
          ) : method === 'visa' ? (
            `Pay ${formatCurrency(total)} by Card`
          ) : (
            `Pay ${formatCurrency(total)} via EcoCash`
          )}
        </button>
      </div>
    </div>
  );
}
