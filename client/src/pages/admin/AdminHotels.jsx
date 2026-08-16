/**
 * pages/admin/AdminHotels.jsx
 * CRUD for hotels + bookings drawer.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

const EMPTY_HOTEL = {
  name: '', stars: 4, address: '', distance_km: 0, price_usd: 0,
  room_type: 'Standard Room', total_rooms: 0, available_rooms: 0,
  description: '', photo_url: '', website_url: '', active: true,
};

export default function AdminHotels() {
  const { token } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_HOTEL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [drawerHotel, setDrawerHotel] = useState(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const load = async () => {
    if (!token) {
      setLoadError('Please sign in to view admin hotels.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError('');
    try {
      const [hRes, bRes] = await Promise.all([
        api.get('/admin/hotels', { headers }),
        api.get('/admin/hotel-bookings', { headers }).catch(() => ({ data: [] })),
      ]);
      const hotelsData = Array.isArray(hRes.data)
        ? hRes.data
        : Array.isArray(hRes.data?.data)
          ? hRes.data.data
          : [];
      const bookingsData = Array.isArray(bRes.data)
        ? bRes.data
        : Array.isArray(bRes.data?.data)
          ? bRes.data.data
          : [];

      const normalizedHotels = hotelsData.map((hotel) => ({
        ...hotel,
        id: hotel.id ?? hotel.hotel_id ?? hotel.hotelId ?? null,
        name: hotel.name || hotel.hotel_name || '',
        stars: Number(hotel.stars ?? 0),
        address: hotel.address || '',
        distance_km: Number(hotel.distance_km ?? hotel.distanceKm ?? 0),
        price_usd: Number(hotel.price_usd ?? hotel.priceUsd ?? 0),
        room_type: hotel.room_type || hotel.roomType || '',
        total_rooms: Number(hotel.total_rooms ?? hotel.totalRooms ?? 0),
        available_rooms: Number(hotel.available_rooms ?? hotel.availableRooms ?? 0),
        description: hotel.description || '',
        photo_url: hotel.photo_url || hotel.photoUrl || '',
        website_url: hotel.website_url || hotel.websiteUrl || '',
        active: hotel.active !== false,
      }));

      setHotels(normalizedHotels);
      setBookings(bookingsData);
    } catch (err) {
      setLoadError('Unable to load hotels or bookings. Please ensure the API server is running and you are signed in.');
      setHotels([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  const openAdd = () => { setForm(EMPTY_HOTEL); setError(''); setModal('add'); };
  const openEdit = (h) => {
    setForm({
      ...EMPTY_HOTEL,
      ...h,
      id: h.id ?? h.hotel_id ?? h.hotelId ?? null,
      amenities: undefined,
    });
    setError('');
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Hotel name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        await api.post('/admin/hotels', form, { headers });
      } else {
        if (!form.id) {
          throw new Error('Missing hotel ID for edit');
        }
        await api.put(`/admin/hotels/${form.id}`, form, { headers });
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
    if (!window.confirm('Delete this hotel?')) return;
    try {
      await api.delete(`/admin/hotels/${id}`, { headers });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled');
  const bookingsByHotel = activeBookings.reduce((acc, booking) => {
    acc[booking.hotel_id] = acc[booking.hotel_id] || [];
    acc[booking.hotel_id].push(booking);
    return acc;
  }, {});

  const hotelsWithBookings = hotels.map((hotel, index) => ({
    ...hotel,
    bookings: bookingsByHotel[hotel.id] || bookingsByHotel[hotel.hotel_id] || [],
    key: hotel.id ?? `hotel-${index}`,
  }));

  const openAddVariant = (group) => {
    setForm({
      ...EMPTY_HOTEL,
      name: group.name,
      stars: group.stars,
      address: group.address,
      distance_km: group.distance_km,
      description: group.description,
      photo_url: group.photo_url,
      active: true,
      room_type: '',
      total_rooms: 0,
      available_rooms: 0,
    });
    setError('');
    setModal('add');
  };

  const groupHotels = (hotelsList) => {
    const groups = new Map();
    hotelsList.forEach((hotel) => {
      const key = `${hotel.name || ''}::${hotel.address || ''}::${hotel.distance_km ?? 0}`;
      const variant = { ...hotel };
      const existing = groups.get(key);
      if (existing) {
        existing.variants.push(variant);
        existing.total_rooms += hotel.total_rooms || 0;
        existing.available_rooms += hotel.available_rooms || 0;
      } else {
        groups.set(key, {
          groupKey: key,
          name: hotel.name || '',
          stars: hotel.stars || 0,
          address: hotel.address || '',
          distance_km: hotel.distance_km || 0,
          description: hotel.description || '',
          photo_url: hotel.photo_url || '',
          total_rooms: hotel.total_rooms || 0,
          available_rooms: hotel.available_rooms || 0,
          variants: [variant],
        });
      }
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      bookingCount: group.variants.reduce((count, variant) => {
        const hotelBookings = bookingsByHotel[variant.id] || bookingsByHotel[variant.hotel_id] || [];
        return count + hotelBookings.length;
      }, 0),
    }));
  };

  const groupedHotels = groupHotels(hotels);

  const drawerBookings = drawerHotel ? bookings.filter((b) => b.hotel_id === drawerHotel.id) : [];
  const activeDrawerCount = drawerBookings.filter((b) => b.status !== 'cancelled').length;
  const totalDrawerCount = drawerBookings.length;

  const STATUS_COLORS = { confirmed: 'badge-green', reserved: 'badge-yellow', cancelled: 'badge-gray' };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Main panel */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-lg sm:text-xl font-bold uppercase tracking-wide">
            Hotels
          </h2>
          <button className="btn-gold text-sm px-5 py-2" onClick={openAdd}>+ Add Hotel</button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>
        ) : (
          <div className="space-y-6">
            {groupedHotels.length > 0 ? groupedHotels.map((group, groupIndex) => {
              const variants = Array.isArray(group?.variants) ? group.variants : [];
              const pct = group.total_rooms > 0 ? Math.round((group.available_rooms / group.total_rooms) * 100) : 0;
              return (
                <div key={`${group.groupKey}-${groupIndex}`} className="bg-white rounded-2xl border border-[#e8e0d0] overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="font-bold text-sm">{group.name || 'Unnamed hotel'}</span>
                          <span className="text-gold text-xs">{'★'.repeat(group.stars || 0)}</span>
                        </div>
                        <p className="font-body text-xs text-gray-500 mb-2">{group.address || 'Address not set'}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <span>Distance: {group.distance_km ?? 0} km</span>
                          <span>Room types: {variants.length}</span>
                          <span>Rooms: {group.available_rooms}/{group.total_rooms}</span>
                          <span>Bookings: {group.bookingCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openAddVariant(group)} className="btn-outline text-xs px-3 py-2">Add Room Type</button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-32 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-body text-xs text-gray-500">Availability {pct}%</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {variants.map((h, variantIndex) => {
                      const hotelBookings = bookingsByHotel[h.id] || bookingsByHotel[h.hotel_id] || [];
                      return (
                        <div key={`${h.id ?? `variant-${variantIndex}`}-${group.groupKey}-${variantIndex}`} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <p className="font-body font-semibold text-sm text-navy">{h.room_type}</p>
                              <span className="text-xs text-gray-500">${h.price_usd}/night</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span>{h.available_rooms}/{h.total_rooms} available</span>
                              <span>{hotelBookings.length} booking{hotelBookings.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              className="font-body text-xs font-semibold px-3 py-1.5 rounded border border-navy/30 text-navy hover:bg-navy hover:text-white transition-colors"
                              onClick={() => setDrawerHotel(drawerHotel?.id === h.id ? null : h)}
                            >
                              Bookings
                            </button>
                            <button onClick={() => openEdit(h)} className="font-body text-xs font-semibold text-navy hover:text-gold transition-colors">Edit</button>
                            <button onClick={() => handleDelete(h.id)} className="font-body text-xs font-semibold text-red-400 hover:text-red-600 transition-colors">Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <div className="bg-white rounded-xl border border-[#e8e0d0] p-10 text-center font-body text-gray-400">No hotels yet.</div>
            )}
          </div>
        )}
      </div>

      {/* Bookings drawer */}
      {drawerHotel && (
        <div className="w-full xl:w-80 flex-shrink-0">
          <div className="bg-white rounded-xl border border-[#e8e0d0] p-5 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-sm font-bold uppercase tracking-wide">
                {drawerHotel.name}
              </h3>
              <button onClick={() => setDrawerHotel(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="font-body text-xs text-gray-500 mb-4">
              {totalDrawerCount} booking{totalDrawerCount !== 1 ? 's' : ''}
              {activeDrawerCount !== totalDrawerCount && (
                <> · {activeDrawerCount} active</>
              )}
            </p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {drawerBookings.map((b) => (
                <div key={b.id} className="p-3 rounded-lg" style={{ background: 'var(--color-cream)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-body text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>#{b.id} {b.guest_name}</span>
                    <span className={STATUS_COLORS[b.status] || 'badge-gray'}>{b.status}</span>
                  </div>
                  <p className="font-body text-xs text-gray-500">{b.guest_email}</p>
                  <p className="font-body text-xs text-gray-500">{b.rooms} room{b.rooms > 1 ? 's' : ''} · ${b.total_usd}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn-outline py-2 px-3 text-[11px] rounded-2xl"
                      onClick={async () => {
                        if (!window.confirm('Cancel this booking?')) return;
                        try {
                          await api.delete(`/admin/hotel-bookings/${b.id}`, { headers });
                          load();
                        } catch (err) {
                          alert(err.response?.data?.error || 'Unable to cancel booking');
                        }
                      }}
                    >
                      Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
              {!drawerBookings.length && (
                <p className="font-body text-xs text-gray-400 text-center py-4">No bookings yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-7 relative" style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
            <h3 style={{ fontFamily: 'Cinzel, serif', color: 'var(--color-navy)' }} className="text-lg font-bold mb-5">
              {modal === 'add' ? 'Add Hotel' : 'Edit Hotel'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Hotel Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Stars</label>
                  <select className="form-input" value={form.stars ?? 4} onChange={e => setForm({...form, stars: parseInt(e.target.value)})}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Price / Night (USD)</label>
                  <input type="number" className="form-input" value={form.price_usd ?? 0} onChange={e => setForm({...form, price_usd: parseFloat(e.target.value)||0})} min={0} />
                </div>
              </div>
              <div>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Distance from Venue (km)</label>
                  <input type="number" className="form-input" value={form.distance_km ?? 0} onChange={e => setForm({...form, distance_km: parseFloat(e.target.value)||0})} step={0.1} min={0} />
                </div>
                <div>
                  <label className="form-label">Room Type</label>
                  <input className="form-input" value={form.room_type || ''} onChange={e => setForm({...form, room_type: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Total Rooms</label>
                  <input type="number" className="form-input" value={form.total_rooms ?? 0} onChange={e => setForm({...form, total_rooms: parseInt(e.target.value)||0})} min={0} />
                </div>
                <div>
                  <label className="form-label">Available Rooms</label>
                  <input type="number" className="form-input" value={form.available_rooms ?? 0} onChange={e => setForm({...form, available_rooms: parseInt(e.target.value)||0})} min={0} />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Photo URL</label>
                <input className="form-input" value={form.photo_url || ''} onChange={e => setForm({...form, photo_url: e.target.value})} placeholder="https://…" />
              </div>
              <div>
                <label className="form-label">Website URL</label>
                <input className="form-input" value={form.website_url || ''} onChange={e => setForm({...form, website_url: e.target.value})} placeholder="https://example.com" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={!!form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="active" className="font-body text-sm" style={{ color: 'var(--color-navy)' }}>Active (visible on website)</label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-gold flex-1" disabled={saving}>{saving ? 'Saving…' : 'Save Hotel'}</button>
                <button type="button" className="btn-outline flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
