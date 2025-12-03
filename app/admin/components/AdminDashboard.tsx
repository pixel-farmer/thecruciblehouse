'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './AdminDashboard.module.css';

interface VisitorStats {
  total: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
  pages: Record<string, number>;
  recent: Array<{
    id: string;
    timestamp: string;
    page: string;
    ip?: string;
    userAgent?: string;
    country?: string;
    region?: string;
    city?: string;
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/visitors/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setError('');
      } else if (response.status === 401) {
        router.push('/admin/login');
      } else {
        setError('Failed to load visitor statistics');
      }
    } catch (err) {
      setError('An error occurred while loading statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUserAgent = (ua: string = '') => {
    if (ua.length > 50) {
      return ua.substring(0, 50) + '...';
    }
    return ua;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      <div className={styles.statsGrid}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.statCard}
        >
          <h3 className={styles.statLabel}>Total Visits</h3>
          <p className={styles.statValue}>{stats?.total || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.statCard}
        >
          <h3 className={styles.statLabel}>Last 24 Hours</h3>
          <p className={styles.statValue}>{stats?.last24Hours || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.statCard}
        >
          <h3 className={styles.statLabel}>Last 7 Days</h3>
          <p className={styles.statValue}>{stats?.last7Days || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.statCard}
        >
          <h3 className={styles.statLabel}>Last 30 Days</h3>
          <p className={styles.statValue}>{stats?.last30Days || 0}</p>
        </motion.div>
      </div>

      <div className={styles.contentGrid}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={styles.section}
        >
          <h2 className={styles.sectionTitle}>Page Visits</h2>
          <div className={styles.pagesList}>
            {stats && Object.entries(stats.pages).length > 0 ? (
              Object.entries(stats.pages)
                .sort(([, a], [, b]) => b - a)
                .map(([page, count]) => (
                  <div key={page} className={styles.pageItem}>
                    <span className={styles.pageName}>{page}</span>
                    <span className={styles.pageCount}>{count}</span>
                  </div>
                ))
            ) : (
              <p className={styles.emptyMessage}>No page visits recorded yet</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={styles.section}
        >
          <h2 className={styles.sectionTitle}>Recent Visits</h2>
          <div className={styles.visitsList}>
            {stats && stats.recent.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Page</th>
                    <th>Location</th>
                    <th>IP</th>
                    <th>User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((visit) => (
                    <tr key={visit.id}>
                      <td>{formatDate(visit.timestamp)}</td>
                      <td>{visit.page}</td>
                      <td className={styles.location}>
                        {visit.city && visit.region && visit.country
                          ? `${visit.city}, ${visit.region}, ${visit.country}`
                          : visit.country
                          ? visit.country
                          : 'Unknown'}
                      </td>
                      <td>{visit.ip || 'unknown'}</td>
                      <td className={styles.userAgent}>
                        {formatUserAgent(visit.userAgent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.emptyMessage}>No recent visits</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

