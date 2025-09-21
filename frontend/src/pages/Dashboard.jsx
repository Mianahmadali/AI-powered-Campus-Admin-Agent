import React, { useEffect, useMemo, useState } from 'react';
import {
  RiGroupLine,
  RiUserAddLine,
  RiBuilding2Line,
  RiChat3Line,
  RiLineChartLine,
  RiCalendarLine,
  RiNotification3Line,
  RiRefreshLine,
  RiArrowUpLine,
  RiArrowDownLine
} from 'react-icons/ri';
import { api } from '../api';
import Card, { StatsCard, ActionCard, MetricCard } from '../components/Card';
import Chart, {
  StudentEnrollmentChart,
  DepartmentDistributionChart,
  ChatActivityChart
} from '../components/Chart';
import styles from './Dashboard.module.scss';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics');
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e?.message || 'Failed to load analytics');
      // Fallback mock data for development
      setData({
        total_students: 1234,
        active_last_7_days: 892,
        new_enrollments: 45,
        chat_messages: 156,
        by_department: {
          'Computer Science': 324,
          'Engineering': 287,
          'Business': 223,
          'Arts': 156,
          'Sciences': 244
        },
        timeseries: {
          last_14_days_active: [
            { date: '2024-01-01', count: 45 },
            { date: '2024-01-02', count: 52 },
            { date: '2024-01-03', count: 48 },
            { date: '2024-01-04', count: 61 },
            { date: '2024-01-05', count: 55 },
            { date: '2024-01-06', count: 67 },
            { date: '2024-01-07', count: 43 }
          ],
          last_14_days_onboarded: [
            { date: '2024-01-01', count: 12 },
            { date: '2024-01-02', count: 8 },
            { date: '2024-01-03', count: 15 },
            { date: '2024-01-04', count: 10 },
            { date: '2024-01-05', count: 18 },
            { date: '2024-01-06', count: 14 },
            { date: '2024-01-07', count: 9 }
          ]
        },
        recent_activity: [
          { type: 'enrollment', message: '5 new students enrolled', time: '2 hours ago' },
          { type: 'chat', message: '23 new chat messages', time: '4 hours ago' },
          { type: 'system', message: 'System backup completed', time: '6 hours ago' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const deptData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.by_department || {}).map(([name, value]) => ({ name, value }));
  }, [data]);

  const activeSeries = useMemo(() => {
    if (!data) return [];
    return data.timeseries?.last_14_days_active?.map(item => ({
      name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      active: item.count
    })) || [];
  }, [data]);

  const enrollmentSeries = useMemo(() => {
    if (!data) return [];
    return data.timeseries?.last_14_days_onboarded?.map(item => ({
      name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      enrolled: item.count
    })) || [];
  }, [data]);

  if (loading && !data) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <h2>Loading Dashboard...</h2>
          <p>Fetching the latest analytics data</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchData} className={styles.retryButton}>
            <RiRefreshLine /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Dashboard Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>Campus Admin Dashboard</h1>
            <p>Welcome back! Here's what's happening with your campus today.</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={handleRefresh} 
              className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
              disabled={refreshing}
            >
              <RiRefreshLine /> {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className={styles.statsGrid}>
        <StatsCard
          value={data.total_students?.toLocaleString()}
          label="Total Students"
          change={8.2}
          changeType="positive"
          icon={RiGroupLine}
        />
        <StatsCard
          value={data.active_last_7_days?.toLocaleString()}
          label="Active Last 7 Days"
          change={12.5}
          changeType="positive"
          icon={RiLineChartLine}
        />
        <StatsCard
          value={data.new_enrollments || 45}
          label="New Enrollments"
          change={-2.3}
          changeType="negative"
          icon={RiUserAddLine}
        />
        <StatsCard
          value={deptData.length}
          label="Departments"
          change={0}
          changeType="neutral"
          icon={RiBuilding2Line}
        />
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Department Distribution */}
        <div className={styles.chartCard}>
          <DepartmentDistributionChart
            data={deptData}
            height={350}
            loading={loading}
          />
        </div>

        {/* Student Activity Trend */}
        <div className={styles.chartCard}>
          <Chart
            type="line"
            data={activeSeries}
            title="Student Activity Trends"
            subtitle="Daily active students over the past 2 weeks"
            height={350}
            colors={['#0ea5e9']}
            loading={loading}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        {/* Enrollment Chart */}
        <div className={styles.fullWidthChart}>
          <Chart
            type="bar"
            data={enrollmentSeries}
            title="New Enrollments"
            subtitle="Daily enrollment numbers for the past 2 weeks"
            height={300}
            colors={['#10b981']}
            loading={loading}
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className={styles.sideContent}>
          {/* Quick Actions */}
          <Card title="Quick Actions" className={styles.quickActions}>
            <div className={styles.actionsList}>
              <ActionCard
                title="Add Student"
                description="Register a new student"
                icon={RiUserAddLine}
                actionText="Add Now"
                action={() => console.log('Add student')}
              />
              <ActionCard
                title="View Analytics"
                description="Detailed reports & insights"
                icon={RiLineChartLine}
                actionText="View All"
                action={() => console.log('View analytics')}
              />
            </div>
          </Card>

          {/* Recent Activity */}
          <Card title="Recent Activity" className={styles.recentActivity}>
            <div className={styles.activityList}>
              {data.recent_activity?.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.type === 'enrollment' && <RiUserAddLine />}
                    {activity.type === 'chat' && <RiChat3Line />}
                    {activity.type === 'system' && <RiNotification3Line />}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityMessage}>{activity.message}</div>
                    <div className={styles.activityTime}>{activity.time}</div>
                  </div>
                </div>
              )) || (
                <div className={styles.emptyActivity}>
                  <RiCalendarLine />
                  <span>No recent activity</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
