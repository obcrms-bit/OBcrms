import React from 'react';

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
  description,
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  const trendColor = trend > 0 ? 'text-success-600' : 'text-danger-600';

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>

          {trend !== undefined && (
            <p className={`text-sm mt-2 font-medium ${trendColor}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}

          {description && (
            <p className="text-xs text-gray-500 mt-2">{description}</p>
          )}
        </div>

        <div className={`p-4 rounded-xl ${colorClasses[color]} flex-shrink-0`}>
          <Icon size={32} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
