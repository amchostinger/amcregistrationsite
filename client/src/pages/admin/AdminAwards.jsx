/**
 * pages/admin/AdminAwards.jsx
 * CRUD table for the conference award categories.
 */

import { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

const EMPTY = { title: '', description: '', criteria: '', published: true, display_order: 0 };

export default function AdminAwards() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    setLoadError('');
    api.get('/admin/award-categories', { headers })
      .then((r) => setCategories(r.data))
      .catch(() => setLoadError('Unable to load award categories. Please ensure the API server is running.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (c) => { setForm({ ...c, published: !!c.published }); setError(''); setModal('edit'); };
  const closeModal = () => { setModal(null); setForm(EMPTY); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        await api.post('/admin/award-categories', form, { headers });
      } else {
        await api.put(`/admin/award-categories/${form.id}`, form, { headers });
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this award category?')) return;
    try {
      await api.delete(`/admin/award-categories/${id}`, { headers });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-xl font-bold uppercase tracking-wide">
          Award Categories
        </h2>
        <button className="btn-gold text-sm px-5 py-2" onClick={openAdd}>+ Add Category</button>
      </div>

      <p className="font-body text-sm text-gray-500 mb-5">
        Categories shown in the Awards section of the public site.
      </p>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4 text-sm text-red-700">{loadError}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8e0d0] overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr style={{ background: 'var(--color-cream-dark)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-navy)' }}>Category</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--color-navy)' }}>Description</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--color-navy)' }}>Live</th>
                <th className="text-right px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-charcoal)' }}>
                    <span className="flex items-center gap-2">
                      <Award size={13} className="text-gray-300 flex-shrink-0" />
                      {c.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {(c.description || '').slice(0, 90)}{(c.description || '').length > 90 ? '…' : ''}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.published ? <span className="badge-gold">Yes</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(c)} className="text-navy hover:text-gold transition-colors text-xs font-semibold mr-3">Edit</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
              {!categories.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-400 font-body">
                    No award categories yet. Add them once the details are confirmed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-7 relative overflow-y-auto scrollbar-thin"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.2)', maxHeight: 'calc(100vh - 2rem)' }}
          >
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
            <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-lg font-bold mb-5">
              {modal === 'add' ? 'Add Award Category' : 'Edit Award Category'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Category title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What this award recognises…"
                />
              </div>
              <div>
                <label className="form-label">Criteria / eligibility</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.criteria || ''}
                  onChange={e => setForm({ ...form, criteria: e.target.value })}
                  placeholder="Who qualifies and how nominees are assessed…"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="form-label">Display order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.display_order ?? 0}
                    onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="award-published"
                    checked={!!form.published}
                    onChange={e => setForm({ ...form, published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="award-published" className="font-body text-sm" style={{ color: 'var(--color-navy)' }}>
                    Visible on the public site
                  </label>
                </div>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save Category'}</button>
                <button type="button" className="btn-outline flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
