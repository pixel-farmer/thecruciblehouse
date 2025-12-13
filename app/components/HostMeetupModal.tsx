'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface HostMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HostMeetupModal({ isOpen, onClose, onSuccess }: HostMeetupModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !time || !location.trim()) {
      setError('Please fill in all fields');
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
          location: location.trim(),
        }),
      });

      if (response.ok) {
        // Reset form
        setTitle('');
        setDescription('');
        setTime('');
        setLocation('');
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
      setLocation('');
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
              htmlFor="location"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
              }}
            >
              Location *
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={loading}
              required
              maxLength={200}
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
              placeholder="e.g., Local Café, 123 Main St"
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

