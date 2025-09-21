import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import styles from './Chart.module.scss';

const Chart = ({ 
  type = 'line',
  data = [],
  title,
  subtitle,
  height = 300,
  colors = ['#0ea5e9', '#d946ef', '#10b981', '#f59e0b', '#ef4444'],
  loading = false,
  error = null,
  className = '',
  ...props 
}) => {
  const chartClasses = [
    styles.chartContainer,
    loading && styles.loading,
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={chartClasses}>
        {(title || subtitle) && (
          <div className={styles.chartHeader}>
            {title && <h3 className={styles.chartTitle}>{title}</h3>}
            {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
          </div>
        )}
        <div className={styles.chartWrapper} style={{ height }}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner} />
            <span>Loading chart data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={chartClasses}>
        {(title || subtitle) && (
          <div className={styles.chartHeader}>
            {title && <h3 className={styles.chartTitle}>{title}</h3>}
            {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
          </div>
        )}
        <div className={styles.chartWrapper} style={{ height }}>
          <div className={styles.errorState}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>Failed to load chart: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={chartClasses}>
        {(title || subtitle) && (
          <div className={styles.chartHeader}>
            {title && <h3 className={styles.chartTitle}>{title}</h3>}
            {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
          </div>
        )}
        <div className={styles.chartWrapper} style={{ height }}>
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📊</span>
            <span>No data available</span>
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
      ...props
    };

    switch (type) {
      case 'line':
        return (
          <RechartsLineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className={styles.grid} />
            <XAxis dataKey="name" className={styles.axis} />
            <YAxis className={styles.axis} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
            <Legend />
            {Object.keys(data[0] || {})
              .filter(key => key !== 'name')
              .map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
          </RechartsLineChart>
        );

      case 'area':
        return (
          <RechartsAreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className={styles.grid} />
            <XAxis dataKey="name" className={styles.axis} />
            <YAxis className={styles.axis} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
            <Legend />
            {Object.keys(data[0] || {})
              .filter(key => key !== 'name')
              .map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
          </RechartsAreaChart>
        );

      case 'bar':
        return (
          <RechartsBarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className={styles.grid} />
            <XAxis dataKey="name" className={styles.axis} />
            <YAxis className={styles.axis} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
            <Legend />
            {Object.keys(data[0] || {})
              .filter(key => key !== 'name')
              .map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
          </RechartsBarChart>
        );

      case 'pie':
        return (
          <RechartsPieChart {...commonProps}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)'
              }}
            />
          </RechartsPieChart>
        );

      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className={chartClasses}>
      {(title || subtitle) && (
        <div className={styles.chartHeader}>
          {title && <h3 className={styles.chartTitle}>{title}</h3>}
          {subtitle && <p className={styles.chartSubtitle}>{subtitle}</p>}
        </div>
      )}
      
      <div className={styles.chartWrapper} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Specialized chart components
export const LineChart = (props) => <Chart type="line" {...props} />;
export const AreaChart = (props) => <Chart type="area" {...props} />;
export const BarChart = (props) => <Chart type="bar" {...props} />;
export const PieChart = (props) => <Chart type="pie" {...props} />;

// Quick chart components for common use cases
export const StudentEnrollmentChart = ({ data, ...props }) => (
  <Chart
    type="area"
    data={data}
    title="Student Enrollment Trends"
    subtitle="Monthly enrollment data"
    colors={['#0ea5e9', '#10b981']}
    {...props}
  />
);

export const DepartmentDistributionChart = ({ data, ...props }) => (
  <Chart
    type="pie"
    data={data}
    title="Students by Department"
    subtitle="Current semester distribution"
    {...props}
  />
);

export const ChatActivityChart = ({ data, ...props }) => (
  <Chart
    type="bar"
    data={data}
    title="Chat Activity"
    subtitle="Messages per day"
    colors={['#d946ef']}
    {...props}
  />
);

export default Chart;