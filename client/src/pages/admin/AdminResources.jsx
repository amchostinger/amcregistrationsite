/**
 * pages/admin/AdminResources.jsx
 * CRUD table for conference resources — presentations, keynote materials and
 * other documents shared by guest speakers.
 */

import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Link as LinkIcon, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api, { assetUrl } from '../../lib/api';

const CATEGORIES = ['Presentation', 'Keynote Material', 'Document', 'Report', 'Other'];

const EMPTY = {
  title: '', description: '', category: 'Document', speaker_name: '',
  file_url: '', external_url: '', file_size: 0, published: true, display_order: 0,
};

const ACCEPT = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip',
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
].join(',');

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminResources() {
  const { token } = useAuth();
  const [resources, setResources] = useState([]);
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
    api.get('/admin/resources', { headers })
      .then((r) => setResources(r.data))
      .catch(() => setLoadError('Unable to load resources. Please ensure the API server is running.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setError(''); setShowUrlField(false); setModal('add'); };
  const openEdit = (r) => {
    setForm({ ...r, published: !!r.published });
    setError('');
    setShowUrlField(!!r.external_url);
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setForm(EMPTY); setError(''); setShowUrlField(false); };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) { setError('File is too large. Maximum size is 25 MB.'); return; }

    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/uploads/resource-file', data, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({
        ...f,
        file_url: res.data.url,
        file_size: res.data.size || 0,
        // Fall back to the original filename when no title has been typed yet.
        title: f.title || res.data.name?.replace(/\.[^.]+$/, '') || '',
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.file_url && !form.external_url) { setError('Attach a file or provide a link'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        await api.post('/admin/resources', form, { headers });
      } else {
        await api.put(`/admin/resources/${form.id}`, form, { headers });
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
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/admin/resources/${id}`, { headers });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-xl font-bold uppercase tracking-wide">
          Resources
        </h2>
        <button className="btn-gold text-sm px-5 py-2" onClick={openAdd}>+ Add Resource</button>
      </div>

      <p className="font-body text-sm text-gray-500 mb-5">
        Conference resources, presentations, keynote materials and other documents shared by guest speakers.
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
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--color-navy)' }}>Title</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: 'var(--color-navy)' }}>Category</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--color-navy)' }}>Shared by</th>
                <th className="text-center px-4 py-3 font-semibold" style={{ color: 'var(--color-navy)' }}>Live</th>
                <th className="text-right px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {resources.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-charcoal)' }}>
                    <span className="flex items-center gap-2">
                      <FileText size={13} className="text-gray-300 flex-shrink-0" />
                      {r.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.category}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{r.speaker_name || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {r.published ? <span className="badge-gold">Yes</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(r)} className="text-navy hover:text-gold transition-colors text-xs font-semibold mr-3">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 transition-colors text-xs font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
              {!resources.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 font-body">No resources yet. Add one above.</td></tr>
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
              {modal === 'add' ? 'Add Resource' : 'Edit Resource'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Shared by</label>
                  <input
                    className="form-input"
                    value={form.speaker_name}
                    onChange={e => setForm({ ...form, speaker_name: e.target.value })}
                    placeholder="Speaker or presenter name"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="A short summary of what this document covers…"
                />
              </div>

              <div>
                <label className="form-label">File</label>
                <input ref={fileInputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileSelect} />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-outline text-xs px-4 py-2 inline-flex items-center gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload size={13} />
                    {uploading ? 'Uploading…' : form.file_url ? 'Replace file' : 'Upload from computer'}
                  </button>
                  {form.file_url && (
                    <>
                      <a
                        href={assetUrl(form.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-navy hover:text-gold px-1"
                      >
                        Preview {form.file_size ? `(${formatSize(form.file_size)})` : ''}
                      </a>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-400 hover:text-red-600 inline-flex items-center gap-1 px-2"
                        onClick={() => setForm({ ...form, file_url: '', file_size: 0 })}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 font-body mt-2">
                  PDF, Word, PowerPoint, Excel, TXT, ZIP or an image · max 25 MB.
                </p>
                <button
                  type="button"
                  className="text-[11px] font-body text-navy/60 hover:text-gold inline-flex items-center gap-1 mt-1"
                  onClick={() => setShowUrlField((v) => !v)}
                >
                  <LinkIcon size={11} /> {showUrlField ? 'Hide web link field' : 'Or link to a document hosted elsewhere'}
                </button>
                {showUrlField && (
                  <input
                    className="form-input mt-2"
                    value={form.external_url || ''}
                    onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                    placeholder="https://…"
                  />
                )}
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
                    id="published"
                    checked={!!form.published}
                    onChange={e => setForm({ ...form, published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="published" className="font-body text-sm" style={{ color: 'var(--color-navy)' }}>
                    Visible on the public site
                  </label>
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save Resource'}</button>
                <button type="button" className="btn-outline flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
