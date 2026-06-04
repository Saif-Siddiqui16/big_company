import React from 'react';
import { COMPANY_INFO } from '../constants/companyInfo';

interface BrandedNameProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
  showLtd?: boolean;
  isWhite?: boolean;
}

export const BrandedName: React.FC<BrandedNameProps> = ({ 
  className = '', 
  size = 'md', 
  color, 
  showLtd = true,
  isWhite = false
}) => {
  const sizeClasses = {
    sm: 'text-[13px]',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-[18px]',
    '2xl': 'text-2xl',
  };

  const textColor = isWhite ? 'text-white' : (color ? '' : 'text-gray-900');
  const style = color ? { color } : {};

  // Extract "ig Innovation Group Ltd" from "Big Innovation Group Ltd"
  const remainingName = COMPANY_INFO.name.substring(1);

  return (
    <div className={`inline-block font-black tracking-tight ${sizeClasses[size]} ${textColor} ${className}`} style={style}>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        B
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          style={{ 
            position: 'absolute', 
            left: '30%', 
            top: '48%', 
            transform: 'translate(-50%, -50%)', 
            width: '0.7em', 
            height: '0.7em', 
            pointerEvents: 'none',
            color: '#f97316' // Orange-500
          }}
        >
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
        </svg>
      </span>
      {remainingName}
    </div>
  );
};
