'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-block py-2 rounded-xl focus:outline-none"
      style={{
        fontSize: '0.95rem',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        fontFamily: 'var(--font-inter)',
        borderRadius: '0.75rem',
        backgroundColor: '#ff6622',
        color: 'white',
        outline: 'none',
        border: 'none',
        transition: 'background-color 0.3s ease',
        paddingLeft: '10px',
        paddingRight: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#e55a1a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ff6622';
      }}
    >
      LOGOUT
    </button>
  );
}

