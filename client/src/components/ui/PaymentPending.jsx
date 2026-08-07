import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '../../lib/api';

export default function PaymentPending({ paymentId, reference }) {
  const [status, setStatus] = useState('pending');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const orderRef = reference || paymentId || 'Unavailable';

  const checkStatus = async () => {
    if (!paymentId) {
      setError('No payment ID available to verify.');
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const { data } = await paymentApi.poll(paymentId);
      setStatus(data.status || (data.paid ? 'paid' : 'pending'));
    } catch (err) {
      console.error(err);
      setError('Unable to fetch payment status.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-[320px] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-[28px] border border-[#e8e0d0] bg-white p-8 shadow-[0_20px_50px_rgba(15,30,51,0.08)]">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center bg-[#eff6ff] border border-[#3b82f6]/20">
            <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-navy)', fontFamily: 'Cinzel, serif' }}>
            Payment Pending
          </h1>
          <p className="max-w-xl font-body text-sm text-gray-600">
            Your payment is currently being processed. Please wait a moment and verify the status again.
          </p>
          <div className="rounded-3xl border border-[#e8e0d0] bg-[#eff6ff] px-5 py-4 w-full text-left text-sm text-blue-700">
            Payment reference: <span className="font-mono text-gray-900">{orderRef}</span>
          </div>
          {status && (
            <div className="rounded-3xl px-5 py-4 w-full bg-[#f8faf8] text-left text-sm text-slate-700">
              Current status: <strong>{status}</strong>
            </div>
          )}
          {error && (
            <div className="rounded-3xl px-5 py-4 w-full bg-[#fef3f2] text-left text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
            <button type="button" onClick={checkStatus} className="btn-outline w-full py-3 rounded-2xl" disabled={checking || !paymentId}>
              {checking ? 'Checking…' : 'Check Again'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="btn-primary w-full py-3 rounded-2xl">
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
