import React, { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ 
  icon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        className={`w-full rounded-md border border-gray-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${
          icon ? 'pl-10' : ''
        }`}
        {...props}
      />
    </div>
  );
}; 