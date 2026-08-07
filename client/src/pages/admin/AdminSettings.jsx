/**
 * pages/admin/AdminSettings.jsx
 * Edit conference settings stored in the DB.
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdminSettings } from '../../hooks/useAdmin';

const SETTING_LABELS = {
  conference_name:                 { label: 'Conference Name', type: 'text' },
  conference_dates:                { label: 'Conference Dates', type: 'text' },
  conference_location:             { label: 'Conference Location', type: 'text' },
  conference_start_date:           { label: 'Conference Start Date', type: 'date' },
  conference_theme:                { label: 'Conference Theme', type: 'text' },
  conference_theme_scripture:      { label: 'Theme Scripture Reference', type: 'text' },
  venue_name:                      { label: 'Venue Name', type: 'text' },
  venue_address:                   { label: 'Venue Address', type: 'text' },
  registration_fee_delegate_usd:   { label: 'Delegate Registration Fee (USD)', type: 'number' },
  registration_fee_observer_usd:   { label: 'Observer Registration Fee (USD)', type: 'number' },
  registration_fee_guest_usd:      { label: 'Invited Guest Fee (USD)', type: 'number' },
  accommodation_fee_per_night_usd: { label: 'Accommodation Fee per Night (USD)', type: 'number' },
  registration_open:               { label: 'Registration Open', type: 'boolean' },
  max_registrations:               { label: 'Maximum Registrations', type: 'number' },
};

export default function AdminSettings() {
  const { settings, loading, saving, error, saveSettings } = useAdminSettings();
  const [local, setLocal] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocal(settings);
    setDirty(false);
  }, [settings]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleChange = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await saveSettings(local);
      toast.success('Settings saved successfully.');
      setDirty(false);
    } catch {
      toast.error('Failed to save settings.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <svg className="animate-spin w-10 h-10 text-navy" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-navy">Conference Settings</h2>
          <p className="text-gray-500 text-sm">Edit key conference parameters</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="btn-primary py-2 px-5"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="card max-w-2xl space-y-6">
        {/* Registration Toggle */}
        <div className="bg-parchment rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-navy">Registration Open</p>
              <p className="text-sm text-gray-500">Toggle to open or close registrations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={local.registration_open === 'true'}
                onChange={(e) => handleChange('registration_open', e.target.checked ? 'true' : 'false')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-navy rounded-full peer peer-focus:ring-2 peer-focus:ring-gold transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>

        {/* All Other Settings */}
        {Object.entries(SETTING_LABELS)
          .filter(([key]) => key !== 'registration_open')
          .map(([key, meta]) => (
            <div key={key}>
              <label className="form-label">{meta.label}</label>
              <input
                type={meta.type === 'boolean' ? 'text' : meta.type}
                className="form-input"
                value={local[key] ?? ''}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            </div>
          ))}
      </div>

      {dirty && (
        <div className="mt-4 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary py-2 px-5">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
