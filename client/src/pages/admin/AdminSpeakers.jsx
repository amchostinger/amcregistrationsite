/**
 * pages/admin/AdminSpeakers.jsx
 * CRUD table for conference speakers.
 */

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api, { assetUrl } from '../../lib/api';
import RichTextEditor from '../../components/ui/RichTextEditor';

const EMPTY = {
  name: '', designation: '', church: '', country: '', bio: '', photo_url: '',
  keynote: false, category: 'speaker', display_order: 0,
};

/** Headings the public Speakers page groups people under. */
const CATEGORIES = [
  { value: 'speaker',   label: 'Speakers' },
  { value: 'host',      label: 'Host' },
  { value: 'secretary', label: 'Secretariat' },
];

export default function AdminSpeakers() {
  const { token } = useAuth();
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    setLoadError('');
    api.get('/speakers')
      .then((r) => setSpeakers(r.data))
      .catch(() => setLoadError('Unable to load speakers. Please ensure the API server is running.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setShowUrlField(false); setModal('add'); };
  const openEdit = (s) => {
    setForm({ ...s });
    setError('');
    // Existing external URLs stay visible/editable; uploaded paths stay hidden.
    setShowUrlField(/^https?:/i.test(s.photo_url || ''));
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setForm(EMPTY); setError(''); setShowUrlField(false); };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image is too large. Maximum size is 5 MB.'); return; }

    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('photo', file);
      const res = await api.post('/uploads/speaker-photo', data, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, photo_url: res.data.url }));
    } catch (err) {
      setError(err.response?.data?.error || 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        await api.post('/admin/speakers', form, { headers });
      } else {
        await api.put(`/admin/speakers/${form.id}`, form, { headers });
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
    if (!window.confirm('Delete this speaker?')) return;
    try {
      await api.delete(`/admin/speakers/${id}`, { headers });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-xl font-bold uppercase tracking-wide">
          Speakers
        </h2>
        <button className="btn-gold text-sm px-5 py-2" onClick={openAdd}>+ Add Speaker</button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8e0d0] overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr style={{ background: 'var(--color-cream-dark)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-navy)' }}>Name</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: 'var(--color-navy)' }}>Church</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--color-navy)' }}>Country</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--color-navy)' }}>Section</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--color-navy)' }}>Keynote</th>
                <th className="text-right px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {speakers.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-charcoal)' }}>
                    {s.designation} {s.name}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{s.church}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{s.country}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                    {CATEGORIES.find((c) => c.value === (s.category || 'speaker'))?.label}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.keynote ? <span className="badge-gold">Yes</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="text-navy hover:text-gold transition-colors text-xs font-semibold mr-3">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
              {!speakers.length && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 font-body">No speakers yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-7 relative overflow-y-auto scrollbar-thin"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.2)', maxHeight: 'calc(100vh - 2rem)' }}
          >
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
            <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-lg font-bold mb-5">
              {modal === 'add' ? 'Add Speaker' : 'Edit Speaker'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Designation</label>
                  <input className="form-input" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Bishop, Rev Dr…" />
                </div>
              </div>
              <div>
                <label className="form-label">Church / Organisation</label>
                <input className="form-input" value={form.church} onChange={e => setForm({...form, church: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Country</label>
                <input className="form-input" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Bio</label>
                <RichTextEditor
                  value={form.bio || ''}
                  onChange={(bio) => setForm((f) => ({ ...f, bio }))}
                  placeholder="Write the speaker's biography. Use the toolbar for bold text, bullet points and headings…"
                />
              </div>

              <div>
                <label className="form-label">Photo</label>
                <div className="flex items-start gap-4">
                  <div
                    className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden bg-gray-50"
                    style={{ border: '1px dashed #d1d5db' }}
                  >
                    {form.photo_url ? (
                      <img src={assetUrl(form.photo_url)} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-body text-center px-1">No photo</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-outline text-xs px-4 py-2 inline-flex items-center gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload size={13} />
                        {uploading ? 'Uploading…' : form.photo_url ? 'Replace photo' : 'Upload from computer'}
                      </button>
                      {form.photo_url && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-400 hover:text-red-600 inline-flex items-center gap-1 px-2"
                          onClick={() => { setForm({ ...form, photo_url: '' }); setShowUrlField(false); }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 font-body mt-2">
                      JPG, PNG, WEBP or GIF · max 5 MB · square images look best.
                    </p>
                    <button
                      type="button"
                      className="text-[11px] font-body text-navy/60 hover:text-gold inline-flex items-center gap-1 mt-1"
                      onClick={() => setShowUrlField((v) => !v)}
                    >
                      <LinkIcon size={11} /> {showUrlField ? 'Hide web link field' : 'Or paste an image link instead'}
                    </button>
                    {showUrlField && (
                      <input
                        className="form-input mt-2"
                        value={form.photo_url || ''}
                        onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                        placeholder="https://…"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Section</label>
                  <select
                    className="form-input"
                    value={form.category || 'speaker'}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Display order</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.display_order ?? 0}
                    onChange={e => setForm({ ...form, display_order: Number(e.target.value) })}
                  />
                  <p className="text-[11px] text-gray-400 font-body mt-1">Lower numbers appear first within the section.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="keynote" checked={!!form.keynote} onChange={e => setForm({...form, keynote: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="keynote" className="font-body text-sm" style={{ color: 'var(--color-navy)' }}>Keynote Speaker</label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save Speaker'}</button>
                <button type="button" className="btn-outline flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
