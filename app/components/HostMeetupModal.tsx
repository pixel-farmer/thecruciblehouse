'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface HostMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Country and state data
const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'OTHER', name: 'Other' },
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
];

const CA_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon',
];

const AU_STATES = [
  'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
  'South Australia', 'Tasmania', 'Victoria', 'Western Australia',
];

// Map countries to their states/provinces
const COUNTRY_STATES: Record<string, string[]> = {
  'US': US_STATES,
  'CA': CA_PROVINCES,
  'AU': AU_STATES,
  // Add more countries as needed
};

export default function HostMeetupModal({ isOpen, onClose, onSuccess }: HostMeetupModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setTime('');
      setCountry('');
      setState('');
      setCity('');
      setError(null);
    }
  }, [isOpen]);


  // Get available states/provinces for selected country
  const getAvailableStates = (): string[] => {
    if (!country || country === 'OTHER') return [];
    return COUNTRY_STATES[country] || [];
  };

  // Build location string from components
  const buildLocationString = (): string => {
    const parts: string[] = [];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country && country !== 'OTHER') {
      const countryName = COUNTRIES.find(c => c.code === country)?.name || country;
      parts.push(countryName);
    } else if (country === 'OTHER') {
      // If other, we'll need a text field for country name - for now just use city and state
    }
    return parts.join(', ');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const locationString = buildLocationString();

    if (!title.trim() || !description.trim() || !time || !country || !city.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // If country has states/provinces, require state selection
    const availableStates = getAvailableStates();
    if (availableStates.length > 0 && !state) {
      setError('Please select a state/province');
      return;
    }

    // Validate time is in the future
    const selectedTime = new Date(time);
    if (selectedTime < new Date()) {
      setError('Event time must be in the future');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('You must be logged in to host a meetup');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/meetups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          event_time: time,
          location: locationString,
        }),
      });

      if (response.ok) {
        // Reset form
        setTitle('');
        setDescription('');
        setTime('');
        setCountry('');
        setState('');
        setCity('');
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create meetup');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setDescription('');
      setTime('');
      setCountry('');
      setState('');
      setCity('');
      setError(null);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-inter)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-dark)' }}>
            Host a Meetup
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: 'var(--text-light)',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="title"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
              }}
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
              maxLength={100}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              placeholder="e.g., Artist Coffee Hour"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="description"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
              }}
            >
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              required
              maxLength={500}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              placeholder="Describe your meetup..."
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="time"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
              }}
            >
              Date & Time *
            </label>
            <input
              id="time"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="country"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
              }}
            >
              Country *
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setState(''); // Reset state when country changes
              }}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {getAvailableStates().length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="state"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'var(--text-dark)',
                }}
              >
                State/Province *
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={loading || !country}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: 'white',
                  cursor: loading || !country ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="">Select a state/province</option>
                {getAvailableStates().map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="city"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
              }}
            >
              City *
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
              required
              maxLength={100}
              placeholder="Enter city name"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: 'var(--text-dark)',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                outline: 'none',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: loading ? '#ccc' : '#ff6622',
                color: 'white',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                outline: 'none',
                transition: 'background-color 0.2s ease',
              }}
            >
              {loading ? 'Creating...' : 'Create Meetup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

