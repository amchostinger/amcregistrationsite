import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../../lib/api';

export default function PaymentSuccess({ paymentId, reference, hotelName, hotelWebsiteUrl }) {
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const displayRef = reference || paymentId || 'Reference unavailable';

  const checkStatus = async () => {
    if (!paymentId) {
      setError('Unable to verify payment without a payment reference.');
      return;
    }
    setChecking(true);
    setError(null);

    try {
      const { data } = await paymentApi.poll(paymentId);
      setCurrentStatus(data.status || (data.paid ? 'paid' : 'unknown'));
    } catch (err) {
      console.error(err);
      setError('Unable to verify payment status. Please try again later.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[320px] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-[28px] border border-[#e8e0d0] bg-white p-8 shadow-[0_20px_50px_rgba(15,30,51,0.08)]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#eafaf1] border border-[#22c55e]/20">
            <svg className="w-10 h-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-navy)', fontFamily: 'Cinzel, serif' }}>
            Payment Completed
          </h1>
          <p className="max-w-xl font-body text-sm text-gray-600">
            Thank you! Your registration payment has been successfully received and your place is now confirmed. You will receive an email confirmation shortly.
          </p>
          <div className="rounded-3xl border border-[#e8e0d0] bg-[#f8faf8] px-5 py-4 w-full">
            <div className="flex items-center justify-between gap-3 text-sm text-gray-700">
              <span className="font-semibold">Payment reference</span>
              <span className="font-mono text-[13px] text-gray-900">{displayRef}</span>
            </div>
          </div>
          {currentStatus && (
            <div className="rounded-3xl px-5 py-4 w-full bg-[#eef2ff] text-left text-sm text-slate-700">
              Current status: <strong>{currentStatus}</strong>
            </div>
          )}
          <div className="rounded-3xl px-5 py-4 w-full bg-[#eff6ff] text-left text-sm text-slate-700">
            <strong>Note:</strong> Your conference payment is complete, but accommodation is handled separately. If you selected a preferred hotel during registration, please book that directly using the hotel website link below.
          </div>
          {hotelWebsiteUrl && (
            <div className="rounded-3xl px-5 py-4 w-full bg-[#eff6ff] text-left text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Book your accommodation here:</p>
              <p className="mt-2">
                <a href={hotelWebsiteUrl} target="_blank" rel="noreferrer" className="underline text-blue-600">
                  {hotelName ? `Visit ${hotelName} website` : 'Visit hotel website'}
                </a>
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-3xl px-5 py-4 w-full bg-[#fef3f2] text-left text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-primary w-full py-3 rounded-2xl"
            >
              Return Home
            </button>
            <button
              type="button"
              onClick={checkStatus}
              className="btn-outline w-full py-3 rounded-2xl"
              disabled={checking || !paymentId}
            >
              {checking ? 'Checking…' : 'Verify Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
