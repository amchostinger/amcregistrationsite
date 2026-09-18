/**
 * components/admin/PaymentActionModal.jsx
 * Record or confirm a payment that never went through Paynow.
 *
 * Paynow cannot collect a direct bank transfer, so those payments are settled
 * by hand: the delegate transfers the money and uploads (or emails) their slip,
 * and an admin confirms it here. Confirming is what puts the amount into the
 * revenue figures, which count payments with status 'paid'.
 *
 * The same dialog covers both shapes the payments list can hand it:
 *   • a row with an existing payment attempt → PATCH that record
 *   • a registration with no payment at all  → POST a new one
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi, assetUrl } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

const METHODS = [
  { value: 'bank', label: 'Bank transfer' },
  { value: 'ecocash', label: 'EcoCash' },
  { value: 'telecash', label: 'Telecash' },
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'paynow', label: 'Paynow' },
];

const STATUSES = [
  { value: 'paid', label: 'Confirmed — paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const MAX_BYTES = 10 * 1024 * 1024;

export default function PaymentActionModal({ row, onClose, onSaved }) {
  // An existing attempt keeps its own amount; a registration with none defaults
  // to whatever is still owed.
  const defaultAmount = Number(row.id ? row.amount : row.balance_due) || Number(row.balance_due) || 0;

  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [method, setMethod] = useState(row.payment_method || 'bank');
  const [currency, setCurrency] = useState(row.currency || 'USD');
  // Confirming is the reason this dialog is nearly always opened.
  const [status, setStatus] = useState('paid');
  const [note, setNote] = useState(row.admin_note || '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const name = `${row.designation || ''} ${row.first_name || ''} ${row.last_name || ''}`.trim();

  const handleFile = (event) => {
    const chosen = event.target.files?.[0] || null;
    if (chosen && chosen.size > MAX_BYTES) {
      setFile(null);
      setError('That file is larger than 10 MB.');
      return;
    }
    setError('');
    setFile(chosen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Upload first: an attached slip is worth having even if the write fails.
      let proofUrl;
      if (file) {
        const { data } = await adminApi.uploadPaymentProof(file);
        proofUrl = data.url;
      }

      if (row.id) {
        await adminApi.updatePayment(row.id, {
          status,
          amount: value,
          payment_method: method,
          admin_note: note || null,
          ...(proofUrl ? { proof_url: proofUrl } : {}),
        });
      } else {
        await adminApi.recordPayment({
          registrant_id: row.registrant_row_id ?? row.registrant_id,
          amount: value,
          currency,
          payment_method: method,
          status,
          admin_note: note || null,
          proof_url: proofUrl || null,
        });
      }

      toast.success(status === 'paid' ? 'Payment confirmed.' : 'Payment record updated.');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-7 relative" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400" aria-label="Close">✕</button>

        <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-lg font-bold mb-1">
          {row.id ? 'Confirm / update payment' : 'Record a payment'}
        </h3>
        <p className="font-body text-sm text-gray-500 mb-5">
          {name} · <span className="font-mono text-xs">{row.registration_ref}</span>
        </p>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-5 text-sm font-body grid grid-cols-2 gap-2">
          <span className="text-gray-500">Total due</span>
          <span className="text-right font-semibold">{formatCurrency(row.grand_total || 0)}</span>
          <span className="text-gray-500">Already paid</span>
          <span className="text-right font-semibold">{formatCurrency(row.amount_paid || 0)}</span>
          <span className="text-gray-500">Outstanding</span>
          <span className="text-right font-semibold">{formatCurrency(row.balance_due || 0)}</span>
        </div>

        {row.proof_url && (
          <div className="rounded-xl border border-gray-200 p-3 mb-5 text-sm font-body flex items-center justify-between gap-3">
            <span className="text-gray-600 truncate">
              Proof on file{row.proof_filename ? `: ${row.proof_filename}` : ''}
            </span>
            <a href={assetUrl(row.proof_url)} target="_blank" rel="noreferrer" className="text-navy underline font-semibold text-xs flex-shrink-0">
              Open
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Amount received</label>
              <input
                type="number" step="0.01" min="0.01"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={Boolean(row.id)}>
                <option value="USD">USD</option>
                <option value="ZWL">ZWL</option>
              </select>
            </div>
            <div>
              <label className="form-label">Method</label>
              <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Bank reference / note</label>
            <input
              className="form-input"
              maxLength={500}
              placeholder="e.g. Ecobank transfer 0084213, credited 12 Mar"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">{row.proof_url ? 'Replace proof of payment' : 'Attach proof of payment'} (optional)</label>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
              onChange={handleFile}
              className="block w-full font-body text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer"
            />
          </div>

          <p className="font-body text-xs text-gray-500">
            Marking a payment <strong>confirmed</strong> adds it to revenue and emails the delegate their receipt.
            Setting it back to any other status removes it from revenue again.
          </p>

          {error && <p className="form-error">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-gold flex-1" disabled={saving}>
              {saving ? 'Saving…' : status === 'paid' ? 'Confirm payment' : 'Save'}
            </button>
            <button type="button" className="btn-outline flex-1" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
