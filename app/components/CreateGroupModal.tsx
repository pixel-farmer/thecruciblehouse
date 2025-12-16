'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setDescription('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to create a group');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create group');
        setLoading(false);
        return;
      }

      // Success - close modal and refresh groups
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('An error occurred while creating the group');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '1.8rem',
            fontWeight: 600,
            color: 'var(--primary-color)',
            margin: '0 0 1.5rem 0',
          }}
        >
          Create Group
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="group-name"
              style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'var(--text-dark)',
                marginBottom: '0.5rem',
              }}
            >
              Group Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              maxLength={100}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ff6622';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: 'var(--text-light)',
                margin: '0.25rem 0 0 0',
              }}
            >
              {name.length}/100 characters
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="group-description"
              style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'var(--text-dark)',
                marginBottom: '0.5rem',
              }}
            >
              Description (optional)
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this group is about..."
              maxLength={500}
              rows={4}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ff6622';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '0.75rem',
                color: 'var(--text-light)',
                margin: '0.25rem 0 0 0',
              }}
            >
              {description.length}/500 characters
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'var(--text-dark)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'white',
                backgroundColor: loading || !name.trim() ? '#ccc' : '#ff6622',
                border: 'none',
                borderRadius: '8px',
                cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading && name.trim()) {
                  e.currentTarget.style.backgroundColor = '#e55a1a';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && name.trim()) {
                  e.currentTarget.style.backgroundColor = '#ff6622';
                }
              }}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

