/**
 * pages/PaymentStatus.jsx
 * Shows payment status for Paynow payments.
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentApi, registrationApi } from '../lib/api';
import ConfirmationStep from '../components/registration/ConfirmationStep';
import PaymentSuccess from '../components/ui/PaymentSuccess';
import PaymentPending from '../components/ui/PaymentPending';
import PaymentFailed from '../components/ui/PaymentFailed';

const POLL_INTERVAL = 3000;
const MAX_POLLS = 40;

function CheckmarkIcon() {
  return (
    <div className="flex justify-center mb-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.12)', border: '3px solid #22c55e' }}
      >
        <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
          <style>{`
            @keyframes drawCheck {
              to { stroke-dashoffset: 0; }
            }
            .check-path {
              stroke-dasharray: 50;
              stroke-dashoffset: 50;
              animation: drawCheck 0.5s ease-out 0.2s forwards;
            }
          `}</style>
          <path
            className="check-path"
            d="M8 20 L16 28 L32 14"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

const BANK_DETAILS = {
  bank:        'CBZ Bank Zimbabwe',
  branch:      'Samora Machel',
  account:     '5718000012056',
  swift:       'ECOCZWHXXXX',
  accountName: 'THE METHODIST CHURCH IN ZIMBABWE ',
};

function BankTransferConfirmation({ ref_, hotelName, hotelWebsiteUrl }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream)' }}>
      <div className="pt-24 pb-14" style={{ background: 'var(--navy-gradient)' }}>
        <div className="section-container text-center">
          <h1 style={{ fontFamily: 'Cinzel, serif' }} className="text-4xl font-bold text-white uppercase tracking-widest mb-2">
            Almost Done
          </h1>
          <div className="mx-auto mt-3" style={{ width: 40, height: 2, background: 'var(--gold-gradient)', borderRadius: 2 }} />
        </div>
      </div>
      <div className="section-container max-w-xl mx-auto py-14">
        <div className="card">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)', border: '2px solid var(--color-gold)' }}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: 'var(--color-gold)' }}>
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M16 10v11M12 10v11"/>
              </svg>
            </div>
          </div>
          <h2 className="font-display text-xl font-bold text-center mb-1" style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }}>
            Registration Confirmed
          </h2>
          <p className="font-body text-sm text-center mb-6" style={{ color: 'var(--color-muted)' }}>
            Complete your bank transfer using the details below to finalise your place.
          </p>

          {ref_ && (
            <div className="rounded-lg px-4 py-3 mb-5 text-center font-body text-sm" style={{ background: 'rgba(26,47,78,0.06)' }}>
              Your reference: <span className="font-bold" style={{ color: 'var(--color-navy)' }}>{ref_}</span>
            </div>
          )}

          <dl className="font-body text-sm space-y-3 mb-6">
            {[
              ['Bank',           BANK_DETAILS.bank],
              ['Branch',         BANK_DETAILS.branch],
              ['Account Name',   BANK_DETAILS.accountName],
              ['Account Number', BANK_DETAILS.account],
              ['SWIFT / BIC',    BANK_DETAILS.swift],
              ['Reference',      ref_ || 'Your Registration Ref'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 border-b pb-2" style={{ borderColor: '#e5e7eb' }}>
                <dt className="w-36 flex-shrink-0 font-semibold" style={{ color: 'var(--color-navy)' }}>{k}</dt>
                <dd style={{ color: 'var(--color-charcoal)' }}>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-lg p-4 text-sm font-body mb-6" style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)' }}>
            <strong>Important:</strong> Email your proof of payment to{' '}
            <a href="mailto:conference@africamethodistcouncil.org" className="underline" style={{ color: 'var(--color-navy)' }}>
              conference@africamethodistcouncil.org
            </a>{' '}
            with your registration reference in the subject line. Your attendance will be confirmed within 24 business hours.
          </div>

          <div className="rounded-lg p-4 text-sm font-body mb-6" style={{ background: 'rgba(219,234,254,0.18)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <strong>Hotel bookings are separate:</strong> This payment covers your conference registration only. If you selected a preferred hotel during registration, please complete that accommodation booking directly with the hotel via the website link below.
          </div>
          {hotelWebsiteUrl && (
            <div className="rounded-lg p-4 text-sm font-body mb-6" style={{ background: 'rgba(219,234,254,0.18)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <p className="font-semibold text-slate-900">Book your hotel directly:</p>
              <p className="mt-2 break-all">
                <a href={hotelWebsiteUrl} target="_blank" rel="noreferrer" className="underline text-blue-600">
                  {hotelName ? `Visit ${hotelName} website` : 'Visit hotel website'}
                </a>
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Link to="/" className="btn-primary">Return to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatus() {
  const [params] = useSearchParams();
  const paymentId = params.get('paymentId');
  const ref = params.get('ref');
  const method = params.get('method');
  const [registrant, setRegistrant] = useState(null);

  useEffect(() => {
    if (!ref) return;
    registrationApi.getByRef(ref)
      .then((res) => setRegistrant(res.data.registration || null))
      .catch(() => setRegistrant(null));
  }, [ref]);

  // Bank transfer — no polling needed, just show confirmation screen
  if (method === 'bank') {
    return <BankTransferConfirmation ref_={ref} hotelName={registrant?.hotel_name} hotelWebsiteUrl={registrant?.hotel_website_url} />;
  }

  const [status, setStatus] = useState('processing');
  const [pollCount, setPollCount] = useState(0);
  const [message, setMessage] = useState('Checking payment status...');
  const intervalRef = useRef(null);

  useEffect(() => {
    // If we have a Paynow paymentId, use existing polling
    if (paymentId) {
      const poll = async () => {
        try {
          const { data } = await paymentApi.poll(paymentId);

          if (data.paid || data.status === 'paid') {
            setStatus('paid');
            clearInterval(intervalRef.current);
            return;
          }

          if (['cancelled', 'failed', 'disputed'].includes(data.status)) {
            setStatus('failed');
            setMessage('Payment was not completed. Please try again.');
            clearInterval(intervalRef.current);
            return;
          }

          setPollCount((c) => {
            const next = c + 1;
            if (next >= MAX_POLLS) {
              setStatus('failed');
              setMessage('Payment verification timed out. If you were charged, please contact support with your reference.');
              clearInterval(intervalRef.current);
            }
            return next;
          });
        } catch {
          // Network error — keep polling
        }
      };

      poll();
      intervalRef.current = setInterval(poll, POLL_INTERVAL);
      return () => clearInterval(intervalRef.current);
    }

    setStatus('failed');
    setMessage('Missing payment reference. Please check your email for confirmation.');
  }, [paymentId]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream)' }}>
      {/* Header */}
      <div className="pt-24 pb-14" style={{ background: 'var(--navy-gradient)' }}>
        <div className="section-container text-center">
          <h1 style={{ fontFamily: 'Cinzel, serif' }} className="text-4xl font-bold text-white uppercase tracking-widest mb-2">
            Payment Status
          </h1>
          <div className="mx-auto mt-3 block" style={{ width: 40, height: 2, background: 'var(--gold-gradient)', borderRadius: 2 }} />
        </div>
      </div>

      <div className="section-container max-w-xl mx-auto py-14">
        <div className="card text-center">

          {/* Processing / Pending */}
          {status === 'processing' && (
            <>
              <div className="flex justify-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ border: '3px solid var(--color-navy)' }}
                >
                  <div className="w-8 h-8 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-navy)', borderTopColor: 'transparent', borderWidth: 3 }} />
                </div>
              </div>
              <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-2xl font-bold mb-3">
                Confirming Payment...
              </h2>
              <p className="font-body text-sm mb-3" style={{ color: 'var(--color-muted)' }}>{message}</p>
              {paymentId && (
                <p className="font-body text-xs" style={{ color: 'var(--color-muted)' }}>
                  If paying via mobile money, please approve the payment prompt on your phone.
                </p>
              )}
              {ref && (
                <div className="mt-5 p-3 rounded-lg" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)' }}>
                  <p className="font-body text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                    Reference: <span className="font-mono">{ref}</span>
                  </p>
                </div>
              )}
            </>
          )}

          {/* Paid */}
          {status === 'paid' && (
            <>
              <PaymentSuccess
                paymentId={paymentId}
                reference={ref}
                hotelName={registrant?.hotel_name}
                hotelWebsiteUrl={registrant?.hotel_website_url}
              />
            </>
          )}

          {/* Failed */}
          {status === 'failed' && (
            <>
              <PaymentFailed paymentId={paymentId} reference={ref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
