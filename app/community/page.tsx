'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ScrollAnimation from '../components/ScrollAnimation';
import UpgradeModal from '../components/UpgradeModal';
import HostMeetupModal from '../components/HostMeetupModal';
import HostExhibitModal from '../components/HostExhibitModal';
import CreateGroupModal from '../components/CreateGroupModal';
import EditGroupModal from '../components/EditGroupModal';
import ProBadge from '../components/ProBadge';
import FounderBadge from '../components/FounderBadge';
import styles from '../styles/Community.module.css';

// Helper function to convert URLs in text to clickable links
const linkifyText = (text: string) => {
  // URL regex pattern - matches http://, https://, and www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    // Check if part matches URL pattern
    const isUrl = /^(https?:\/\/|www\.)/i.test(part);
    if (isUrl) {
      // Ensure URL has protocol
      const url = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#ff6622',
            textDecoration: 'underline',
            wordBreak: 'break-all',
          }}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

function CommunityPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPaidMembership, setHasPaidMembership] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSignInMessage, setShowSignInMessage] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
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
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
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
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-post-menu]')) {
        setOpenPostMenuId(null);
      }
    };

    if (openPostMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openPostMenuId]);

  // Check for upgrade query parameter or checkout success
  useEffect(() => {
    const upgradeParam = searchParams?.get('upgrade');
    const sessionId = searchParams?.get('session_id');
    
    if (upgradeParam === 'true' && isLoggedIn && !hasPaidMembership) {
      setShowUpgradeModal(true);
      // Remove the query parameter from URL without reload
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/community');
      }
    }
    
    // If returning from Stripe checkout, verify and update membership
    if (sessionId && isLoggedIn) {
      const verifyCheckout = async () => {
        try {
          // Verify the checkout session and update membership if needed
          const response = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
          });

          if (response.ok) {
            // Refresh the session to get updated metadata
            await supabase.auth.refreshSession();
            // Re-check membership after refresh
            const { data: { session: refreshedSession } } = await supabase.auth.getSession();
            if (refreshedSession) {
              const userMetadata = refreshedSession.user.user_metadata || {};
              const membershipStatus = userMetadata.membership_status;
              const hasPaidMembership = userMetadata.has_paid_membership;
              const founderStatus = userMetadata.is_founder === true;
              const isPro = membershipStatus === 'active' || hasPaidMembership === true || founderStatus;
              setIsFounder(founderStatus);
              setHasPaidMembership(isPro);
            }
          } else {
            console.error('Failed to verify checkout session');
          }
        } catch (error) {
          console.error('Error verifying checkout:', error);
        } finally {
          // Remove session_id from URL
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/community');
          }
        }
      };
      verifyCheckout();
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
          
          // Check if user has paid membership or is founder
          const userMetadata = session.user.user_metadata || {};
          const membershipStatus = userMetadata.membership_status;
          const hasPaidMembership = userMetadata.has_paid_membership;
          const founderStatus = userMetadata.is_founder === true;
          const isPro = membershipStatus === 'active' || hasPaidMembership === true || founderStatus;
          setIsFounder(founderStatus);
          setHasPaidMembership(isPro);
        } else {
          setHasPaidMembership(false);
          setIsFounder(false);
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
        
        const userMetadata = session.user.user_metadata || {};
        const membershipStatus = userMetadata.membership_status;
        const hasPaidMembership = userMetadata.has_paid_membership;
        const founderStatus = userMetadata.is_founder === true;
        const isPro = membershipStatus === 'active' || hasPaidMembership === true || founderStatus;
        setIsFounder(founderStatus);
        setHasPaidMembership(isPro);
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
        gestureHandling: 'auto',
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        draggable: true,
      };

      // Add custom map style if Map ID is configured
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      if (mapId) {
        mapOptions.mapId = mapId;
      }

      const map = new (window as any).google.maps.Map(mapElement, mapOptions);
      setMapInstance(map);

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
  }, [mapLoaded, mapInstance]);


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
        gestureHandling: 'auto',
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        draggable: true,
      };

      // Add custom map style if Map ID is configured
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
      if (mapId) {
        mapOptions.mapId = mapId;
      }

      const map = new (window as any).google.maps.Map(fullscreenMapElement, mapOptions);
      setFullscreenMapInstance(map);

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
  }, [isMapFullscreen, mapLoaded, fullscreenMapInstance, isLoggedIn, userId]);


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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to delete posts.');
        return;
      }

      const response = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        // Remove post from state
        setPosts(posts.filter(p => p.id !== postId));
        setGroupPosts(groupPosts.filter(p => p.id !== postId));
        setOpenPostMenuId(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post');
    }
  };

  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setEditingPostContent(post.content);
    setOpenPostMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPostId) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to edit posts.');
        return;
      }

      const response = await fetch('/api/posts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: editingPostId,
          content: editingPostContent.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update post in state
        setPosts(posts.map(p => p.id === editingPostId ? data.post : p));
        setGroupPosts(groupPosts.map(p => p.id === editingPostId ? data.post : p));
        setEditingPostId(null);
        setEditingPostContent('');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('An error occurred while updating the post');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a JPEG, PNG, WebP, or GIF image');
      return;
    }

    setUploadingImage(true);
    setPostImageFile(file);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in to upload images');
        setUploadingImage(false);
        setPostImageFile(null);
        return;
      }

      // Resize image to a reasonable size (max 1200px width, maintain aspect ratio)
      const maxWidth = 1200;
      const maxSize = 1 * 1024 * 1024; // 1MB target size
      
      const resizeImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Resize if larger than max width
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with quality compression
            canvas.toBlob((blob) => {
              if (blob) {
                // If still too large, compress more
                if (blob.size > maxSize) {
                  canvas.toBlob((compressedBlob) => {
                    resolve(compressedBlob || blob);
                  }, 'image/jpeg', 0.7);
                } else {
                  resolve(blob);
                }
              } else {
                reject(new Error('Failed to convert image'));
              }
            }, 'image/jpeg', 0.85);
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(file);
        });
      };

      const resizedBlob = await resizeImage(file);
      const fileExt = 'jpg'; // Always use jpg after compression
      const fileName = `posts/${session.user.id}-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(fileName, resizedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to upload image. Please try again.';
        if (uploadError.message?.includes('new row violates row-level security') || uploadError.message?.includes('permission denied')) {
          errorMessage = 'Permission denied. The storage bucket may not be configured correctly. Please contact support.';
        } else if (uploadError.message?.includes('The resource already exists')) {
          errorMessage = 'An image with this name already exists. Please try again.';
        } else if (uploadError.message) {
          errorMessage = `Upload failed: ${uploadError.message}`;
        }
        
        alert(errorMessage);
        setUploadingImage(false);
        setPostImageFile(null);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setPostImage(urlData.publicUrl);
      } else {
        alert('Failed to get image URL');
        setPostImageFile(null);
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      alert(err.message || 'Failed to upload image');
      setPostImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    setPostImageFile(null);
  };

  const handlePostSubmit = async () => {
    if ((!postText.trim() && !postImage) || !userId || isPosting) return;

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
          imageUrl: postImage,
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
        setPostImage(null);
        setPostImageFile(null);
        // Refresh recent members since user activity changed
        await fetchRecentMembers();
      } else {
        let errorMessage = 'Failed to post. Please try again.';
        
        try {
          const errorData = await response.json();
          console.error('Failed to create post:', errorData);
          console.error('Response status:', response.status);
          
          // Provide more helpful error messages
          if (errorData?.error) {
            errorMessage = errorData.error;
            if (errorData.details) {
              errorMessage += ` ${errorData.details}`;
            }
          } else if (response.status === 400) {
            errorMessage = 'Invalid post data. Please check your post content and try again.';
          } else if (response.status === 401) {
            errorMessage = 'You must be logged in to post. Please log in and try again.';
          } else if (response.status === 403) {
            errorMessage = 'Permission denied. You do not have permission to create posts.';
          } else {
            errorMessage = `Failed to post (status: ${response.status}). Please try again.`;
          }
        } catch (parseError) {
          // If JSON parsing fails, use status-based error message
          console.error('Failed to parse error response:', parseError);
          console.error('Response status:', response.status);
          
          if (response.status === 400) {
            errorMessage = 'Invalid post data. Please check your post content and try again.';
          } else if (response.status === 401) {
            errorMessage = 'You must be logged in to post. Please log in and try again.';
          } else if (response.status === 403) {
            errorMessage = 'Permission denied. You do not have permission to create posts.';
          } else {
            errorMessage = `Failed to post (status: ${response.status}). Please try again.`;
          }
        }
        
        alert(errorMessage);
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

  // Helper function to check if user can access pro features
  const checkProAccess = async (): Promise<boolean> => {
    // Check if user is signed in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      setShowSignInMessage(true);
      return false;
    }
    
    // Check if user is pro or founder
    const userMetadata = session.user.user_metadata || {};
    const membershipStatus = userMetadata.membership_status;
    const hasPaidMembership = userMetadata.has_paid_membership;
    const isFounder = userMetadata.is_founder === true;
    const isPro = membershipStatus === 'active' || hasPaidMembership === true || isFounder;
    
    if (!isPro) {
      // Redirect to pricing page if logged in but not pro
      router.push('/pricing');
      return false;
    }
    
    return true;
  };

  const handleUpgradeClick = () => {
    if (!isLoggedIn || !userId) {
      setShowSignInMessage(true);
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
                              <div className={styles.memberAvatarImage} style={{ position: 'relative' }}>
                                <Image
                                  src={member.avatar}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                                />
                                {member.isFounder ? <FounderBadge size={14} /> : member.isPro && <ProBadge size={14} />}
                              </div>
                            ) : (
                              <div className={styles.memberAvatar} style={{ position: 'relative' }}>
                                {member.initials}
                                {member.isFounder ? <FounderBadge size={14} /> : member.isPro && <ProBadge size={14} />}
                              </div>
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
                  {/* Create Group Button - Only for Pro/Founder users */}
                  {(hasPaidMembership || isFounder) && (
                    <button
                      onClick={() => setShowCreateGroupModal(true)}
                      className={styles.createGroupButton}
                    >
                      Create a Group
                    </button>
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
                    position: 'relative',
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <h2 style={{ 
                        margin: 0, 
                        marginBottom: '-0.5rem',
                        fontFamily: 'var(--font-inter)', 
                        fontSize: '1.75rem', 
                        fontWeight: 600, 
                        color: 'var(--text-dark)' 
                      }}>
                        {selectedGroup.name}
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGroup(null);
                        setSelectedMeetup(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '2rem',
                        right: '2rem',
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

                    {selectedGroup.description && (
                      <div style={{ 
                        marginBottom: '1.5rem',
                        paddingBottom: '1.5rem',
                        borderBottom: '1px solid #eee',
                      }}>
                        <p style={{ 
                          margin: 0,
                          marginBottom: '1.5rem',
                          fontFamily: 'var(--font-inter)',
                          fontSize: '1rem',
                          lineHeight: '1.6',
                          color: 'var(--text-dark)',
                        }}>
                          {selectedGroup.description}
                        </p>
                        {selectedGroup.creator_name && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}>
                            <p style={{
                              margin: 0,
                              fontFamily: 'var(--font-inter)',
                              fontSize: '0.85rem',
                              color: 'var(--text-light)',
                              fontStyle: 'italic',
                            }}>
                              Created by {selectedGroup.creator_name}
                            </p>
                            {selectedGroup.creator_id === userId && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => setShowEditGroupModal(true)}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    fontFamily: 'var(--font-inter)',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-dark)',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                                      return;
                                    }
                                    try {
                                      const { data: { session } } = await supabase.auth.getSession();
                                      if (!session) return;

                                      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
                                        method: 'DELETE',
                                        headers: {
                                          'Authorization': `Bearer ${session.access_token}`,
                                        },
                                      });

                                      if (response.ok) {
                                        setSelectedGroup(null);
                                        fetchGroups();
                                      } else {
                                        const errorData = await response.json();
                                        alert(errorData.error || 'Failed to delete group');
                                      }
                                    } catch (error) {
                                      console.error('Error deleting group:', error);
                                      alert('Failed to delete group. Please try again.');
                                    }
                                  }}
                                  style={{
                                    padding: '0.25rem 0.75rem',
                                    fontFamily: 'var(--font-inter)',
                                    fontSize: '0.8rem',
                                    color: '#ef4444',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #ef4444',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fee2e2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {!selectedGroup.description && selectedGroup.creator_name && (
                      <div style={{ 
                        marginBottom: '1.5rem',
                        paddingBottom: '1.5rem',
                        borderBottom: '1px solid #eee',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <p style={{
                            margin: 0,
                            fontFamily: 'var(--font-inter)',
                            fontSize: '0.85rem',
                            color: 'var(--text-light)',
                            fontStyle: 'italic',
                          }}>
                            Created by {selectedGroup.creator_name}
                          </p>
                          {selectedGroup.creator_id === userId && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => setShowEditGroupModal(true)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-dark)',
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--secondary-color)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                                    return;
                                  }
                                  try {
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (!session) return;

                                    const response = await fetch(`/api/groups/${selectedGroup.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Authorization': `Bearer ${session.access_token}`,
                                      },
                                    });

                                    if (response.ok) {
                                      setSelectedGroup(null);
                                      fetchGroups();
                                    } else {
                                      const errorData = await response.json();
                                      alert(errorData.error || 'Failed to delete group');
                                    }
                                  } catch (error) {
                                    console.error('Error deleting group:', error);
                                    alert('Failed to delete group. Please try again.');
                                  }
                                }}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontFamily: 'var(--font-inter)',
                                  fontSize: '0.8rem',
                                  color: '#ef4444',
                                  backgroundColor: 'transparent',
                                  border: '1px solid #ef4444',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fee2e2';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
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
                        {postImage && (
                          <div style={{ 
                            position: 'relative', 
                            marginTop: '12px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                          }}>
                            <Image
                              src={postImage}
                              alt="Post preview"
                              width={500}
                              height={300}
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '400px',
                                objectFit: 'contain',
                                display: 'block',
                              }}
                            />
                            <button
                              onClick={handleRemoveImage}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                lineHeight: 1,
                                fontFamily: 'var(--font-inter)',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <div className={styles.composerActions}>
                          <div className={styles.composerIcons}>
                            <label
                              style={{
                                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderRadius: '50%',
                                transition: 'background-color 0.2s ease',
                                opacity: uploadingImage ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!uploadingImage) {
                                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                style={{ display: 'none' }}
                              />
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: '#ff6622' }}
                              >
                                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </label>
                          </div>
                          <div className={styles.composerRight}>
                            {postText.length > 0 && (
                              <span className={styles.characterCount}>
                                {300 - postText.length}
                              </span>
                            )}
                            <button 
                              className={styles.postButton}
                              disabled={(postText.trim().length === 0 && !postImage) || isPosting || uploadingImage || !isLoggedIn}
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
                              <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
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
                                    <div className={styles.postAvatar}>
                                      {post.user_avatar || 'U'}
                                    </div>
                                  )}
                                </Link>
                                {post.user_is_founder ? <FounderBadge size={16} /> : post.user_is_pro && <ProBadge size={16} />}
                              </div>
                              <div className={styles.postContent}>
                                <div className={styles.postHeader}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, flexWrap: 'wrap' }}>
                                    <Link href={artistLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                      <span className={styles.postName}>{post.user_name || 'User'}</span>
                                    </Link>
                                    <span className={styles.postHandle}>{post.user_handle || '@user'}</span>
                                    <span className={styles.postTime}>{formatTimeAgo(post.created_at)}</span>
                                  </div>
                                  {post.user_id === userId && (
                                    <div style={{ position: 'relative' }} data-post-menu>
                                      <button
                                        onClick={() => setOpenPostMenuId(openPostMenuId === post.id ? null : post.id)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          padding: '4px 8px',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          color: 'var(--text-light)',
                                          fontSize: '1.2rem',
                                          lineHeight: 1,
                                          transition: 'background-color 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                      >
                                        ⋯
                                      </button>
                                      {openPostMenuId === post.id && (
                                        <div className={styles.postMenuDropdown}>
                                          <button
                                            onClick={() => handleEditPost(post)}
                                            className={styles.postMenuItem}
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className={styles.postMenuItem}
                                            style={{ color: '#ef4444' }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {editingPostId === post.id ? (
                                  <div>
                                    <textarea
                                      value={editingPostContent}
                                      onChange={(e) => setEditingPostContent(e.target.value)}
                                      style={{
                                        width: '100%',
                                        minHeight: '80px',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        fontFamily: 'var(--font-inter)',
                                        fontSize: '0.95rem',
                                        resize: 'vertical',
                                        marginBottom: '8px',
                                      }}
                                      maxLength={300}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <button
                                        onClick={handleSaveEdit}
                                        style={{
                                          padding: '6px 16px',
                                          background: '#ff6622',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '20px',
                                          fontFamily: 'var(--font-inter)',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingPostId(null);
                                          setEditingPostContent('');
                                        }}
                                        style={{
                                          padding: '6px 16px',
                                          background: 'transparent',
                                          color: 'var(--text-light)',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '20px',
                                          fontFamily: 'var(--font-inter)',
                                          fontSize: '0.9rem',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {post.content && (
                                      <p className={styles.postText}>{linkifyText(post.content)}</p>
                                    )}
                                    {post.image_url && (
                                      <div style={{
                                        marginTop: '12px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border-color)',
                                      }}>
                                        <Image
                                          src={post.image_url}
                                          alt="Post image"
                                          width={500}
                                          height={300}
                                          style={{
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '500px',
                                            objectFit: 'contain',
                                            display: 'block',
                                          }}
                                        />
                                      </div>
                                    )}
                                  </>
                                )}
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
                      <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
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
                            <div className={styles.postAvatar}>
                              {userInitials}
                            </div>
                          )}
                        </Link>
                        {(() => {
                          const userMetadata = (async () => {
                            const { data: { session } } = await supabase.auth.getSession();
                            return session?.user?.user_metadata || {};
                          })();
                          // For now, check hasPaidMembership state and add founder check
                          // We'll need to add isFounder state
                          return null; // Will fix this properly below
                        })()}
                      </div>
                      <div className={styles.composerContent}>
                        <textarea
                          className={styles.composerTextarea}
                          placeholder="What's happening?"
                          rows={3}
                          value={postText}
                          onChange={(e) => setPostText(e.target.value)}
                          maxLength={300}
                        />
                        {postImage && (
                          <div style={{ 
                            position: 'relative', 
                            marginTop: '12px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                          }}>
                            <Image
                              src={postImage}
                              alt="Post preview"
                              width={500}
                              height={300}
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '400px',
                                objectFit: 'contain',
                                display: 'block',
                              }}
                            />
                            <button
                              onClick={handleRemoveImage}
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                background: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                lineHeight: 1,
                                fontFamily: 'var(--font-inter)',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <div className={styles.composerActions}>
                          <div className={styles.composerIcons}>
                            <label
                              style={{
                                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                borderRadius: '50%',
                                transition: 'background-color 0.2s ease',
                                opacity: uploadingImage ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!uploadingImage) {
                                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                onChange={handleImageUpload}
                                disabled={uploadingImage}
                                style={{ display: 'none' }}
                              />
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: '#ff6622' }}
                              >
                                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                            </label>
                          </div>
                          <div className={styles.composerRight}>
                            {postText.length > 0 && (
                              <span className={styles.characterCount}>
                                {300 - postText.length}
                              </span>
                            )}
                            <button 
                              className={styles.postButton}
                              disabled={(postText.trim().length === 0 && !postImage) || isPosting || uploadingImage || !isLoggedIn}
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
                            <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
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
                                  <div className={styles.postAvatar}>
                                    {post.user_avatar || 'U'}
                                  </div>
                                )}
                              </Link>
                              {post.user_is_founder ? <FounderBadge size={16} /> : post.user_is_pro && <ProBadge size={16} />}
                            </div>
                            <div className={styles.postContent}>
                              <div className={styles.postHeader}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, flexWrap: 'wrap' }}>
                                  <Link href={artistLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <span className={styles.postName}>{post.user_name || 'User'}</span>
                                  </Link>
                                  <span className={styles.postHandle}>{post.user_handle || '@user'}</span>
                                  <span className={styles.postTime}>{formatTimeAgo(post.created_at)}</span>
                                </div>
                                {post.user_id === userId && (
                                  <div style={{ position: 'relative' }} data-post-menu>
                                    <button
                                      onClick={() => setOpenPostMenuId(openPostMenuId === post.id ? null : post.id)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-light)',
                                        fontSize: '1.2rem',
                                        lineHeight: 1,
                                        transition: 'background-color 0.2s ease',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      ⋯
                                    </button>
                                    {openPostMenuId === post.id && (
                                      <div className={styles.postMenuDropdown}>
                                        <button
                                          onClick={() => handleEditPost(post)}
                                          className={styles.postMenuItem}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeletePost(post.id)}
                                          className={styles.postMenuItem}
                                          style={{ color: '#ef4444' }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {editingPostId === post.id ? (
                                <div>
                                  <textarea
                                    value={editingPostContent}
                                    onChange={(e) => setEditingPostContent(e.target.value)}
                                    style={{
                                      width: '100%',
                                      minHeight: '80px',
                                      padding: '8px',
                                      borderRadius: '8px',
                                      border: '1px solid var(--border-color)',
                                      fontFamily: 'var(--font-inter)',
                                      fontSize: '0.95rem',
                                      resize: 'vertical',
                                      marginBottom: '8px',
                                    }}
                                    maxLength={300}
                                  />
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                      onClick={handleSaveEdit}
                                      style={{
                                        padding: '6px 16px',
                                        background: '#ff6622',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '20px',
                                        fontFamily: 'var(--font-inter)',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingPostId(null);
                                        setEditingPostContent('');
                                      }}
                                      style={{
                                        padding: '6px 16px',
                                        background: 'transparent',
                                        color: 'var(--text-light)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '20px',
                                        fontFamily: 'var(--font-inter)',
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {post.content && (
                                    <p className={styles.postText}>{linkifyText(post.content)}</p>
                                  )}
                                  {post.image_url && (
                                    <div style={{
                                      marginTop: '12px',
                                      borderRadius: '12px',
                                      overflow: 'hidden',
                                      border: '1px solid var(--border-color)',
                                    }}>
                                      <Image
                                        src={post.image_url}
                                        alt="Post image"
                                        width={500}
                                        height={300}
                                        style={{
                                          width: '100%',
                                          height: 'auto',
                                          maxHeight: '500px',
                                          objectFit: 'contain',
                                          display: 'block',
                                        }}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
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
                      const hasAccess = await checkProAccess();
                      if (hasAccess) {
                        setShowHostMeetupModal(true);
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
                      const hasAccess = await checkProAccess();
                      if (hasAccess) {
                        setShowHostExhibitModal(true);
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

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={() => {
          // Refresh groups list when a new one is created
          fetchGroups();
        }}
      />

      {/* Edit Group Modal */}
      {selectedGroup && (
        <EditGroupModal
          isOpen={showEditGroupModal}
          onClose={() => setShowEditGroupModal(false)}
          onSuccess={async () => {
            // Refresh groups list
            await fetchGroups();
            // Refetch selected group data
            if (selectedGroup?.id) {
              const response = await fetch('/api/groups');
              if (response.ok) {
                const data = await response.json();
                const updatedGroup = data.groups?.find((g: any) => g.id === selectedGroup.id);
                if (updatedGroup) {
                  setSelectedGroup(updatedGroup);
                }
              }
            }
          }}
          group={{
            id: selectedGroup.id,
            name: selectedGroup.name,
            description: selectedGroup.description || null,
          }}
        />
      )}

      {/* Sign In Message Modal */}
      {showSignInMessage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setShowSignInMessage(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#333',
            }}>
              Sign In Required
            </h3>
            <p style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '0.95rem',
              color: '#666',
              marginBottom: '1.5rem',
            }}>
              Please sign in to use this feature.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowSignInMessage(false)}
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  color: '#333',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              <Link
                href="/login"
                style={{
                  padding: '10px 20px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  backgroundColor: '#ff6622',
                  color: 'white',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  display: 'inline-block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e55a1a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff6622';
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingTop: '120px'
      }}>
        <div style={{ color: 'var(--text-light)', fontFamily: 'var(--font-inter)' }}>
          Loading...
        </div>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  );
}

