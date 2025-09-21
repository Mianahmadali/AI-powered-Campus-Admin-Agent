import React from 'react';
import styles from './Card.module.scss';

const Card = ({ 
  children, 
  title, 
  subtitle,
  icon: Icon,
  className = '', 
  variant = 'default',
  padding = 'default',
  hoverable = false,
  clickable = false,
  onClick,
  loading = false,
  ...props 
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[padding],
    hoverable && styles.hoverable,
    clickable && styles.clickable,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  const CardComponent = clickable ? 'button' : 'div';

  return (
    <CardComponent 
      className={cardClasses}
      onClick={clickable ? onClick : undefined}
      {...props}
    >
      {loading && <div className={styles.loadingOverlay} />}
      
      {(title || Icon) && (
        <div className={styles.cardHeader}>
          {Icon && (
            <div className={styles.cardIcon}>
              <Icon />
            </div>
          )}
          {title && (
            <div className={styles.cardTitleWrapper}>
              <h3 className={styles.cardTitle}>{title}</h3>
              {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
            </div>
          )}
        </div>
      )}
      
      <div className={styles.cardContent}>
        {children}
      </div>
    </CardComponent>
  );
};

// Specialized Card variants
export const StatsCard = ({ value, label, change, changeType, icon: Icon, ...props }) => {
  return (
    <Card variant="stats" {...props}>
      <div className={styles.statsContent}>
        <div className={styles.statsMain}>
          <div className={styles.statsValue}>{value}</div>
          <div className={styles.statsLabel}>{label}</div>
        </div>
        
        {Icon && (
          <div className={styles.statsIcon}>
            <Icon />
          </div>
        )}
      </div>
      
      {change !== undefined && (
        <div className={`${styles.statsChange} ${styles[changeType] || styles.neutral}`}>
          <span className={styles.changeValue}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className={styles.changeLabel}>vs last month</span>
        </div>
      )}
    </Card>
  );
};

export const ActionCard = ({ 
  title, 
  description, 
  action, 
  actionText = 'Action',
  icon: Icon,
  ...props 
}) => {
  return (
    <Card variant="action" hoverable {...props}>
      {Icon && (
        <div className={styles.actionIcon}>
          <Icon />
        </div>
      )}
      
      <div className={styles.actionContent}>
        <h4 className={styles.actionTitle}>{title}</h4>
        {description && <p className={styles.actionDescription}>{description}</p>}
      </div>
      
      <button className={styles.actionButton} onClick={action}>
        {actionText}
      </button>
    </Card>
  );
};

export const MetricCard = ({ 
  title, 
  value, 
  unit,
  trend,
  trendValue,
  color = 'primary',
  icon: Icon,
  ...props 
}) => {
  return (
    <Card variant="metric" className={styles[color]} {...props}>
      <div className={styles.metricHeader}>
        <div className={styles.metricInfo}>
          <h4 className={styles.metricTitle}>{title}</h4>
          <div className={styles.metricValue}>
            {value}
            {unit && <span className={styles.metricUnit}>{unit}</span>}
          </div>
        </div>
        
        {Icon && (
          <div className={styles.metricIcon}>
            <Icon />
          </div>
        )}
      </div>
      
      {trend && (
        <div className={`${styles.metricTrend} ${styles[trend]}`}>
          <span className={styles.trendIndicator}></span>
          <span className={styles.trendValue}>{trendValue}</span>
        </div>
      )}
    </Card>
  );
};

export default Card;