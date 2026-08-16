/**
 * pages/admin/AdminSchedule.jsx
 * CRUD for schedule sessions + speaker assignment.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

const DAYS = [
  { iso: '2027-03-09', label: 'Mon 9 Mar' },
  { iso: '2027-03-10', label: 'Tue 10 Mar' },
  { iso: '2027-03-11', label: 'Wed 11 Mar' },
  { iso: '2027-03-12', label: 'Thu 12 Mar' },
  { iso: '2027-03-13', label: 'Fri 13 Mar' },
  { iso: '2027-03-14', label: 'Sat 14 Mar' },
  { iso: '2027-03-15', label: 'Sun 15 Mar' },
];

const TYPES = ['worship', 'keynote', 'general', 'social', 'break', 'logistics'];

const TYPE_COLORS = {
  worship: '#3b82f6', keynote: '#c9a84c', general: '#1a2f4e',
  social: '#7c3aed', break: '#9ca3af', logistics: '#9ca3af',
};

const EMPTY_SESSION = {
  session_date: DAYS[0].iso, start_time: '09:00', end_time: '10:00',
  title: '', room: '', type: 'general', description: '',
};

export default function AdminSchedule() {
  const { token } = useAuth();
  const [activeDay, setActiveDay] = useState(DAYS[0].iso);
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SESSION);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const loadSessions = (date) => {
    setLoading(true);
    setLoadError('');
    api.get(`/schedule/${date}`)
      .then((r) => setSessions(r.data || []))
      .catch(() => {
        setLoadError('Unable to load schedule. Please ensure the API server is running.');
        setSessions([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSessions(activeDay); }, [activeDay]);
  useEffect(() => {
    api.get('/speakers').then((r) => setSpeakers(r.data || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setForm({ ...EMPTY_SESSION, session_date: activeDay });
    setError('');
    setModal('add');
  };
  const openEdit = (s) => {
    setForm({
      ...s,
      start_time: s.time || '',
      end_time: s.end || '',
    });
    setError('');
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        await api.post('/admin/schedule', form, { headers });
      } else {
        await api.put(`/admin/schedule/${form.id}`, form, { headers });
      }
      closeModal();
      loadSessions(activeDay);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/admin/schedule/${id}`, { headers });
      loadSessions(activeDay);
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-lg sm:text-xl font-bold uppercase tracking-wide">
          Schedule
        </h2>
        <button className="btn-gold text-sm px-5 py-2" onClick={openAdd}>+ Add Session</button>
      </div>

      {/* Day tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-1">
        {DAYS.map((d) => (
          <button
            key={d.iso}
            onClick={() => setActiveDay(d.iso)}
            className="flex-shrink-0 px-4 py-2 rounded font-body text-xs font-semibold transition-all whitespace-nowrap"
            style={activeDay === d.iso
              ? { background: 'var(--color-navy)', color: 'white' }
              : { background: 'white', color: 'var(--color-navy)', border: '1px solid #d4dce9' }
            }
          >
            {d.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-[#e8e0d0] p-4 flex items-start gap-4">
              <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: TYPE_COLORS[s.type] || '#9ca3af' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-body text-xs font-semibold text-gray-500">{s.time}{s.end ? ` – ${s.end}` : ''}</span>
                  <span className="font-body text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-cream-dark)', color: 'var(--color-navy)' }}>{s.type}</span>
                </div>
                <p className="font-body font-semibold text-sm" style={{ color: 'var(--color-charcoal)' }}>{s.title}</p>
                {s.room && <p className="font-body text-xs text-gray-400">{s.room}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(s)} className="font-body text-xs font-semibold text-navy hover:text-gold transition-colors">Edit</button>
                <button onClick={() => handleDelete(s.id)} className="font-body text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {!sessions.length && (
            <div className="bg-white rounded-xl border border-[#e8e0d0] p-10 text-center font-body text-gray-400">
              No sessions for this day. Click "+ Add Session" to create one.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-7 relative" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
            <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-lg font-bold mb-5">
              {modal === 'add' ? 'Add Session' : 'Edit Session'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date</label>
                  <select className="form-input" value={form.session_date} onChange={e => setForm({...form, session_date: e.target.value})}>
                    {DAYS.map(d => <option key={d.iso} value={d.iso}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={form.end_time || ''} onChange={e => setForm({...form, end_time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="form-label">Room / Location</label>
                <input className="form-input" value={form.room || ''} onChange={e => setForm({...form, room: e.target.value})} placeholder="Plenary Hall, Chapel…" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save Session'}</button>
                <button type="button" className="btn-outline flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
