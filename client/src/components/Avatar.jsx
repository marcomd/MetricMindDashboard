import { useState } from 'react';

/**
 * Avatar component with image or initials fallback
 * @param {Object} props
 * @param {string} props.src - Avatar image URL
 * @param {string} props.name - User name for initials fallback
 * @param {string} props.size - Size: 'sm' (32px), 'md' (40px), 'lg' (56px)
 * @param {string} props.className - Additional CSS classes
 */
export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl'
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate a consistent color based on name
  const getGradientColors = (name) => {
    if (!name) return ['from-gray-400', 'to-gray-600'];

    const colors = [
      ['from-blue-400', 'to-blue-600'],
      ['from-purple-400', 'to-purple-600'],
      ['from-pink-400', 'to-pink-600'],
      ['from-green-400', 'to-green-600'],
      ['from-yellow-400', 'to-yellow-600'],
      ['from-red-400', 'to-red-600'],
      ['from-indigo-400', 'to-indigo-600'],
      ['from-teal-400', 'to-teal-600'],
    ];

    // Use name length to pick a consistent color
    const index = name.length % colors.length;
    return colors[index];
  };

  const initials = getInitials(name);
  const [fromColor, toColor] = getGradientColors(name);
  const shouldShowImage = src && !imageError;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        font-semibold
        transition-all duration-300
        hover:scale-105
        shadow-sm
        ${shouldShowImage ? 'bg-gray-200 dark:bg-gray-700' : `bg-gradient-to-br ${fromColor} ${toColor}`}
        ${shouldShowImage ? 'text-transparent' : 'text-white'}
        ${className}
      `}
      title={name}
    >
      {shouldShowImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
