import { useEffect } from 'react';
import { X } from 'lucide-react';

const sizeClasses = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(13,95,110,0.35)' }}
        onClick={onClose}
      />

      {/* Modal — light theme */}
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.md} rounded-2xl shadow-2xl animate-[fadeIn_0.2s_ease-out]`}
        style={{
          backgroundColor: '#faf8f5',
          border: '1px solid #b8e8f0',
          boxShadow: '0 20px 60px rgba(13,95,110,0.25), 0 4px 16px rgba(13,95,110,0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{ borderBottom: '1px solid #cef0f8', backgroundColor: '#f0f8fa' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: '#0d3d4a' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#4a8f9e' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#cef0f8'; e.currentTarget.style.color = '#0d3d4a'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = '#4a8f9e'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto" style={{ color: '#0d3d4a' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
