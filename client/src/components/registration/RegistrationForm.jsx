/**
 * components/registration/RegistrationForm.jsx
 * Steps 1 & 2 of the registration form (personal + additional details).
 */

import { useForm, useFieldArray } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DESIGNATIONS, OFFICES } from '../../lib/utils';
import api from '../../lib/api';

// ─── Step 1 Schema ────────────────────────────────────────────────────────────
const step1Schema = z.object({
  designation: z.string().min(1, 'Designation is required'),
  first_name:  z.string().min(1, 'First name is required').max(100),
  last_name:   z.string().min(1, 'Last name is required').max(100),
  email:       z.string().email('Valid email required'),
  phone:       z.string().max(30).optional(),
  country:     z.string().min(1, 'Country is required'),
  office:      z.string().min(1, 'Office is required'),
  category:    z.enum(['Delegate','Invited Guest','Observer'], { required_error: 'Category is required' }),
  church:      z.string().max(255).optional(),
});

// ─── Step 2 Schema ────────────────────────────────────────────────────────────
const step2Schema = z.object({
  hotel_id:            z.number().nullable().optional(),
  hotel_rooms:         z.number().int().min(1).max(10).optional(),
  num_people:          z.number().int().min(1).max(50),
  delegate_details:    z.array(z.object({
                          designation: z.string().min(1, 'Designation is required'),
                          category:    z.enum(['Delegate','Invited Guest','Observer']),
                          first_name:  z.string().min(1, 'First name is required').max(100),
                          last_name:   z.string().min(1, 'Last name is required').max(100),
                          email:       z.string().email('Valid email required'),
                          phone:       z.string().max(30).optional(),
                          country:     z.string().min(1, 'Country is required').max(100),
                          office:      z.string().min(1, 'Office is required'),
                          church:      z.string().max(255).optional(),
                        })).optional(),
  dietary_requirements: z.string().max(1000).optional(),
  special_requests:    z.string().max(1000).optional(),
  terms_accepted:      z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) }),
}).superRefine((data, ctx) => {
  const expected = Math.max(0, data.num_people - 1);
  const detailsLength = data.delegate_details?.length || 0;
  if (detailsLength !== expected) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Delegate details must include ${expected} additional delegate${expected === 1 ? '' : 's'}`,
      path: ['delegate_details'],
    });
  }
});

// ─── Field Components ─────────────────────────────────────────────────────────

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

// ─── Step 1 Form ─────────────────────────────────────────────────────────────

export function Step1Form({ defaultValues, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(step1Schema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Designation */}
        <Field label="Designation" error={errors.designation?.message} required>
          <select className="form-input" {...register('designation')}>
            <option value="">Select designation</option>
            {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>

        {/* Category */}
        <Field label="Category" error={errors.category?.message} required>
          <select className="form-input" {...register('category')}>
            <option value="">Select category</option>
            <option>Delegate</option>
            <option>Invited Guest</option>
            <option>Observer</option>
          </select>
        </Field>

        {/* First Name */}
        <Field label="First Name" error={errors.first_name?.message} required>
          <input className="form-input" placeholder="John" {...register('first_name')} />
        </Field>

        {/* Last Name */}
        <Field label="Last Name" error={errors.last_name?.message} required>
          <input className="form-input" placeholder="Doe" {...register('last_name')} />
        </Field>

        {/* Email */}
        <Field label="Email Address" error={errors.email?.message} required>
          <input type="email" className="form-input" placeholder="john.doe@example.com" {...register('email')} />
        </Field>

        {/* Phone */}
        <Field label="Phone Number" error={errors.phone?.message}>
          <input className="form-input" placeholder="+263 77 123 4567" {...register('phone')} />
        </Field>

        {/* Country */}
        <Field label="Country" error={errors.country?.message} required>
          <input className="form-input" placeholder="Zimbabwe" {...register('country')} />
        </Field>

        {/* Office */}
        <Field label="Office / Role" error={errors.office?.message} required>
          <select className="form-input" {...register('office')}>
            <option value="">Select office</option>
            {OFFICES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>

        {/* Church */}
        <div className="sm:col-span-2">
          <Field label="Church / Organisation" error={errors.church?.message}>
            <input className="form-input" placeholder="e.g. African Methodist Episcopal Church" {...register('church')} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary">
          Continue to Additional Details →
        </button>
      </div>
    </form>
  );
}

// ─── Step 2 Form ─────────────────────────────────────────────────────────────

const NIGHTS = 5; // conference duration

function Stars({ n }) {
  return (
    <span>{Array.from({ length: n }).map((_, i) => <span key={i} className="text-gold text-xs">★</span>)}</span>
  );
}

export function Step2Form({ defaultValues, onNext, onBack }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      hotel_id: null,
      hotel_rooms: 1,
      num_people: 1,
      delegate_details: [],
      ...defaultValues,
    },
  });

  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(
    defaultValues?.hotel_id ? {
      id: defaultValues.hotel_id,
      name: defaultValues.hotel_name,
      price_usd: defaultValues.hotel_price_usd,
      website_url: defaultValues.hotel_website_url || '',
    } : null
  );
  const [roomsAutoAdjusted, setRoomsAutoAdjusted] = useState(false);

  const hotelRooms = watch('hotel_rooms') || 1;
  const numPeople = watch('num_people') || 1;
  const delegateValues = watch('delegate_details') || [];
  const [delegateOpen, setDelegateOpen] = useState([]);

  const { fields, append, remove } = useFieldArray({ control, name: 'delegate_details' });

  // Auto-adjust rooms if people exceed 2 per room
  useEffect(() => {
    if (!selectedHotel) {
      setRoomsAutoAdjusted(false);
      return;
    }

    const maxCapacity = hotelRooms * 2;
    if (numPeople > maxCapacity) {
      const requiredRooms = Math.ceil(numPeople / 2);
      const maxAvailable = Math.min(10, selectedHotel.available_rooms);
      if (requiredRooms <= maxAvailable) {
        setValue('hotel_rooms', requiredRooms);
        setRoomsAutoAdjusted(true);
      }
    } else {
      setRoomsAutoAdjusted(false);
    }
  }, [numPeople, selectedHotel, hotelRooms, setValue]);

  useEffect(() => {
    const expected = Math.max(0, numPeople - 1);
    if (fields.length < expected) {
      for (let i = fields.length; i < expected; i += 1) {
        append({
          designation: '',
          category: 'Delegate',
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          country: '',
          office: '',
          church: '',
        });
      }
    } else if (fields.length > expected) {
      for (let i = fields.length; i > expected; i -= 1) {
        remove(i - 1);
      }
    }
  }, [numPeople, fields.length, append, remove]);

  useEffect(() => {
    setDelegateOpen((prev) => {
      const next = [...prev];
      while (next.length < fields.length) next.push(false);
      next.length = fields.length;
      return next;
    });
  }, [fields.length]);

  useEffect(() => {
    api.get('/hotels')
      .then((r) => setHotels(r.data || []))
      .catch(() => setHotelsError('Unable to load partner hotels. Please ensure the API server is running.'))
      .finally(() => setHotelsLoading(false));
  }, []);

  const selectHotel = (hotel) => {
    setSelectedHotel(hotel);
    setValue('hotel_id', hotel.id);
    setValue('hotel_website_url', hotel.website_url || '');
  };

  const clearHotel = () => {
    setSelectedHotel(null);
    setValue('hotel_id', null);
    setValue('hotel_website_url', '');
  };

  const groupedHotels = groupHotels(hotels.filter((h) => h.available_rooms > 0));

  const handleFormNext = (data) => {
    onNext({
      ...data,
      hotel_name: selectedHotel?.name || '',
      hotel_price_usd: selectedHotel?.price_usd || 0,
      hotel_room_type: selectedHotel?.room_type || '',
      accommodation: !!selectedHotel,
      accommodation_nights: 0,
      hotel_website_url: selectedHotel?.website_url || '',
    });
  };

  function groupHotels(hotelsList) {
    const groups = new Map();
    hotelsList.forEach((hotel) => {
      const key = `${hotel.name}::${hotel.address}::${hotel.distance_km}`;
      const existing = groups.get(key);
      const variant = { ...hotel };
      if (existing) {
        existing.variants.push(variant);
        existing.total_rooms += hotel.total_rooms || 0;
        existing.available_rooms += hotel.available_rooms || 0;
      } else {
        groups.set(key, {
          groupKey: key,
          name: hotel.name,
          stars: hotel.stars,
          address: hotel.address,
          distance_km: hotel.distance_km,
          description: hotel.description,
          total_rooms: hotel.total_rooms || 0,
          available_rooms: hotel.available_rooms || 0,
          variants: [variant],
        });
      }
    });
    return Array.from(groups.values());
  }

  const isOfficialVenue = selectedHotel?.distance_km === 0;

  return (
    <form onSubmit={handleSubmit(handleFormNext)} className="space-y-6">

      {/* ── Hotel Selection ─────────────────────────────────────────── */}
      <div>
        <p className="font-body font-semibold mb-1" style={{ color: 'var(--color-navy)' }}>
          Accommodation <span className="text-xs text-gray-400 font-normal">(optional)</span>
        </p>
        <p className="font-body text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
          Select a preferred hotel below. Accommodation is booked directly with the hotel and paid separately — this site only collects your conference registration fee.
        </p>

        {hotelsLoading ? (
          <div className="flex items-center gap-2 py-4 font-body text-sm text-gray-400">
            <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
            Loading hotels…
          </div>
        ) : hotelsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {hotelsError}
          </div>
        ) : (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
            {groupedHotels.length > 0 ? groupedHotels.map((group) => (
              <div key={group.groupKey} className="rounded-2xl border border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body font-semibold text-sm" style={{ color: 'var(--color-navy)' }}>{group.name}</span>
                        {group.distance_km === 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'var(--color-gold)', color: 'var(--color-navy)' }}>
                            Official Venue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Stars n={group.stars} />
                        <span className="font-body text-xs" style={{ color: 'var(--color-muted)' }}>{group.address}</span>
                      </div>
                      <p className="font-body text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                        {group.distance_km === 0 ? 'Conference venue' : `${group.distance_km} km from venue`} · {group.available_rooms} rooms available
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-body text-xs text-gray-500">{group.variants.length} room types</p>
                      <p className="font-body text-xs font-semibold mt-1" style={{ color: 'var(--color-gold)' }}>${group.variants[0]?.price_usd ?? 0}+ /night</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  {group.variants.map((h) => {
                    const isSelected = selectedHotel?.id === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => isSelected ? clearHotel() : selectHotel(h)}
                        className="w-full text-left rounded-2xl border-2 p-4 transition-all duration-150"
                        style={isSelected
                          ? { borderColor: 'var(--color-gold)', background: '#fffbf0' }
                          : { borderColor: '#e5e7eb', background: 'white' }
                        }
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-body font-semibold text-sm" style={{ color: 'var(--color-navy)' }}>{h.room_type}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-body text-xs" style={{ color: 'var(--color-muted)' }}>${h.price_usd} / night</span>
                              <span className="font-body text-xs" style={{ color: 'var(--color-muted)' }}>· {h.available_rooms} rooms left</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-body text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>${h.price_usd * NIGHTS * hotelRooms}</p>
                            <p className="font-body text-xs" style={{ color: 'var(--color-muted)' }}>/ 5 nights</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )) : (
              <p className="font-body text-sm text-gray-400 py-2">No hotel availability at this time.</p>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accommodation_option"
              checked={!selectedHotel}
              onChange={clearHotel}
              className="form-radio h-4 w-4 text-navy border-gray-300 focus:ring-navy"
            />
            <span className="font-body text-sm font-semibold text-navy">
              I will arrange my own accommodation
            </span>
          </label>
        </div>

        {!selectedHotel && (
          <p className="font-body text-xs mt-2 italic" style={{ color: 'var(--color-muted)' }}>
            No hotel selected — you will arrange your own accommodation.
          </p>
        )}
      </div>

      {/* ── Delegation Size ─────────────────────────────────────────── */}
      <Field label="Number of People in Delegation" error={errors.num_people?.message} required>
        <div className="space-y-2">
          <input
            type="number"
            min="1"
            max="50"
            className="form-input w-32"
            {...register('num_people', { valueAsNumber: true })}
          />
          <p className="font-body text-xs" style={{ color: 'var(--color-muted)' }}>
            {selectedHotel 
              ? `Maximum 2 people per room. You selected ${hotelRooms} room${hotelRooms !== 1 ? 's' : ''} (capacity: ${hotelRooms * 2} people).`
              : 'Maximum 2 people per room when booking accommodation.'}
          </p>
          {roomsAutoAdjusted && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-700">
              ℹ️ Room count adjusted to {Math.ceil(numPeople / 2)} room{Math.ceil(numPeople / 2) !== 1 ? 's' : ''} to accommodate {numPeople} people (max 2 per room).
            </div>
          )}
        </div>
      </Field>

      {numPeople > 1 && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-body font-semibold text-sm text-navy">
            Please provide details for the additional {numPeople - 1} delegate{numPeople - 1 !== 1 ? 's' : ''} in your delegation.
          </p>
          <p className="font-body text-xs text-gray-500">
            These are the other person{numPeople - 1 !== 1 ? 's' : ''} you are registering for.
          </p>
          <div className="space-y-4">
            {fields.map((field, index) => {
              const isOpen = delegateOpen[index];
              const delegate = delegateValues[index] || {};
              const summaryName = delegate.first_name || delegate.last_name ? `${delegate.first_name || ''} ${delegate.last_name || ''}`.trim() : 'No name yet';
              const summaryMeta = delegate.email || delegate.office ? `${delegate.email || 'No email'} · ${delegate.office || 'No office'}` : 'Fill in delegate details';
              return (
                <div key={field.id} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-body font-semibold text-sm text-navy">Delegate {index + 2}</p>
                      <p className="font-body text-xs text-gray-500">{summaryName}</p>
                      <p className="font-body text-xs text-gray-400">{summaryMeta}</p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-navy underline"
                      onClick={() => setDelegateOpen((prev) => {
                        const next = [...prev];
                        next[index] = !next[index];
                        return next;
                      })}
                    >
                      {isOpen ? 'Hide details' : 'Edit details'}
                    </button>
                  </div>

                  {isOpen ? (
                    <div className="border-t border-gray-100 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Designation" error={errors.delegate_details?.[index]?.designation?.message} required>
                          <select className="form-input" {...register(`delegate_details.${index}.designation`)}>
                            <option value="">Select designation</option>
                            {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </Field>
                        <Field label="Category" error={errors.delegate_details?.[index]?.category?.message} required>
                          <select className="form-input" {...register(`delegate_details.${index}.category`)}>
                            <option value="Delegate">Delegate</option>
                            <option value="Invited Guest">Invited Guest</option>
                            <option value="Observer">Observer</option>
                          </select>
                        </Field>
                        <Field label="First Name" error={errors.delegate_details?.[index]?.first_name?.message} required>
                          <input className="form-input" {...register(`delegate_details.${index}.first_name`)} />
                        </Field>
                        <Field label="Last Name" error={errors.delegate_details?.[index]?.last_name?.message} required>
                          <input className="form-input" {...register(`delegate_details.${index}.last_name`)} />
                        </Field>
                        <Field label="Email Address" error={errors.delegate_details?.[index]?.email?.message} required>
                          <input type="email" className="form-input" {...register(`delegate_details.${index}.email`)} />
                        </Field>
                        <Field label="Phone Number" error={errors.delegate_details?.[index]?.phone?.message}>
                          <input className="form-input" {...register(`delegate_details.${index}.phone`)} />
                        </Field>
                        <Field label="Country" error={errors.delegate_details?.[index]?.country?.message} required>
                          <input className="form-input" {...register(`delegate_details.${index}.country`)} />
                        </Field>
                        <Field label="Office / Role" error={errors.delegate_details?.[index]?.office?.message} required>
                          <select className="form-input" {...register(`delegate_details.${index}.office`)}>
                            <option value="">Select office</option>
                            {OFFICES.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label="Church / Organisation" error={errors.delegate_details?.[index]?.church?.message}>
                            <input className="form-input" {...register(`delegate_details.${index}.church`)} />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dietary ─────────────────────────────────────────────────── */}
      <Field label="Dietary Requirements" error={errors.dietary_requirements?.message}>
        <textarea
          className="form-input resize-none h-20"
          placeholder="e.g. Vegetarian, Halal, Gluten-free..."
          {...register('dietary_requirements')}
        />
      </Field>

      {/* ── Special Requests ────────────────────────────────────────── */}
      <Field label="Special Requests / Accessibility Needs" error={errors.special_requests?.message}>
        <textarea
          className="form-input resize-none h-20"
          placeholder="e.g. Wheelchair access, hearing loop..."
          {...register('special_requests')}
        />
      </Field>

      {/* ── Terms ───────────────────────────────────────────────────── */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 rounded border-gray-300 text-navy focus:ring-navy" {...register('terms_accepted')} />
          <span className="text-sm text-gray-600 font-body">
            I agree to the{' '}
            <a href="#" className="underline" style={{ color: 'var(--color-navy)' }}>terms and conditions</a>
            {' '}and confirm that the information I have provided is accurate.
          </span>
        </label>
        {errors.terms_accepted && <p className="form-error mt-1">{errors.terms_accepted.message}</p>}
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline">
          ← Back
        </button>
        <button type="submit" className="btn-primary">
          Continue to Payment →
        </button>
      </div>
    </form>
  );
}
