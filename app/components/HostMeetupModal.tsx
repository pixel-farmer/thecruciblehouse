'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface HostMeetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function HostMeetupModal({ isOpen, onClose, onSuccess }: HostMeetupModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [showEndDateTime, setShowEndDateTime] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventType, setEventType] = useState<'in-person' | 'virtual' | ''>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user info
  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const displayName = session.user.user_metadata?.display_name || 
                          session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          session.user.email?.split('@')[0] || 
                          'User';
        setUserName(displayName);
        setUserAvatar(session.user.user_metadata?.avatar_url || 
                     session.user.user_metadata?.picture || null);
      }
    };
    getUserInfo();
  }, []);

  // Load Google Maps and initialize autocomplete
  useEffect(() => {
    if (!isOpen || eventType !== 'in-person') return;

    // Wait for the input to be rendered
    const timer = setTimeout(() => {
      if (!locationInputRef.current) return;

      const initializeAutocomplete = () => {
        const google = (window as any).google;
        if (google && google.maps && google.maps.places) {
          if (locationInputRef.current && !autocompleteRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current, {
              types: ['establishment', 'geocode'],
              fields: ['formatted_address', 'geometry', 'name', 'place_id'],
            });

            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace();
              if (place.formatted_address) {
                setLocation(place.formatted_address);
              }
            });

            autocompleteRef.current = autocomplete;
          }
          setMapLoaded(true);
        } else {
          // Load Google Maps script
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            console.error('Google Maps API key not found');
            return;
          }

          const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com/maps/api/js"]');
          if (existingScripts.length > 0) {
            // Wait for it to load
            const checkInterval = setInterval(() => {
              const google = (window as any).google;
              if (google && google.maps && google.maps.places) {
                clearInterval(checkInterval);
                initializeAutocomplete();
              }
            }, 100);
            setTimeout(() => clearInterval(checkInterval), 5000); // Cleanup after 5 seconds
            return;
          }

          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initAutocomplete`;
          script.async = true;
          script.defer = true;

          (window as any).initAutocomplete = () => {
            initializeAutocomplete();
          };

          document.head.appendChild(script);
        }
      };

      initializeAutocomplete();
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      autocompleteRef.current = null;
    };
  }, [isOpen, eventType]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setStartDate('');
      setStartTime('');
      setTimeZone('America/New_York');
      setShowEndDateTime(false);
      setEndDate('');
      setEndTime('');
      setEventType('');
      setLocation('');
      setBannerImage(null);
      setBannerPreview(null);
      setError(null);
      autocompleteRef.current = null;
    }
  }, [isOpen]);

  // Handle banner image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Validate dimensions (recommended: 800x300, but accept any)
    const img = new window.Image();
    img.onload = async () => {
      // Recommended size is 800x300, but we'll accept any size
      // Just warn if it's way off
      if (img.width < 400 || img.height < 150) {
        setError('Image is too small. Recommended size: 800x300px');
        return;
      }

      setError(null);
      setUploadingImage(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('You must be logged in to upload images');
          setUploadingImage(false);
          return;
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `meetups/${session.user.id}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Failed to upload image. Please try again.');
          setUploadingImage(false);
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          setBannerImage(urlData.publicUrl);
        } else {
          setError('Failed to get image URL');
        }
      } catch (err: any) {
        console.error('Image upload error:', err);
        setError(err.message || 'Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    };
    img.onerror = () => {
      setError('Invalid image file');
      setUploadingImage(false);
    };
    img.src = URL.createObjectURL(file);
  };

  // Set default time to next hour
  useEffect(() => {
    if (isOpen && !startDate && !startTime) {
      const now = new Date();
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const dateStr = nextHour.toISOString().split('T')[0];
      const timeStr = `${String(nextHour.getHours()).padStart(2, '0')}:${String(nextHour.getMinutes()).padStart(2, '0')}`;
      setStartDate(dateStr);
      setStartTime(timeStr);
    }
  }, [isOpen, startDate, startTime]);

  const formatTimeZone = (tz: string): string => {
    const timeZoneMap: Record<string, string> = {
      'America/New_York': 'EST',
      'America/Chicago': 'CST',
      'America/Denver': 'MST',
      'America/Los_Angeles': 'PST',
      'America/Phoenix': 'MST',
      'America/Anchorage': 'AKST',
      'Pacific/Honolulu': 'HST',
    };
    return timeZoneMap[tz] || 'EST';
  };

  const buildDateTime = (date: string, time: string, tz?: string): string => {
    if (!date || !time) return '';
    // Combine date and time into ISO format
    // Note: We're storing in UTC but displaying in selected timezone
    const localDateTime = `${date}T${time}`;
    const dateObj = new Date(localDateTime);
    return dateObj.toISOString();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !startDate || !startTime) {
      setError('Please fill in all required fields');
      return;
    }

    if (eventType === 'in-person' && !location.trim()) {
      setError('Please enter a location for in-person events');
      return;
    }

    // Validate date/time is in the future
    const eventDateTime = buildDateTime(startDate, startTime);
    const selectedTime = new Date(eventDateTime);
    if (selectedTime < new Date()) {
      setError('Event time must be in the future');
      return;
    }

    // If end date/time is shown, validate it's after start
    if (showEndDateTime && endDate && endTime) {
      const endDateTime = buildDateTime(endDate, endTime);
      const endTimeObj = new Date(endDateTime);
      if (endTimeObj <= selectedTime) {
        setError('End time must be after start time');
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('You must be logged in to host a meetup');
        setLoading(false);
        return;
      }

      // Build location string
      const locationString = eventType === 'in-person' ? location : 'Virtual Event';

      const response = await fetch('/api/meetups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          event_time: eventDateTime,
          location: locationString,
          banner_image_url: bannerImage || null,
        }),
      });

      if (response.ok) {
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
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #eee',
        }}>
          <h2 style={{ 
            margin: 0, 
            fontFamily: 'var(--font-inter)', 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            color: 'var(--text-dark)' 
          }}>
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

        {/* Event Banner */}
        <div style={{
          height: '225px',
          backgroundColor: '#f5f5f5',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0',
          overflow: 'hidden',
        }}>
          {bannerPreview || bannerImage ? (
            <>
              <img
                src={bannerPreview || bannerImage || ''}
                alt="Event banner"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setBannerImage(null);
                  setBannerPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  padding: '0.5rem 1rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: 'var(--text-dark)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Remove</span>
              </button>
            </>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={uploadingImage}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  right: '1rem',
                  padding: '0.5rem 1rem',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: 'var(--text-dark)',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: uploadingImage ? 0.6 : 1,
                }}
              >
                <span>+</span>
                <span>{uploadingImage ? 'Uploading...' : 'Add'}</span>
              </button>
              <div style={{
                position: 'absolute',
                bottom: '3.5rem',
                left: '1rem',
                right: '1rem',
                textAlign: 'center',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.85rem',
                color: 'var(--text-light)',
              }}>
                Recommended: 800x300px (max 5MB)
              </div>
            </>
          )}
        </div>

        {/* Host Information */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #eee',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#ff6622',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-inter)',
                fontWeight: 600,
                fontSize: '1rem',
              }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ 
                fontFamily: 'var(--font-inter)', 
                fontWeight: 600, 
                fontSize: '0.95rem',
                color: 'var(--text-dark)',
              }}>
                {userName}
              </div>
              <div style={{ 
                fontFamily: 'var(--font-inter)', 
                fontSize: '0.85rem',
                color: 'var(--text-light)',
              }}>
                Host - Your profile
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Event Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              required
              maxLength={100}
              placeholder="Event name"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #ff6622',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '0.25rem',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.85rem',
              color: 'var(--text-light)',
            }}>
              {title.length}/100
            </div>
          </div>

          {/* Date and Time */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              {/* Start Date */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-dark)',
                  marginBottom: '0.5rem',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Start Time */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-dark)',
                  marginBottom: '0.5rem',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Start time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Time Zone */}
              <div>
                <label style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-dark)',
                  marginBottom: '0.5rem',
                  display: 'block',
                }}>
                  Time zone
                </label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <option value="America/New_York">EST</option>
                  <option value="America/Chicago">CST</option>
                  <option value="America/Denver">MST</option>
                  <option value="America/Los_Angeles">PST</option>
                  <option value="America/Phoenix">MST (AZ)</option>
                  <option value="America/Anchorage">AKST</option>
                  <option value="Pacific/Honolulu">HST</option>
                </select>
              </div>
            </div>

            {/* End Date and Time */}
            {!showEndDateTime ? (
              <button
                type="button"
                onClick={() => setShowEndDateTime(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff6622',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0',
                  textAlign: 'left',
                }}
              >
                + End date and time
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'var(--text-dark)',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}>
                    End date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'var(--text-dark)',
                    marginBottom: '0.5rem',
                    display: 'block',
                  }}>
                    End time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Event Type */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem',
            }}>
              Is it in person or virtual?
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value as 'in-person' | 'virtual' | '');
                if (e.target.value !== 'in-person') {
                  setLocation('');
                }
              }}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="">Select...</option>
              <option value="in-person">In person</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>

          {/* Location (conditional) */}
          {eventType === 'in-person' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'var(--text-dark)',
                marginBottom: '0.5rem',
              }}>
                Add location
              </label>
              <input
                ref={locationInputRef}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={loading}
                required
                placeholder="Search for a location..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-inter)',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: 'var(--text-dark)',
              marginBottom: '0.5rem',
            }}>
              What are the details?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              required
              maxLength={1000}
              rows={6}
              placeholder="Describe your meetup..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.95rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-inter)',
            }}>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#ccc' : '#ff6622',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'var(--font-inter)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#e55a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#ff6622';
              }
            }}
          >
            {loading ? 'Creating...' : 'Create meetup'}
          </button>
        </form>
      </div>
    </div>
  );
}
