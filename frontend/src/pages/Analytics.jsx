import React, { useState, useEffect, useMemo } from 'react';
import {
  RiBarChartLine,
  RiPieChartLine,
  RiLineChartLine,
  RiDownloadLine,
  RiFilterLine,
  RiCalendarLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiGroupLine,
  RiUserAddLine,
  RiChat3Line,
  RiTimeLine
} from 'react-icons/ri';
import Card, { MetricCard, StatsCard } from '../components/Card';
import Chart from '../components/Chart';
import { api } from '../api';
import styles from './Analytics.module.scss';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('students');

  // Normalize backend shape (flat) to the UI shape (overview/trends/performance/insights)
  const normalized = useMemo(() => {
    if (!data) return null;
    if (data.overview) return data; // already in UI shape (from mock)

    const active = (data.timeseries?.last_14_days_active || []).map((d) => ({
      name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      active: d.count,
    }));
    const enrolled = (data.timeseries?.last_14_days_onboarded || []).map((d) => ({
      name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      students: d.count,
    }));

    // Merge by name so each point can have both students and active where possible
    const mergedMap = new Map();
    for (const p of enrolled) {
      mergedMap.set(p.name, { name: p.name, students: p.students || 0, active: 0 });
    }
    for (const p of active) {
      const existing = mergedMap.get(p.name) || { name: p.name, students: 0, active: 0 };
      existing.active = p.active || 0;
      mergedMap.set(p.name, existing);
    }
    const students_over_time = Array.from(mergedMap.values());

    const department_distribution = Object.entries(data.by_department || {}).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      overview: {
        total_students: data.total_students ?? 0,
        growth_rate: 0,
        active_rate: 0,
        retention_rate: 0,
        avg_session_duration: '',
      },
      trends: {
        students_over_time,
        department_distribution,
        engagement_metrics: [],
      },
      performance: {
        response_times: [],
      },
      insights: [],
    };
  }, [data]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics?range=${timeRange}`);
        setData(res.data);
        setError(null);
      } catch (e) {
        setError(e?.message || 'Failed to load analytics');
        // Mock data for development
        setData({
          overview: {
            total_students: 1234,
            growth_rate: 12.5,
            active_rate: 78.9,
            retention_rate: 94.2,
            avg_session_duration: '24m 30s'
          },
          trends: {
            students_over_time: [
              { name: 'Jan', students: 980, active: 780 },
              { name: 'Feb', students: 1050, active: 820 },
              { name: 'Mar', students: 1120, active: 890 },
              { name: 'Apr', students: 1180, active: 930 },
              { name: 'May', students: 1234, active: 974 }
            ],
            department_distribution: [
              { name: 'Computer Science', value: 324, growth: 15.2 },
              { name: 'Engineering', value: 287, growth: 8.7 },
              { name: 'Business', value: 223, growth: -2.1 },
              { name: 'Arts', value: 156, growth: 22.3 },
              { name: 'Sciences', value: 244, growth: 11.8 }
            ],
            engagement_metrics: [
              { name: 'Week 1', chats: 456, sessions: 890, duration: 25.3 },
              { name: 'Week 2', chats: 523, sessions: 920, duration: 27.1 },
              { name: 'Week 3', chats: 489, sessions: 876, duration: 23.8 },
              { name: 'Week 4', chats: 612, sessions: 985, duration: 29.4 }
            ]
          },
          performance: {
            response_times: [
              { name: 'Mon', avg: 1.2, p95: 3.1 },
              { name: 'Tue', avg: 0.9, p95: 2.8 },
              { name: 'Wed', avg: 1.1, p95: 2.9 },
              { name: 'Thu', avg: 1.3, p95: 3.4 },
              { name: 'Fri', avg: 1.0, p95: 2.7 }
            ]
          },
          insights: [
            {
              title: 'Peak Activity Hours',
              description: 'Most student interactions occur between 2-4 PM',
              trend: 'up',
              impact: 'high'
            },
            {
              title: 'Department Growth',
              description: 'Arts department showing highest growth rate at 22.3%',
              trend: 'up',
              impact: 'medium'
            },
            {
              title: 'Response Time',
              description: 'Average response time improved by 15% this month',
              trend: 'up',
              impact: 'high'
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const handleExport = () => {
    console.log('Exporting analytics data...');
    // Implement export functionality
  };

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '3 Months' },
    { value: '365d', label: '1 Year' }
  ];

  if (loading) {
    return (
      <div className={styles.analyticsPage}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <h2>Loading Analytics...</h2>
          <p>Gathering insights from your data</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.analyticsPage}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Unable to Load Analytics</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const view = normalized || data; // use normalized data when backend shape is flat

  return (
    <div className={styles.analyticsPage}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1>Analytics & Insights</h1>
            <p>Comprehensive data analysis and performance metrics</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.timeRangeSelector}>
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  className={`${styles.rangeButton} ${timeRange === range.value ? styles.active : ''}`}
                  onClick={() => setTimeRange(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <button onClick={handleExport} className={styles.exportButton}>
              <RiDownloadLine /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className={styles.overviewGrid}>
        <MetricCard
          title="Total Students"
          value={view.overview.total_students?.toLocaleString()}
          trend="up"
          trendValue={`+${view.overview.growth_rate ?? 0}%`}
          color="primary"
          icon={RiGroupLine}
        />
        <MetricCard
          title="Active Rate"
          value={view.overview.active_rate ?? 0}
          unit="%"
          trend="up"
          trendValue="+2.3%"
          color="success"
          icon={RiLineChartLine}
        />
        <MetricCard
          title="Retention Rate"
          value={view.overview.retention_rate ?? 0}
          unit="%"
          trend="stable"
          trendValue="0.1%"
          color="info"
          icon={RiUserAddLine}
        />
        <MetricCard
          title="Avg Session"
          value={view.overview.avg_session_duration || '--'}
          trend="up"
          trendValue="+12%"
          color="secondary"
          icon={RiTimeLine}
        />
      </div>

      {/* Main Charts */}
      <div className={styles.chartsSection}>
        <div className={styles.mainChart}>
          <Chart
            type="area"
            data={view.trends.students_over_time}
            title="Student Growth & Activity"
            subtitle="Track student enrollment and engagement over time"
            height={400}
            colors={['#0ea5e9', '#10b981']}
          />
        </div>
        
        <div className={styles.sideChart}>
          <Chart
            type="pie"
            data={view.trends.department_distribution}
            title="Department Distribution"
            subtitle="Current enrollment by department"
            height={400}
          />
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className={styles.engagementSection}>
        <Card title="Engagement Analysis" subtitle="Weekly interaction patterns">
          <Chart
            type="bar"
            data={view.trends.engagement_metrics}
            height={300}
            colors={['#d946ef', '#f59e0b', '#06b6d4']}
          />
        </Card>
      </div>

      {/* Performance & Insights */}
      <div className={styles.bottomSection}>
        <div className={styles.performanceChart}>
          <Card title="Response Time Performance" subtitle="System performance metrics">
            <Chart
              type="line"
              data={view.performance.response_times}
              height={250}
              colors={['#0ea5e9', '#ef4444']}
            />
          </Card>
        </div>

        <div className={styles.insightsPanel}>
          <Card title="Key Insights" className={styles.insights}>
            <div className={styles.insightsList}>
              {view.insights.map((insight, index) => (
                <div key={index} className={styles.insightItem}>
                  <div className={styles.insightHeader}>
                    <h4>{insight.title}</h4>
                    <div className={`${styles.trendIndicator} ${styles[insight.trend]}`}>
                      {insight.trend === 'up' ? <RiArrowUpLine /> : <RiArrowDownLine />}
                    </div>
                  </div>
                  <p>{insight.description}</p>
                  <div className={`${styles.impactBadge} ${styles[insight.impact]}`}>
                    {insight.impact} impact
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;