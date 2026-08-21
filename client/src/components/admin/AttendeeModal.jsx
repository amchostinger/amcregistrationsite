/**
 * components/admin/AttendeeModal.jsx
 * Full registrant detail + status update + resend email actions.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { adminApi, setAuthToken } from '../../lib/api';
import {
  formatCurrency, formatDate, getStatusBadgeClass, downloadBlob, downloadErrorMessage,
} from '../../lib/utils';

export default function AttendeeModal({ registrantId, onClose, onStatusUpdate }) {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  // Name of the action in flight, so only that button shows a spinner label.
  const [busyAction, setBusyAction] = useState(null);
  const [emailConfig, setEmailConfig] = useState(null);

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      setAuthToken(token);
      try {
        const { data: res } = await adminApi.getRegistration(registrantId);
        setData(res);
        setNewStatus(res.registrant.registration_status);
        // Where copies go is worth showing next to the buttons; not worth
        // failing the whole modal over if the lookup errors.
        adminApi.emailStatus()
          .then(({ data: cfg }) => setEmailConfig(cfg))
          .catch(() => setEmailConfig(null));
      } catch {
        toast.error('Failed to load registrant details.');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [registrantId, getToken, onClose]);

  const handleStatusUpdate = async () => {
    setStatusUpdating(true);
    try {
      const token = await getToken();
      setAuthToken(token);
      await adminApi.updateStatus(registrantId, newStatus);
      toast.success('Status updated successfully.');
      if (onStatusUpdate) onStatusUpdate(registrantId, newStatus);
      onClose();
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  /**
   * Run an email action and report what the server actually did. The success
   * toast quotes the address the mail went to, so an admin can tell at a glance
   * that it reached the registrant on file and not a stale address.
   */
  const runEmailAction = async (action, request) => {
    setBusyAction(action);
    try {
      const token = await getToken();
      setAuthToken(token);
      const { data: res } = await request();
      toast.success(res.message || 'Email sent.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadPdf = async () => {
    setBusyAction('pdf');
    try {
      const token = await getToken();
      setAuthToken(token);
      const { data: blob } = await adminApi.registrationPdf(registrantId);
      downloadBlob(blob, `AMC2027-registration-${data.registrant.registration_ref}.pdf`);
      toast.success('Registration PDF downloaded.');
    } catch (err) {
      toast.error(await downloadErrorMessage(err, 'Failed to generate PDF.'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadReceipt = async (paymentId, ref) => {
    setBusyAction(`receipt-${paymentId}`);
    try {
      const token = await getToken();
      setAuthToken(token);
      const { data: blob } = await adminApi.paymentPdf(paymentId);
      downloadBlob(blob, `AMC2027-receipt-${ref}-${paymentId}.pdf`);
      toast.success('Receipt downloaded.');
    } catch (err) {
      toast.error(await downloadErrorMessage(err, 'Failed to generate receipt.'));
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  const { registrant, payments } = data;
  const delegateDetails = typeof registrant.delegate_details === 'string'
    ? (() => {
        try { return JSON.parse(registrant.delegate_details || '[]'); } catch { return []; }
      })()
    : Array.isArray(registrant.delegate_details)
      ? registrant.delegate_details
      : [];

  // Drives which email actions are offered. The server enforces both rules too;
  // disabling here just saves the admin a round-trip to be told "no".
  const balanceDue = Math.max(0, Number(
    registrant.balance_due ?? (Number(registrant.grand_total || 0) - Number(registrant.amount_paid || 0))
  ));
  const hasSettledPayment = payments.some((p) => p.status === 'paid');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-navy text-white px-4 sm:px-6 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
          <div className="min-w-0">
            <p className="text-gold text-xs font-semibold uppercase tracking-wide">{registrant.registration_ref}</p>
            <h3 className="font-heading font-semibold text-base sm:text-lg break-words">
              {registrant.designation} {registrant.first_name} {registrant.last_name}
            </h3>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={handleDownloadPdf}
              disabled={busyAction === 'pdf'}
              className="border border-gold/60 text-gold hover:bg-gold hover:text-navy transition-colors rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap disabled:opacity-50"
            >
              {busyAction === 'pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Details */}
          <div>
            <h4 className="font-heading font-semibold text-navy mb-3">Registrant Details</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ['Email', registrant.email],
                ['Phone', registrant.phone],
                ['Category', registrant.category],
                ['Office', registrant.office],
                ['Church', registrant.church],
                ['Country', registrant.country],
                ['Accommodation', registrant.accommodation ? `Yes – ${registrant.accommodation_nights} night(s)` : 'No'],
                ['Hotel', registrant.hotel_name || 'Self-arranged'],
                ['Room Type', registrant.hotel_room_type || '—'],
                ['Rooms', registrant.hotel_rooms || '—'],
                ['Delegation Size', registrant.num_people],
                ['Dietary Requirements', registrant.dietary_requirements],
                ['Special Requests', registrant.special_requests],
                ['Registered', formatDate(registrant.created_at)],
              ].map(([label, value]) => value ? (
                <div key={label} className="contents">
                  <dt className="text-gray-500 font-medium">{label}</dt>
                  <dd className="text-gray-800 break-words">{value}</dd>
                </div>
              ) : null)}
            </dl>
          </div>

          {delegateDetails.length > 0 && (
            <div>
              <h4 className="font-heading font-semibold text-navy mb-3">Additional Delegates</h4>
              <div className="space-y-4">
                {delegateDetails.map((delegate, index) => (
                  <div key={index} className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <p className="font-semibold text-sm text-navy mb-2">Delegate {index + 2}</p>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {[
                        ['Designation', delegate.designation],
                        ['Category', delegate.category],
                        ['Name', `${delegate.first_name} ${delegate.last_name}`],
                        ['Email', delegate.email],
                        ['Phone', delegate.phone],
                        ['Country', delegate.country],
                        ['Office', delegate.office],
                        ['Church', delegate.church],
                      ].map(([label, value]) => value ? (
                        <div key={label} className="contents">
                          <dt className="text-gray-500 font-medium">{label}</dt>
                          <dd className="text-gray-800 break-words">{value}</dd>
                        </div>
                      ) : null)}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[#e5e7eb] bg-slate-50 p-4">
            <h4 className="font-heading font-semibold text-navy mb-3">Financial Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Conference total', formatCurrency(registrant.conference_total || 0)],
                ['Hotel total', formatCurrency(registrant.hotel_total || 0)],
                ['Grand total', formatCurrency(registrant.grand_total || 0)],
                ['Amount paid', formatCurrency(registrant.amount_paid || 0)],
                ['Balance due', formatCurrency(registrant.balance_due || 0)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-gray-500 text-xs uppercase tracking-wide">{label}</p>
                  <p className="font-semibold text-gray-900 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          <div>
            <h4 className="font-heading font-semibold text-navy mb-3">Payments</h4>
            {payments.length === 0 ? (
              <p className="text-gray-400 text-sm">No payment records.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold">{formatCurrency(p.amount)} {p.currency}</p>
                      <p className="text-gray-500 capitalize">{p.payment_method} · {formatDate(p.paid_at || p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                      <button
                        onClick={() => handleDownloadReceipt(p.id, registrant.registration_ref)}
                        disabled={busyAction === `receipt-${p.id}`}
                        className="text-navy hover:text-gold text-xs font-semibold underline whitespace-nowrap disabled:opacity-50"
                      >
                        {busyAction === `receipt-${p.id}` ? 'Preparing…' : 'PDF'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Update */}
          <div>
            <h4 className="font-heading font-semibold text-navy mb-3">Update Registration Status</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                className="form-input flex-1"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={statusUpdating || newStatus === registrant.registration_status}
                className="btn-primary py-2 px-4"
              >
                {statusUpdating ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>

          {/* Email Actions */}
          <div>
            <h4 className="font-heading font-semibold text-navy mb-1">Email Actions</h4>
            <p className="text-xs text-gray-500 mb-3">
              Sent to <span className="font-semibold text-gray-700">{registrant.email}</span> using this
              registrant&rsquo;s current record
              {emailConfig?.archiveTo && <>, with a copy to <span className="font-semibold text-gray-700">{emailConfig.archiveTo}</span></>}.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => runEmailAction('confirmation', () => adminApi.resendConfirmation(registrantId))}
                disabled={busyAction === 'confirmation'}
                className="btn-outline py-2 px-4 text-sm disabled:opacity-50"
              >
                {busyAction === 'confirmation' ? 'Sending…' : 'Registration Email'}
              </button>
              <button
                onClick={() => runEmailAction('payment', () => adminApi.resendPayment(registrantId))}
                disabled={busyAction === 'payment' || !hasSettledPayment}
                title={hasSettledPayment ? '' : 'No confirmed payment on this registration yet'}
                className="btn-outline py-2 px-4 text-sm disabled:opacity-50"
              >
                {busyAction === 'payment' ? 'Sending…' : 'Payment Confirmation'}
              </button>
              <button
                onClick={() => runEmailAction('reminder', () => adminApi.sendPaymentReminder(registrantId))}
                disabled={busyAction === 'reminder' || balanceDue <= 0}
                title={balanceDue > 0 ? '' : 'Nothing outstanding on this registration'}
                className="btn-outline py-2 px-4 text-sm disabled:opacity-50"
              >
                {busyAction === 'reminder' ? 'Sending…' : 'Payment Reminder'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
