import React from 'react';

type CardProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  footer?: React.ReactNode;
};

export default function Card({ 
  children, 
  title, 
  subtitle, 
  actions, 
  padding = 'md',
  className = '',
  footer
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div className={`bg-white shadow-sm rounded-lg overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>}
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex space-x-2">{actions}</div>}
        </div>
      )}
      
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      
      {footer && (
        <div className="border-t border-gray-200 px-5 py-4">
          {footer}
        </div>
      )}
    </div>
  );
} 