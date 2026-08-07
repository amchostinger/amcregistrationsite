/**
 * components/admin/AttendeeModal.jsx
 * Full registrant detail + status update + resend email actions.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { adminApi, setAuthToken } from '../../lib/api';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../lib/utils';

export default function AttendeeModal({ registrantId, onClose, onStatusUpdate }) {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = await getToken();
      setAuthToken(token);
      try {
        const { data: res } = await adminApi.getRegistration(registrantId);
        setData(res);
        setNewStatus(res.registrant.registration_status);
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

  const handleResendConfirmation = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await adminApi.resendConfirmation(registrantId);
      toast.success('Confirmation email resent.');
    } catch {
      toast.error('Failed to resend email.');
    }
  };

  const handleResendPayment = async () => {
    try {
      const token = await getToken();
      setAuthToken(token);
      await adminApi.resendPayment(registrantId);
      toast.success('Payment confirmation email resent.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend email.');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <p className="text-gold text-xs font-semibold uppercase tracking-wide">{registrant.registration_ref}</p>
            <h3 className="font-heading font-semibold text-lg">
              {registrant.designation} {registrant.first_name} {registrant.last_name}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Details */}
          <div>
            <h4 className="font-heading font-semibold text-navy mb-3">Registrant Details</h4>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
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
                  <dd className="text-gray-800">{value}</dd>
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
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
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
                          <dd className="text-gray-800">{value}</dd>
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
            <div className="grid grid-cols-2 gap-3 text-sm">
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
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                    <div>
                      <p className="font-semibold">{formatCurrency(p.amount)} {p.currency}</p>
                      <p className="text-gray-500 capitalize">{p.payment_method} · {formatDate(p.created_at)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Update */}
          <div>
            <h4 className="font-heading font-semibold text-navy mb-3">Update Registration Status</h4>
            <div className="flex gap-3">
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
            <h4 className="font-heading font-semibold text-navy mb-3">Email Actions</h4>
            <div className="flex gap-3">
              <button onClick={handleResendConfirmation} className="btn-outline py-2 px-4 text-sm flex-1">
                Resend Registration Email
              </button>
              <button onClick={handleResendPayment} className="btn-outline py-2 px-4 text-sm flex-1">
                Resend Payment Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
