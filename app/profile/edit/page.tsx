'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../../components/ScrollAnimation';
import styles from '../../styles/Profile.module.css';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bioText, setBioText] = useState('');
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [cityPublic, setCityPublic] = useState(true);
  const [statePublic, setStatePublic] = useState(true);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndLoadProfile = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error || !session || !session.user) {
          router.push('/login');
          return;
        }

        setUser(session.user);
        const userBio = session.user.user_metadata?.bio || '';
        setBioText(userBio);
        const mediums = session.user.user_metadata?.favorite_mediums || [];
        setSelectedMediums(Array.isArray(mediums) ? mediums : []);
        setLoading(false);
        initialLoadComplete.current = true;
      } catch (error) {
        console.error('Error checking auth:', error);
        if (isMounted) {
          router.push('/login');
        }
      }
    };

    checkAuthAndLoadProfile();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      
      if (!session) {
        // Only redirect if we've finished initial loading check
        if (initialLoadComplete.current) {
          router.push('/login');
        }
      } else if (session.user) {
        setUser(session.user);
        const userBio = session.user.user_metadata?.bio || '';
        setBioText(userBio);
        const mediums = session.user.user_metadata?.favorite_mediums || [];
        setSelectedMediums(Array.isArray(mediums) ? mediums : []);
        const userCity = session.user.user_metadata?.city || '';
        setCity(userCity);
        const userState = session.user.user_metadata?.state || '';
        setState(userState);
        setCityPublic(session.user.user_metadata?.city_public !== false);
        setStatePublic(session.user.user_metadata?.state_public !== false);
        if (!initialLoadComplete.current) {
          setLoading(false);
          initialLoadComplete.current = true;
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const normalizeUrl = (url: string): string => {
    if (!url || !url.trim()) return '';
    const trimmed = url.trim();
    // If URL doesn't start with http:// or https://, add https://
    if (!trimmed.match(/^https?:\/\//i)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  // Initialize bio text state when user loads (only if not already set)
  useEffect(() => {
    if (user && !bioText) {
      const userBio = user.user_metadata?.bio || '';
      setBioText(userBio);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ paddingTop: '120px' }}>
        <div style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userAvatar = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || null;
  
  const displayName = user.user_metadata?.display_name || '';
  const portfolioUrl = user.user_metadata?.portfolio_url || '';
  const bio = user.user_metadata?.bio || '';
  const discipline = user.user_metadata?.discipline || '';
  const handle = user.user_metadata?.handle || '';
  const favoriteMediums = user.user_metadata?.favorite_mediums || [];
  
  // Display portfolio URL without protocol prefix in the input
  const displayPortfolioUrl = portfolioUrl ? portfolioUrl.replace(/^https?:\/\//i, '') : '';
  
  // Get user initials for avatar
  let userInitials = 'U';
  const nameForInitials = displayName || 
                          user.user_metadata?.full_name || 
                          user.user_metadata?.name || '';
  if (nameForInitials && nameForInitials !== user.email?.split('@')[0]) {
    const nameParts = nameForInitials.split(' ');
    userInitials = nameParts.length >= 2 
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : nameParts[0][0].toUpperCase();
  } else if (user.email) {
    userInitials = user.email[0].toUpperCase();
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const displayNameInput = formData.get('displayName') as string;
      const handleInput = formData.get('handle') as string;
      const disciplineInput = formData.get('discipline') as string;
      const portfolioUrlInput = formData.get('portfolioUrl') as string;
      const bioInput = formData.get('bio') as string;
      const fileInput = formData.get('profilePicture') as File | null;
      
      // Get selected mediums from checkboxes
      const selectedMediumsArray: string[] = [];
      const mediumCheckboxes = formData.getAll('medium') as string[];
      mediumCheckboxes.forEach(medium => {
        if (medium && !selectedMediumsArray.includes(medium)) {
          selectedMediumsArray.push(medium);
        }
      });

      // Normalize portfolio URL (add https:// if missing)
      const normalizedPortfolioUrl = portfolioUrlInput && portfolioUrlInput.trim()
        ? normalizeUrl(portfolioUrlInput.trim())
        : null;

      let avatarUrl: string | null = null;
      let shouldUpdateAvatar = false;

      // Upload profile picture if provided
      if (fileInput && fileInput.size > 0) {
        shouldUpdateAvatar = true;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          throw new Error('Not authenticated');
        }

        // Generate unique filename
        const fileExt = fileInput.name.split('.').pop() || 'jpg';
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload directly to Supabase Storage from client
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, fileInput, {
            contentType: fileInput.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          
          // Provide helpful error messages
          let errorMessage = 'Failed to upload image';
          if (uploadError.message.includes('The resource already exists')) {
            errorMessage = 'An image with this name already exists. Please try again.';
          } else if (uploadError.message.includes('new row violates row-level security') || uploadError.message.includes('permission denied')) {
            errorMessage = 'Permission denied. Please check storage bucket policies. Make sure the "profile-images" bucket exists and has proper policies set up.';
          } else if (uploadError.message.includes('Bucket not found')) {
            errorMessage = 'Storage bucket not found. Please create "profile-images" bucket in Supabase Storage.';
          } else {
            errorMessage = uploadError.message || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get image URL');
        }

        avatarUrl = urlData.publicUrl;
      }

      // Update profile using client-side Supabase (more reliable for metadata updates)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        throw new Error('Not authenticated');
      }

      // Get current user metadata
      const currentMetadata = session.user.user_metadata || {};
      
      // Prepare updated metadata
      const updatedMetadata = { ...currentMetadata };
      
      if (shouldUpdateAvatar) {
        updatedMetadata.avatar_url = avatarUrl;
        updatedMetadata.picture = avatarUrl; // Also update picture field for consistency
      }
      
      if (normalizedPortfolioUrl !== undefined) {
        updatedMetadata.portfolio_url = normalizedPortfolioUrl;
      }
      
      // Update display name if provided
      if (displayNameInput !== null) {
        const trimmedDisplayName = displayNameInput.trim();
        updatedMetadata.display_name = trimmedDisplayName || null;
      }
      
      // Update handle if provided (ensure it starts with @)
      if (handleInput !== null) {
        let trimmedHandle = handleInput.trim();
        // Remove @ if user included it, we'll add it back
        if (trimmedHandle.startsWith('@')) {
          trimmedHandle = trimmedHandle.substring(1);
        }
        updatedMetadata.handle = trimmedHandle ? `@${trimmedHandle}` : null;
      }
      
      // Update discipline if provided
      if (disciplineInput !== null) {
        const trimmedDiscipline = disciplineInput.trim();
        updatedMetadata.discipline = trimmedDiscipline || null;
      }
      
      // Update bio if provided
      if (bioInput !== null) {
        const trimmedBio = bioInput.trim();
        updatedMetadata.bio = trimmedBio || null;
      }
      
      // Update favorite mediums
      updatedMetadata.favorite_mediums = selectedMediumsArray.length > 0 ? selectedMediumsArray : null;
      
      // Update location fields
      const cityInput = formData.get('city') as string;
      const stateInput = formData.get('state') as string;
      const cityPublicInput = formData.get('cityPublic') === 'on' || formData.get('cityPublic') === 'true';
      const statePublicInput = formData.get('statePublic') === 'on' || formData.get('statePublic') === 'true';
      
      updatedMetadata.city = cityInput && cityInput.trim() ? cityInput.trim() : null;
      updatedMetadata.city_public = cityPublicInput;
      updatedMetadata.state = stateInput && stateInput.trim() ? stateInput.trim() : null;
      updatedMetadata.state_public = statePublicInput;

      console.log('Updating user metadata:', {
        hasAvatar: shouldUpdateAvatar,
        displayName: displayNameInput,
        handle: handleInput,
        discipline: disciplineInput,
        portfolioUrl: normalizedPortfolioUrl,
        bio: bioInput,
        metadata: updatedMetadata
      });

      // Update user metadata directly using client-side Supabase
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: updatedMetadata,
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      console.log('Profile updated successfully:', updateData);

      setSuccess(true);
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.profile} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <div className={styles.profileLayout}>
            {/* Left Sidebar Navigation */}
            <ScrollAnimation>
              <div className={styles.sidebar}>
                <div className={styles.sidebarNav}>
                  <Link href="#about" className={styles.navLink}>
                    About Me
                  </Link>
                  <Link href="#bio" className={styles.navLink}>
                    Bio
                  </Link>
                  <Link href="#experience" className={styles.navLink}>
                    Favorite Mediums
                  </Link>
                  <Link href="#socials" className={styles.navLink}>
                    Socials
                  </Link>
                </div>
              </div>
            </ScrollAnimation>

            {/* Main Content */}
            <div className={styles.mainContent}>
              <form onSubmit={handleSaveProfile}>
                {/* About Me Section */}
                <ScrollAnimation>
                  <div id="about" className={styles.profileSection}>
                    <h3 className={styles.sectionHeading}>About Me</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className={styles.profileHeader}>
                        <div className={styles.avatarContainer}>
                          {userAvatar ? (
                            <Image
                              src={userAvatar}
                              alt="Profile"
                              width={150}
                              height={150}
                              className={styles.avatar}
                            />
                          ) : (
                            <div className={styles.avatarPlaceholder}>
                              <span>{userInitials}</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.profileInfo}>
                          <p className={styles.fileHint} style={{ marginTop: 0 }}>
                            Your current profile picture
                          </p>
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="profilePicture" className={styles.formLabel}>
                          Profile Picture
                        </label>
                        <input
                          id="profilePicture"
                          name="profilePicture"
                          type="file"
                          accept="image/*"
                          className={styles.fileInput}
                        />
                        <p className={styles.fileHint}>
                          Upload a new profile picture (max 5MB)
                        </p>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="modalDisplayName" className={styles.formLabel}>
                          Display Name
                        </label>
                        <input
                          id="modalDisplayName"
                          name="displayName"
                          type="text"
                          placeholder="Your display name"
                          defaultValue={displayName}
                          className={styles.formInput}
                          maxLength={50}
                        />
                        <p className={styles.fileHint}>
                          This name will be shown next to your profile picture on the site
                        </p>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="handle" className={styles.formLabel}>
                          Handle
                        </label>
                        <input
                          id="handle"
                          name="handle"
                          type="text"
                          placeholder="cassie"
                          defaultValue={handle ? handle.replace('@', '') : ''}
                          className={styles.formInput}
                          maxLength={30}
                        />
                        <p className={styles.fileHint}>
                          Your unique handle (without @ - it will be added automatically)
                        </p>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="discipline" className={styles.formLabel}>
                          Discipline
                        </label>
                        <input
                          id="discipline"
                          name="discipline"
                          type="text"
                          placeholder="e.g., Painting, Sculpture, Digital Art"
                          defaultValue={discipline}
                          className={styles.formInput}
                          maxLength={100}
                        />
                        <p className={styles.fileHint}>
                          Your artistic discipline or medium
                        </p>
                      </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="modalPortfolioUrl" className={styles.formLabel}>
                            Portfolio/Website URL
                          </label>
                          <input
                            id="modalPortfolioUrl"
                            name="portfolioUrl"
                            type="text"
                            placeholder="yourportfolio.com"
                            defaultValue={displayPortfolioUrl}
                            className={styles.formInput}
                          />
                          <p className={styles.fileHint}>
                            Enter URL without http:// or https:// (will be added automatically)
                          </p>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="city" className={styles.formLabel}>
                            City
                          </label>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                              id="city"
                              name="city"
                              type="text"
                              placeholder="Your city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className={styles.formInput}
                              maxLength={100}
                              style={{ flex: 1 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="hidden"
                                name="cityPublic"
                                value={cityPublic ? 'true' : 'false'}
                              />
                              <label style={{ 
                                fontSize: '0.85rem', 
                                color: 'var(--text-light)',
                                fontFamily: 'var(--font-inter)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={cityPublic}
                                  onChange={(e) => setCityPublic(e.target.checked)}
                                  style={{ 
                                    cursor: 'pointer',
                                    accentColor: 'var(--accent-color)'
                                  }}
                                />
                                <span>Public</span>
                              </label>
                            </div>
                          </div>
                          <p className={styles.fileHint}>
                            Your city location (optional)
                          </p>
                        </div>

                        <div className={styles.formGroup}>
                          <label htmlFor="state" className={styles.formLabel}>
                            State
                          </label>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <input
                              id="state"
                              name="state"
                              type="text"
                              placeholder="Your state"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              className={styles.formInput}
                              maxLength={100}
                              style={{ flex: 1 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="hidden"
                                name="statePublic"
                                value={statePublic ? 'true' : 'false'}
                              />
                              <label style={{ 
                                fontSize: '0.85rem', 
                                color: 'var(--text-light)',
                                fontFamily: 'var(--font-inter)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={statePublic}
                                  onChange={(e) => setStatePublic(e.target.checked)}
                                  style={{ 
                                    cursor: 'pointer',
                                    accentColor: 'var(--accent-color)'
                                  }}
                                />
                                <span>Public</span>
                              </label>
                            </div>
                          </div>
                          <p className={styles.fileHint}>
                            Your state location (optional)
                          </p>
                        </div>
                      </div>
                    </div>
                  </ScrollAnimation>

                {/* Bio Section */}
                <ScrollAnimation>
                  <div id="bio" className={styles.profileSection}>
                    <h3 className={styles.sectionHeading}>Bio</h3>
                    <div className={styles.formGroup}>
                      <label htmlFor="bio" className={styles.formLabel}>
                        Bio
                      </label>
                      <textarea
                        id="bio"
                        name="bio"
                        placeholder="Tell us about yourself..."
                        defaultValue={bio}
                        className={styles.formTextarea}
                        maxLength={240}
                        rows={6}
                        onChange={(e) => setBioText(e.target.value)}
                      />
                      <p className={styles.fileHint}>
                        {bioText.length}/240 characters
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Favorite Mediums Section */}
                <ScrollAnimation>
                  <div id="experience" className={styles.profileSection}>
                    <h3 className={styles.sectionHeading}>Favorite Mediums</h3>
                    <div className={styles.sectionContent}>
                      <div className={styles.mediumsGrid}>
                        {/* Traditional */}
                        <div className={styles.mediumCategory}>
                          <h4 className={styles.categoryTitle}>Traditional</h4>
                          <div className={styles.checkboxGroup}>
                            {['Drawing', 'Charcoal', 'Graphite', 'Ink', 'Watercolor', 'Acrylic', 'Oil', 'Gouache', 'Pastel', 'Mixed Media', 'Printmaking'].map((medium) => (
                              <label key={medium} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  name="medium"
                                  value={medium}
                                  defaultChecked={favoriteMediums.includes(medium)}
                                  className={styles.checkbox}
                                />
                                <span>{medium}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* 3D & Sculpture */}
                        <div className={styles.mediumCategory}>
                          <h4 className={styles.categoryTitle}>3D & Sculpture</h4>
                          <div className={styles.checkboxGroup}>
                            {['Clay', 'Ceramic', 'Woodworking', 'Metal Sculpture', 'Stone Sculpture', 'Mixed Sculpture', '3D Modeling', '3D Printing'].map((medium) => (
                              <label key={medium} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  name="medium"
                                  value={medium}
                                  defaultChecked={favoriteMediums.includes(medium)}
                                  className={styles.checkbox}
                                />
                                <span>{medium}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Digital */}
                        <div className={styles.mediumCategory}>
                          <h4 className={styles.categoryTitle}>Digital</h4>
                          <div className={styles.checkboxGroup}>
                            {['Digital Painting', 'Illustration', 'Graphic Design', 'Vector Art', 'Pixel Art', 'Voxel Art', 'Animation (2D)', 'Animation (3D)', 'Motion Graphics'].map((medium) => (
                              <label key={medium} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  name="medium"
                                  value={medium}
                                  defaultChecked={favoriteMediums.includes(medium)}
                                  className={styles.checkbox}
                                />
                                <span>{medium}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Photography */}
                        <div className={styles.mediumCategory}>
                          <h4 className={styles.categoryTitle}>Photography</h4>
                          <div className={styles.checkboxGroup}>
                            {['Photography', 'Film Photography', 'Photo Manipulation', 'Virtual Photography'].map((medium) => (
                              <label key={medium} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  name="medium"
                                  value={medium}
                                  defaultChecked={favoriteMediums.includes(medium)}
                                  className={styles.checkbox}
                                />
                                <span>{medium}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Crafts & Textile */}
                        <div className={styles.mediumCategory}>
                          <h4 className={styles.categoryTitle}>Crafts & Textile</h4>
                          <div className={styles.checkboxGroup}>
                            {['Fiber Arts', 'Embroidery', 'Weaving', 'Jewelry', 'Fashion Design'].map((medium) => (
                              <label key={medium} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  name="medium"
                                  value={medium}
                                  defaultChecked={favoriteMediums.includes(medium)}
                                  className={styles.checkbox}
                                />
                                <span>{medium}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Experimental / Other */}
                        <div className={styles.mediumCategory}>
                          <h4 className={styles.categoryTitle}>Experimental / Other</h4>
                          <div className={styles.checkboxGroup}>
                            {['VR Art', 'Installation Art', 'Performance Art'].map((medium) => (
                              <label key={medium} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  name="medium"
                                  value={medium}
                                  defaultChecked={favoriteMediums.includes(medium)}
                                  className={styles.checkbox}
                                />
                                <span>{medium}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Socials Section */}
                <ScrollAnimation>
                  <div id="socials" className={styles.profileSection}>
                    <h3 className={styles.sectionHeading}>Socials</h3>
                    <div className={styles.sectionContent}>
                      <p className={styles.emptySectionText}>
                        Social links section coming soon.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Error and Success Messages */}
                {error && (
                  <div className={styles.errorMessage}>{error}</div>
                )}

                {success && (
                  <div className={styles.successMessage}>Profile updated successfully! Redirecting...</div>
                )}

                {/* Form Actions */}
                <div className={styles.modalActions} style={{ marginTop: '40px' }}>
                  <button
                    type="button"
                    onClick={() => router.push('/profile')}
                    className={styles.cancelButton}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

