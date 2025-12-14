'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import UpgradeModal from '../components/UpgradeModal';
import HostMeetupModal from '../components/HostMeetupModal';
import HostExhibitModal from '../components/HostExhibitModal';
import styles from '../styles/Community.module.css';

export default function CommunityPage() {
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPaidMembership, setHasPaidMembership] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [userInitials, setUserInitials] = useState('U');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userHandle, setUserHandle] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [groupPostsLoading, setGroupPostsLoading] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [fullscreenMapInstance, setFullscreenMapInstance] = useState<any>(null);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showHostMeetupModal, setShowHostMeetupModal] = useState(false);
  const [showHostExhibitModal, setShowHostExhibitModal] = useState(false);
  const [meetups, setMeetups] = useState<any[]>([]);
  const [meetupsLoading, setMeetupsLoading] = useState(true);
  const [selectedMeetup, setSelectedMeetup] = useState<any | null>(null);
  const [exhibitions, setExhibitions] = useState<any[]>([]);
  const [exhibitionsLoading, setExhibitionsLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [isGroupMember, setIsGroupMember] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  // Check for upgrade query parameter
  useEffect(() => {
    const upgradeParam = searchParams?.get('upgrade');
    if (upgradeParam === 'true' && isLoggedIn && !hasPaidMembership) {
      setShowUpgradeModal(true);
      // Remove the query parameter from URL without reload
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/community');
      }
    }
  }, [searchParams, isLoggedIn, hasPaidMembership]);

  useEffect(() => {
    // Check authentication and membership status
    const checkMembership = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);

        if (session) {
          setUserId(session.user.id);
          
          // Get avatar URL from user metadata
          const avatarUrl = session.user.user_metadata?.avatar_url || 
                           session.user.user_metadata?.picture || null;
          setUserAvatar(avatarUrl);
          
          // Get user information for composer - prioritize display_name
          const email = session.user.email || '';
          const displayName = session.user.user_metadata?.display_name;
          const name = displayName || 
                      session.user.user_metadata?.full_name || 
                      session.user.user_metadata?.name || '';
          
          if (name) {
            setUserName(name);
            const nameParts = name.split(' ');
            setUserInitials(
              nameParts.length >= 2 
                ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
                : nameParts[0][0].toUpperCase()
            );
          } else if (email) {
            setUserName(email.split('@')[0]);
            setUserInitials(email[0].toUpperCase());
          }
          
          // Use custom handle from metadata, or generate from email
          const customHandle = session.user.user_metadata?.handle;
          if (customHandle) {
            setUserHandle(customHandle);
          } else if (email) {
            const handle = email.split('@')[0];
            setUserHandle(`@${handle}`);
          }
          
          // Check if user has paid membership
          const userMetadata = session.user.user_metadata;
          const membershipStatus = userMetadata?.membership_status || userMetadata?.has_paid_membership;
          setHasPaidMembership(!!membershipStatus);
        } else {
          setHasPaidMembership(false);
          setUserInitials('U');
          setUserAvatar(null);
          setUserName('');
          setUserHandle('');
          setUserId(null);
        }
      } catch (error) {
        console.error('Error checking membership:', error);
        setHasPaidMembership(false);
      } finally {
        setLoading(false);
      }
    };

    checkMembership();

    // Load Google Maps API
    const loadGoogleMaps = () => {
      if ((window as any).google && (window as any).google.maps) {
        setMapLoaded(true);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Please add it to your environment variables.');
        return;
      }

      // Check if Google Maps script already exists to prevent duplicates
      const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScripts.length > 0) {
        // Script already exists, just wait for it to load
        if ((window as any).google && (window as any).google.maps) {
          setMapLoaded(true);
        } else {
          // Wait for callback
          (window as any).initMap = () => {
            setMapLoaded(true);
          };
        }
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      (window as any).initMap = () => {
        setMapLoaded(true);
      };

      document.head.appendChild(script);

      return () => {
        if ((window as any).initMap) {
          delete (window as any).initMap;
        }
      };
    };

    loadGoogleMaps();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        setUserId(session.user.id);
        
        // Get avatar URL from user metadata
        const avatarUrl = session.user.user_metadata?.avatar_url || 
                         session.user.user_metadata?.picture || null;
        setUserAvatar(avatarUrl);
        
        // Update user info - prioritize display_name
        const email = session.user.email || '';
        const displayName = session.user.user_metadata?.display_name;
        const name = displayName || 
                    session.user.user_metadata?.full_name || 
                    session.user.user_metadata?.name || '';
        
        if (name) {
          setUserName(name);
          const nameParts = name.split(' ');
          setUserInitials(
            nameParts.length >= 2 
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : nameParts[0][0].toUpperCase()
          );
        } else if (email) {
          setUserName(email.split('@')[0]);
          setUserInitials(email[0].toUpperCase());
        }
        
        // Use custom handle from metadata, or generate from email
        const customHandle = session.user.user_metadata?.handle;
        if (customHandle) {
          setUserHandle(customHandle);
        } else if (email) {
          const handle = email.split('@')[0];
          setUserHandle(`@${handle}`);
        }
        
        const userMetadata = session.user.user_metadata;
        const membershipStatus = userMetadata?.membership_status || userMetadata?.has_paid_membership;
        setHasPaidMembership(!!membershipStatus);
      } else {
        setHasPaidMembership(false);
        setUserInitials('U');
        setUserName('');
        setUserHandle('');
        setUserId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      if ((window as any).initMap) {
        delete (window as any).initMap;
      }
    };
  }, []);

  // Initialize map when script is loaded
  useEffect(() => {
    if (!mapLoaded || !(window as any).google?.maps) return;

    // Initialize main map
    const mapElement = document.getElementById('community-map');
    if (mapElement && !mapInstance && (window as any).google?.maps) {
      const mapOptions: any = {
        center: { lat: 39.9526, lng: -75.1652 }, // Philadelphia, PA
        zoom: 8,
        // Disable interaction if user doesn't have membership
        gestureHandling: hasPaidMembership ? 'auto' : 'none',
        zoomControl: hasPaidMembership,
        scrollwheel: hasPaidMembership,
        disableDoubleClickZoom: !hasPaidMembership,
        draggable: hasPaidMembership,
      };

      // Add custom map style if Map ID is configured
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      if (mapId) {
        mapOptions.mapId = mapId;
      }

      const map = new (window as any).google.maps.Map(mapElement, mapOptions);
      setMapInstance(map);

      // Add overlay and prevent interaction if no membership
      if (!hasPaidMembership) {
        // Show message when user tries to interact
        const overlay = document.createElement('div');
        overlay.setAttribute('data-upgrade-overlay', 'true');
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        overlay.innerHTML = `
          <div style="
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            font-family: var(--font-inter);
            max-width: 300px;
          ">
            <p style="margin: 0 0 1rem 0; color: var(--text-dark); font-weight: 600;">
              Upgrade to Pro to zoom and scroll
            </p>
            <button id="upgrade-from-map" style="
              background: #ff6622;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: 600;
              cursor: pointer;
              font-family: var(--font-inter);
              text-transform: uppercase;
              letter-spacing: 1px;
            ">Upgrade</button>
          </div>
        `;
        mapElement.style.position = 'relative';
        mapElement.appendChild(overlay);

        // Show overlay on interaction attempts
        let overlayTimeout: NodeJS.Timeout;
        const showOverlay = () => {
          overlay.style.opacity = '1';
          overlay.style.pointerEvents = 'auto';
          clearTimeout(overlayTimeout);
          overlayTimeout = setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
          }, 3000);
        };

        // Listen for interaction attempts
        map.addListener('click', showOverlay);
        map.addListener('dragstart', showOverlay);
        
        // Handle upgrade button click
        const upgradeBtn = overlay.querySelector('#upgrade-from-map');
        if (upgradeBtn) {
          upgradeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Check session directly instead of using closure values
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
              // Update userId state if needed, then open modal
              setUserId(session.user.id);
              setShowUpgradeModal(true);
            } else {
              alert('Please log in to upgrade your membership.');
            }
          });
        }
      }

      // Fetch and add artist markers
      fetch('/api/artists/locations')
        .then((res) => res.json())
        .then((data) => {
          if (data.artists && data.artists.length > 0) {
            const geocoder = new (window as any).google.maps.Geocoder();
            const markers: any[] = [];

            data.artists.forEach((artist: any) => {
              geocoder.geocode({ address: artist.location }, (results: any, status: string) => {
                if (status === 'OK' && results[0]) {
                  const marker = new (window as any).google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    title: artist.name,
                  });

                  const infoWindow = new (window as any).google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px; min-width: 150px;">
                        <div style="font-weight: 600; margin-bottom: 4px; font-family: var(--font-inter);">${artist.name}</div>
                        <div style="font-size: 0.9em; color: #666; font-family: var(--font-inter);">${artist.location}</div>
                      </div>
                    `,
                  });

                  marker.addListener('click', () => {
                    // Close all other info windows
                    markers.forEach((m: any) => {
                      if (m.infoWindow) {
                        m.infoWindow.close();
                      }
                    });
                    infoWindow.open(map, marker);
                  });

                  markers.push({ marker, infoWindow });
                }
              });
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching artist locations:', error);
        });
    }
  }, [mapLoaded, mapInstance, hasPaidMembership]);

  // Update map controls when membership status changes
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setOptions({
        gestureHandling: hasPaidMembership ? 'auto' : 'none',
        zoomControl: hasPaidMembership,
        scrollwheel: hasPaidMembership,
        disableDoubleClickZoom: !hasPaidMembership,
        draggable: hasPaidMembership,
      });

      // Remove overlay if membership becomes active
      if (hasPaidMembership) {
        const mapElement = document.getElementById('community-map');
        if (mapElement) {
          // Find and remove the upgrade overlay
          const overlay = mapElement.querySelector('[data-upgrade-overlay="true"]');
          if (overlay) {
            overlay.remove();
          }
        }
      }
    }
  }, [mapInstance, hasPaidMembership]);

  // Initialize fullscreen map when opened
  useEffect(() => {
    if (!isMapFullscreen || !mapLoaded || !(window as any).google?.maps) {
      // Reset fullscreen map instance when closing
      if (!isMapFullscreen && fullscreenMapInstance) {
        setFullscreenMapInstance(null);
      }
      return;
    }

    const fullscreenMapElement = document.getElementById('fullscreen-map');
    if (fullscreenMapElement && !fullscreenMapInstance && (window as any).google?.maps) {
      const mapOptions: any = {
        center: { lat: 39.9526, lng: -75.1652 }, // Philadelphia, PA
        zoom: 8,
        // Disable interaction if user doesn't have membership
        gestureHandling: hasPaidMembership ? 'auto' : 'none',
        zoomControl: hasPaidMembership,
        scrollwheel: hasPaidMembership,
        disableDoubleClickZoom: !hasPaidMembership,
        draggable: hasPaidMembership,
      };

      // Add custom map style if Map ID is configured
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      if (mapId) {
        mapOptions.mapId = mapId;
      }

      const map = new (window as any).google.maps.Map(fullscreenMapElement, mapOptions);
      setFullscreenMapInstance(map);

      // Add overlay for fullscreen map if no membership
      if (!hasPaidMembership) {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-upgrade-overlay-fullscreen', 'true');
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        overlay.innerHTML = `
          <div style="
            background: white;
            padding: 1.5rem;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            font-family: var(--font-inter);
            max-width: 300px;
          ">
            <p style="margin: 0 0 1rem 0; color: var(--text-dark); font-weight: 600;">
              Upgrade to Pro to zoom and scroll
            </p>
            <button id="upgrade-from-fullscreen-map" style="
              background: #ff6622;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: 600;
              cursor: pointer;
              font-family: var(--font-inter);
              text-transform: uppercase;
              letter-spacing: 1px;
            ">Upgrade</button>
          </div>
        `;
        fullscreenMapElement.style.position = 'relative';
        fullscreenMapElement.appendChild(overlay);

        let overlayTimeout: NodeJS.Timeout;
        const showOverlay = () => {
          overlay.style.opacity = '1';
          overlay.style.pointerEvents = 'auto';
          clearTimeout(overlayTimeout);
          overlayTimeout = setTimeout(() => {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
          }, 3000);
        };

        map.addListener('click', showOverlay);
        map.addListener('dragstart', showOverlay);

        const upgradeBtn = overlay.querySelector('#upgrade-from-fullscreen-map');
        if (upgradeBtn) {
          upgradeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Check session directly instead of using closure values
            const { data: { session } } = await supabase.auth.getSession();
            if (session && session.user) {
              // Update userId state if needed, then open modal
              setUserId(session.user.id);
              setIsMapFullscreen(false);
              setShowUpgradeModal(true);
            } else {
              alert('Please log in to upgrade your membership.');
            }
          });
        }
      }

      // Fetch and add artist markers to fullscreen map
      fetch('/api/artists/locations')
        .then((res) => res.json())
        .then((data) => {
          if (data.artists && data.artists.length > 0) {
            const geocoder = new (window as any).google.maps.Geocoder();
            const markers: any[] = [];

            data.artists.forEach((artist: any) => {
              geocoder.geocode({ address: artist.location }, (results: any, status: string) => {
                if (status === 'OK' && results[0]) {
                  const marker = new (window as any).google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    title: artist.name,
                  });

                  const infoWindow = new (window as any).google.maps.InfoWindow({
                    content: `
                      <div style="padding: 8px; min-width: 150px;">
                        <div style="font-weight: 600; margin-bottom: 4px; font-family: var(--font-inter);">${artist.name}</div>
                        <div style="font-size: 0.9em; color: #666; font-family: var(--font-inter);">${artist.location}</div>
                      </div>
                    `,
                  });

                  marker.addListener('click', () => {
                    // Close all other info windows
                    markers.forEach((m: any) => {
                      if (m.infoWindow) {
                        m.infoWindow.close();
                      }
                    });
                    infoWindow.open(map, marker);
                  });

                  markers.push({ marker, infoWindow });
                }
              });
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching artist locations:', error);
        });
    }
  }, [isMapFullscreen, mapLoaded, fullscreenMapInstance, hasPaidMembership, isLoggedIn, userId]);

  // Update fullscreen map controls when membership status changes
  useEffect(() => {
    if (fullscreenMapInstance) {
      fullscreenMapInstance.setOptions({
        gestureHandling: hasPaidMembership ? 'auto' : 'none',
        zoomControl: hasPaidMembership,
        scrollwheel: hasPaidMembership,
        disableDoubleClickZoom: !hasPaidMembership,
        draggable: hasPaidMembership,
      });

      // Remove overlay if membership becomes active
      if (hasPaidMembership) {
        const fullscreenMapElement = document.getElementById('fullscreen-map');
        if (fullscreenMapElement) {
          // Find and remove the upgrade overlay
          const overlay = fullscreenMapElement.querySelector('[data-upgrade-overlay-fullscreen="true"]');
          if (overlay) {
            overlay.remove();
          }
        }
      }
    }
  }, [fullscreenMapInstance, hasPaidMembership]);

  const fetchMeetups = async () => {
    try {
      setMeetupsLoading(true);
      const response = await fetch('/api/meetups');
      
      if (response.ok) {
        const data = await response.json();
        setMeetups(data.meetups || []);
      } else {
        console.error('Failed to fetch meetups');
        setMeetups([]);
      }
    } catch (error) {
      console.error('Error fetching meetups:', error);
      setMeetups([]);
    } finally {
      setMeetupsLoading(false);
    }
  };

  const fetchExhibitions = async () => {
    try {
      setExhibitionsLoading(true);
      const response = await fetch('/api/exhibitions');
      
      if (response.ok) {
        const data = await response.json();
        setExhibitions(data.exhibitions || []);
      } else {
        console.error('Failed to fetch exhibitions');
        setExhibitions([]);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      setExhibitions([]);
    } finally {
      setExhibitionsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await fetch('/api/groups');
      
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      } else {
        console.error('Failed to fetch groups');
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchRecentMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await fetch('/api/members/recent');
      
      if (response.ok) {
        const data = await response.json();
        setRecentMembers(data.members || []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch recent members:', response.status, errorData);
        setRecentMembers([]);
      }
    } catch (error) {
      console.error('Error fetching recent members:', error);
      setRecentMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchPosts = useCallback(async (groupId?: string | null) => {
    try {
      if (groupId) {
        setGroupPostsLoading(true);
      } else {
        setPostsLoading(true);
      }
      
      const url = groupId ? `/api/posts?group_id=${groupId}` : '/api/posts';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (groupId) {
          setGroupPosts(data.posts || []);
        } else {
          setPosts(data.posts || []);
        }
      } else {
        // Get the error details from the response
        let errorData: any = {};
        const contentType = response.headers.get('content-type');
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            errorData = { 
              error: text || `HTTP ${response.status}: ${response.statusText}`,
              rawResponse: text 
            };
          }
        } catch (parseError) {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          };
        }
        
        console.error('Failed to fetch posts:', {
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          error: errorData,
        });
        
        // Also log the error details separately for easier debugging
        if (errorData?.error) {
          console.error('Error message:', errorData.error);
        }
        if (errorData?.details) {
          console.error('Error details:', errorData.details);
        }
        if (errorData?.code) {
          console.error('Error code:', errorData.code);
        }
        
        // Show empty state - error is logged but won't break the UI
        if (groupId) {
          setGroupPosts([]);
        } else {
          setPosts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching posts (network/exception):', error);
      // Show empty state - error is logged but won't break the UI
      if (groupId) {
        setGroupPosts([]);
      } else {
        setPosts([]);
      }
    } finally {
      if (groupId) {
        setGroupPostsLoading(false);
      } else {
        setPostsLoading(false);
      }
    }
  }, []);

  // Fetch posts on load
  useEffect(() => {
    fetchPosts();
    fetchRecentMembers();
    fetchMeetups();
    fetchExhibitions();
    fetchGroups();
  }, [fetchPosts]);

  // Fetch group posts and check membership when a group is selected
  useEffect(() => {
    if (selectedGroup?.id) {
      fetchPosts(selectedGroup.id);
      checkGroupMembership(selectedGroup.id);
    } else {
      // Clear group posts when no group is selected
      setGroupPosts([]);
      setIsGroupMember(false);
    }
  }, [selectedGroup, fetchPosts]);

  const checkGroupMembership = async (groupId: string) => {
    if (!isLoggedIn || !userId) {
      setIsGroupMember(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsGroupMember(false);
        return;
      }

      const response = await fetch(`/api/groups/${groupId}/members`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsGroupMember(data.isMember || false);
      } else {
        setIsGroupMember(false);
      }
    } catch (error) {
      console.error('Error checking group membership:', error);
      setIsGroupMember(false);
    }
  };

  const handleJoinLeaveGroup = async () => {
    if (!isLoggedIn || !userId || !selectedGroup?.id || isJoiningGroup) return;

    try {
      setIsJoiningGroup(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please log in to join or leave a group.');
        setIsJoiningGroup(false);
        return;
      }

      const method = isGroupMember ? 'DELETE' : 'POST';
      const response = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update membership status - after joining, user is now a member; after leaving, they're not
        const newMembershipStatus = method === 'POST';
        setIsGroupMember(newMembershipStatus);
        
        // Update the member count in the selected group
        const newMemberCount = data.memberCount !== undefined ? data.memberCount : (newMembershipStatus ? selectedGroup.member_count + 1 : selectedGroup.member_count - 1);
        setSelectedGroup({
          ...selectedGroup,
          member_count: newMemberCount,
        });
        
        // Also update in the groups list
        setGroups(groups.map(g => 
          g.id === selectedGroup.id 
            ? { ...g, member_count: newMemberCount }
            : g
        ));
        
        // Verify membership status from server to ensure accuracy
        await checkGroupMembership(selectedGroup.id);
      } else {
        let error: any = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            error = await response.json();
          } else {
            const text = await response.text();
            error = { error: text || `HTTP ${response.status}: ${response.statusText}` };
          }
        } catch (parseError) {
          error = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Failed to join/leave group:', response.status, error);
        alert(error.error || error.details || 'Failed to join/leave group. Please try again.');
      }
    } catch (error) {
      console.error('Error joining/leaving group:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsJoiningGroup(false);
    }
  };

  const handlePostSubmit = async () => {
    if (!postText.trim() || !userId || isPosting) return;

    try {
      setIsPosting(true);
      
      // Get the current session to include the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('You must be logged in to post.');
        setIsPosting(false);
        return;
      }

      // If we're in a group view, include the group ID
      const groupId = selectedGroup?.id || null;

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: postText.trim(),
          userName,
          userHandle,
          userAvatar: userAvatar || userInitials,
          groupId: groupId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new post to the appropriate array
        if (groupId) {
          setGroupPosts([data.post, ...groupPosts]);
          // Refresh group posts
          await fetchPosts(groupId);
        } else {
          setPosts([data.post, ...posts]);
          // Refresh general posts
          await fetchPosts();
        }
        setPostText('');
        // Refresh recent members since user activity changed
        await fetchRecentMembers();
      } else {
        const error = await response.json();
        console.error('Failed to create post:', error);
        alert('Failed to post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const createUserSlug = (handle: string | null, name: string | null): string => {
    if (handle) {
      return handle.replace('@', '').toLowerCase();
    }
    if (name) {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    return '';
  };

  const handleUpgradeClick = () => {
    if (!isLoggedIn || !userId) {
      alert('Please log in to upgrade your membership.');
      return;
    }
    setShowUpgradeModal(true);
  };

  const handleUpgradeSuccess = async () => {
    // Refresh membership status from Supabase
    try {
      await supabase.auth.refreshSession();
      // The auth state change listener will pick up the updated membership status
      // and update hasPaidMembership state, which will enable map interactions
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.community} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <h2 className={styles.sectionTitle}>Community</h2>
          </ScrollAnimation>

          <div className={styles.communityGrid}>
            {/* Column 1: Recently Active Members / Groups */}
            <div className={styles.column}>
              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Recently Active Members</h3>
                  {membersLoading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                      Loading...
                    </div>
                  ) : recentMembers.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
                      No active members yet.
                    </div>
                  ) : (
                    <div className={styles.memberList}>
                      {recentMembers.map((member) => (
                        <Link key={member.id} href={`/artist/${member.slug || member.id}`} style={{ textDecoration: 'none' }}>
                          <div className={styles.memberItem}>
                            {member.avatar && member.avatar.startsWith('http') ? (
                              <div className={styles.memberAvatarImage}>
                                <Image
                                  src={member.avatar}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                                />
                              </div>
                            ) : (
                              <div className={styles.memberAvatar}>{member.initials}</div>
                            )}
                            <div className={styles.memberInfo}>
                              <p className={styles.memberName}>{member.name}</p>
                              <p className={styles.memberActivity}>{member.activity}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Groups</h3>
                  {groupsLoading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                      Loading...
                    </div>
                  ) : groups.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
                      No groups available yet.
                    </div>
                  ) : (
                    <div className={styles.groupList}>
                      {groups.map((group) => (
                        <div 
                          key={group.id} 
                          className={styles.groupItem}
                          onClick={() => {
                            setSelectedGroup(group);
                            setSelectedMeetup(null); // Clear meetup selection when group is selected
                          }}
                          style={{
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <h5 className={styles.groupName}>{group.name}</h5>
                          <p className={styles.groupMembers}>
                            {group.member_count || 0} {group.member_count === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollAnimation>
            </div>

            {/* Column 2: Community Feed, Meetup Details, or Group Feed */}
            <ScrollAnimation>
              <div className={styles.column}>
                {selectedGroup ? (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <h2 style={{ 
                        margin: 0, 
                        fontFamily: 'var(--font-inter)', 
                        fontSize: '1.75rem', 
                        fontWeight: 600, 
                        color: 'var(--text-dark)' 
                      }}>
                        {selectedGroup.name}
                      </h2>
                      <button
                        onClick={() => {
                          setSelectedGroup(null);
                          setSelectedMeetup(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: 'var(--text-light)',
                          padding: '0',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ×
                      </button>
                    </div>

                    {selectedGroup.description && (
                      <div style={{ 
                        marginBottom: '2rem',
                        paddingBottom: '2rem',
                        borderBottom: '1px solid #eee',
                      }}>
                        <p style={{ 
                          margin: 0,
                          fontFamily: 'var(--font-inter)',
                          fontSize: '1rem',
                          lineHeight: '1.6',
                          color: 'var(--text-dark)',
                        }}>
                          {selectedGroup.description}
                        </p>
                      </div>
                    )}
                    
                    {/* Member count and Join/Leave button - always visible */}
                    <div style={{ 
                      marginBottom: '2rem',
                      paddingBottom: '2rem',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <p style={{ 
                        margin: 0,
                        fontFamily: 'var(--font-inter)',
                        fontSize: '0.9rem',
                        color: 'var(--text-light)',
                      }}>
                        {selectedGroup.member_count || 0} {selectedGroup.member_count === 1 ? 'member' : 'members'}
                      </p>
                      {isLoggedIn && (
                        <button
                          onClick={handleJoinLeaveGroup}
                          disabled={isJoiningGroup}
                          style={{
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderRadius: '20px',
                            backgroundColor: '#ff6622',
                            color: 'white',
                            outline: 'none',
                            border: 'none',
                            padding: '6px 16px',
                            cursor: isJoiningGroup ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s ease',
                            opacity: isJoiningGroup ? 0.7 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isJoiningGroup) {
                              e.currentTarget.style.backgroundColor = '#e55a1a';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isJoiningGroup) {
                              e.currentTarget.style.backgroundColor = '#ff6622';
                            }
                          }}
                        >
                          {isJoiningGroup ? '...' : (isGroupMember ? 'Leave' : 'Join')}
                        </button>
                      )}
                    </div>

                    {/* Post Composer */}
                    <div className={styles.postComposer} style={{ marginBottom: '2rem' }}>
                      <Link href="/profile" style={{ textDecoration: 'none' }}>
                        {userAvatar && userAvatar.startsWith('http') ? (
                          <div className={styles.postAvatarImage}>
                            <Image
                              src={userAvatar}
                              alt="Profile"
                              width={48}
                              height={48}
                              className={styles.postAvatarImg}
                            />
                          </div>
                        ) : (
                          <div className={styles.postAvatar}>{userInitials}</div>
                        )}
                      </Link>
                      <div className={styles.composerContent}>
                        <textarea
                          className={styles.composerTextarea}
                          placeholder="What's happening?"
                          rows={3}
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                          maxLength={300}
                        />
                        <div className={styles.composerActions}>
                          <div className={styles.composerIcons}>
                            {/* Icons can be added here later (image, etc.) */}
                          </div>
                          <div className={styles.composerRight}>
                            {postText.length > 0 && (
                              <span className={styles.characterCount}>
                                {300 - postText.length}
                              </span>
                            )}
                            <button 
                              className={styles.postButton}
                              disabled={postText.trim().length === 0 || isPosting || !isLoggedIn}
                              onClick={handlePostSubmit}
                            >
                              {isPosting ? 'Posting...' : 'Post'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Group Feed */}
                    <div className={styles.postFeed}>
                      {groupPostsLoading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                          Loading posts...
                        </div>
                      ) : groupPosts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                          No posts in this group yet. Be the first to post!
                        </div>
                      ) : (
                        groupPosts.map((post) => {
                          const userSlug = createUserSlug(post.user_handle, post.user_name);
                          const artistLink = userSlug ? `/artist/${userSlug}` : `/profile`;
                          
                          return (
                            <div key={post.id} className={styles.post}>
                              <Link href={artistLink} style={{ textDecoration: 'none' }}>
                                {post.user_avatar && post.user_avatar.startsWith('http') ? (
                                  <div className={styles.postAvatarImage}>
                                    <Image
                                      src={post.user_avatar}
                                      alt="Profile"
                                      width={48}
                                      height={48}
                                      className={styles.postAvatarImg}
                                    />
                                  </div>
                                ) : (
                                  <div className={styles.postAvatar}>{post.user_avatar || 'U'}</div>
                                )}
                              </Link>
                              <div className={styles.postContent}>
                                <div className={styles.postHeader}>
                                  <Link href={artistLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <span className={styles.postName}>{post.user_name || 'User'}</span>
                                  </Link>
                                  <span className={styles.postHandle}>{post.user_handle || '@user'}</span>
                                  <span className={styles.postTime}>{formatTimeAgo(post.created_at)}</span>
                                </div>
                                <p className={styles.postText}>{post.content}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : selectedMeetup ? (
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <h2 style={{ 
                        margin: 0, 
                        fontFamily: 'var(--font-inter)', 
                        fontSize: '1.75rem', 
                        fontWeight: 600, 
                        color: 'var(--text-dark)' 
                      }}>
                        {selectedMeetup.title}
                      </h2>
                      <button
                        onClick={() => {
                          setSelectedMeetup(null);
                          setSelectedGroup(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          color: 'var(--text-light)',
                          padding: '0',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1rem',
                      paddingTop: '1.5rem',
                      borderTop: '1px solid #eee',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ 
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: 'var(--text-light)',
                            minWidth: '80px',
                          }}>Date & Time:</span>
                          <span style={{ 
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.95rem',
                            color: 'var(--text-dark)',
                          }}>
                            {(() => {
                              const eventDate = new Date(selectedMeetup.event_time);
                              const formattedDate = eventDate.toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              });
                              const formattedTime = eventDate.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              });
                              return `${formattedDate} at ${formattedTime}`;
                            })()}
                          </span>
                        </div>
                        <div style={{ 
                          marginLeft: '80px',
                        }}>
                          <p style={{ 
                            margin: 0,
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.95rem',
                            lineHeight: '1.6',
                            color: 'var(--text-dark)',
                            whiteSpace: 'pre-wrap',
                          }}>
                            {selectedMeetup.description}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-light)',
                          minWidth: '80px',
                        }}>Location:</span>
                        <span style={{ 
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.95rem',
                          color: 'var(--text-dark)',
                        }}>
                          {selectedMeetup.location}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--text-light)',
                          minWidth: '80px',
                        }}>Host:</span>
                        <span style={{ 
                          fontFamily: 'var(--font-inter)',
                          fontSize: '0.95rem',
                          color: 'var(--text-dark)',
                        }}>
                          {selectedMeetup.host_name || 'Community Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.postFeed}>
                    {/* Post Composer */}
                    <div className={styles.postComposer}>
                      <Link href="/profile" style={{ textDecoration: 'none' }}>
                        {userAvatar && userAvatar.startsWith('http') ? (
                          <div className={styles.postAvatarImage}>
                            <Image
                              src={userAvatar}
                              alt="Profile"
                              width={48}
                              height={48}
                              className={styles.postAvatarImg}
                            />
                          </div>
                        ) : (
                          <div className={styles.postAvatar}>{userInitials}</div>
                        )}
                      </Link>
                      <div className={styles.composerContent}>
                        <textarea
                          className={styles.composerTextarea}
                          placeholder="What's happening?"
                          rows={3}
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                          maxLength={300}
                        />
                        <div className={styles.composerActions}>
                          <div className={styles.composerIcons}>
                            {/* Icons can be added here later (image, etc.) */}
                          </div>
                          <div className={styles.composerRight}>
                            {postText.length > 0 && (
                              <span className={styles.characterCount}>
                                {300 - postText.length}
                              </span>
                            )}
                            <button 
                              className={styles.postButton}
                              disabled={postText.trim().length === 0 || isPosting || !isLoggedIn}
                              onClick={handlePostSubmit}
                            >
                              {isPosting ? 'Posting...' : 'Post'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {postsLoading ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                        Loading posts...
                      </div>
                    ) : posts.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>
                        No posts yet. Be the first to post!
                      </div>
                    ) : (
                      posts.map((post) => {
                        const userSlug = createUserSlug(post.user_handle, post.user_name);
                        const artistLink = userSlug ? `/artist/${userSlug}` : `/profile`;
                        
                        return (
                          <div key={post.id} className={styles.post}>
                            <Link href={artistLink} style={{ textDecoration: 'none' }}>
                              {post.user_avatar && post.user_avatar.startsWith('http') ? (
                                <div className={styles.postAvatarImage}>
                                  <Image
                                    src={post.user_avatar}
                                    alt="Profile"
                                    width={48}
                                    height={48}
                                    className={styles.postAvatarImg}
                                  />
                                </div>
                              ) : (
                                <div className={styles.postAvatar}>{post.user_avatar || 'U'}</div>
                              )}
                            </Link>
                            <div className={styles.postContent}>
                              <div className={styles.postHeader}>
                                <Link href={artistLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                  <span className={styles.postName}>{post.user_name || 'User'}</span>
                                </Link>
                                <span className={styles.postHandle}>{post.user_handle || '@user'}</span>
                                <span className={styles.postTime}>{formatTimeAgo(post.created_at)}</span>
                              </div>
                              <p className={styles.postText}>{post.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </ScrollAnimation>

            {/* Column 3: Artists Near Me / Meetups */}
            <div className={styles.column}>
              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Artists Near Me</h3>
                  
                  <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '1 / 1',
                      marginBottom: '1rem',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                      position: 'relative'
                    }}>
                      <div
                        id="community-map"
                        style={{
                          width: '100%',
                          height: '100%'
                        }}
                      />
                      <button
                        onClick={() => setIsMapFullscreen(true)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '6px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '1.2rem',
                          color: 'var(--text-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                          transition: 'all 0.2s ease',
                          zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="View fullscreen map"
                      >
                        <span style={{ lineHeight: 1 }}>[ ]</span>
                      </button>
                    </div>
                    {!hasPaidMembership && isLoggedIn && (
                      <>
                        <p style={{ 
                          color: 'var(--text-light)', 
                          fontFamily: 'var(--font-inter)',
                          marginBottom: '1rem',
                          fontSize: '0.9rem'
                        }}>
                          Try scrolling or zooming the map to upgrade and unlock full features.
                        </p>
                        <button
                          onClick={handleUpgradeClick}
                          className="inline-block focus:outline-none"
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontFamily: 'var(--font-inter)',
                            borderRadius: '20px',
                            backgroundColor: '#ff6622',
                            color: 'white',
                            outline: 'none',
                            border: 'none',
                            textDecoration: 'none',
                            transition: 'background-color 0.2s ease',
                            padding: '8px 20px',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e55a1a';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ff6622';
                          }}
                        >
                          UPGRADE
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Workshops & Meetups</h3>
                  {meetupsLoading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                      Loading...
                    </div>
                  ) : meetups.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
                      No upcoming meetups. Be the first to host one!
                    </div>
                  ) : (
                    <div className={styles.eventList}>
                      {meetups.map((meetup) => {
                        const eventDate = new Date(meetup.event_time);
                        const formattedDate = eventDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        const formattedTime = eventDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });
                        
                        return (
                          <div 
                            key={meetup.id} 
                            className={styles.eventItem}
                            onClick={() => {
                              setSelectedMeetup(meetup);
                              setSelectedGroup(null); // Clear group selection when meetup is selected
                            }}
                            style={{
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <h5 className={styles.eventName}>{meetup.title}</h5>
                            <p className={styles.eventDate}>{formattedDate} at {formattedTime}</p>
                            <p className={styles.eventLocation}>{meetup.location}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    className={styles.hostMeetupButton}
                    onClick={async () => {
                      if (!isLoggedIn) {
                        alert('Please log in to host a meetup.');
                        return;
                      }
                      
                      // Check membership status directly from session
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session?.user) {
                        const userMetadata = session.user.user_metadata;
                        const membershipStatus = userMetadata?.membership_status || userMetadata?.has_paid_membership;
                        const isPro = !!membershipStatus;
                        
                        if (!isPro) {
                          // Show upgrade modal for non-pro users
                          setShowUpgradeModal(true);
                        } else {
                          // Pro users can create meetups
                          setShowHostMeetupModal(true);
                        }
                      } else {
                        alert('Please log in to host a meetup.');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 20px',
                      marginTop: '15px',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      borderRadius: '20px',
                      backgroundColor: '#ff6622',
                      color: 'white',
                      outline: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e55a1a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff6622';
                    }}
                  >
                    Host a Meetup
                  </button>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className={styles.sidebarSection}>
                  <h3 className={styles.sidebarTitle}>Nearby Exhibitions</h3>
                  {exhibitionsLoading ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
                      Loading...
                    </div>
                  ) : exhibitions.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-light)', fontFamily: 'var(--font-inter)', fontSize: '0.9rem' }}>
                      No exhibitions listed. Be the first to post one!
                    </div>
                  ) : (
                    <div className={styles.eventList}>
                      {exhibitions.map((exhibition) => {
                        const startDate = new Date(exhibition.start_date);
                        const formattedStartDate = startDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        });
                        const endDate = exhibition.end_date ? new Date(exhibition.end_date) : null;
                        const formattedEndDate = endDate ? endDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }) : null;
                        
                        return (
                          <div 
                            key={exhibition.id} 
                            className={styles.eventItem}
                            style={{
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <h5 className={styles.eventName}>{exhibition.title}</h5>
                            <p className={styles.eventDate}>
                              {formattedStartDate}
                              {formattedEndDate && ` - ${formattedEndDate}`}
                            </p>
                            <p className={styles.eventLocation}>{exhibition.location}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    className={styles.hostMeetupButton}
                    onClick={async () => {
                      if (!isLoggedIn) {
                        alert('Please log in to post an exhibition.');
                        return;
                      }
                      
                      // Check membership status directly from session
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session?.user) {
                        const userMetadata = session.user.user_metadata;
                        const membershipStatus = userMetadata?.membership_status || userMetadata?.has_paid_membership;
                        const isPro = !!membershipStatus;
                        
                        if (!isPro) {
                          // Show upgrade modal for non-pro users
                          setShowUpgradeModal(true);
                        } else {
                          // Pro users can post exhibitions
                          setShowHostExhibitModal(true);
                        }
                      } else {
                        alert('Please log in to post an exhibition.');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 20px',
                      marginTop: '15px',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      borderRadius: '20px',
                      backgroundColor: '#ff6622',
                      color: 'white',
                      outline: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e55a1a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ff6622';
                    }}
                  >
                    Post an Exhibit
                  </button>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Map Modal */}
      {isMapFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px'
          }}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button
              onClick={() => setIsMapFullscreen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '6px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-inter)',
                fontSize: '1.3rem',
                color: 'var(--text-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s ease',
                zIndex: 10000
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Exit fullscreen"
            >
              <span style={{ lineHeight: 1 }}>[X]</span>
            </button>
            <div
              id="fullscreen-map"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            />
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={userId || ''}
        onSuccess={handleUpgradeSuccess}
      />

      {/* Host Meetup Modal */}
      <HostMeetupModal
        isOpen={showHostMeetupModal}
        onClose={() => setShowHostMeetupModal(false)}
        onSuccess={() => {
          // Refresh meetups list when a new one is created
          fetchMeetups();
        }}
      />

      {/* Host Exhibit Modal */}
      <HostExhibitModal
        isOpen={showHostExhibitModal}
        onClose={() => setShowHostExhibitModal(false)}
        onSuccess={() => {
          // Refresh exhibitions list when a new one is created
          fetchExhibitions();
        }}
      />
    </motion.div>
  );
}

