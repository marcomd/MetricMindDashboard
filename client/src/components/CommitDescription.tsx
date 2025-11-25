import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface CommitDescriptionProps {
  description: string | null;
}

const CommitDescription: React.FC<CommitDescriptionProps> = ({ description }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Don't render if no description
  if (!description || description.trim() === '') {
    return null;
  }

  // Debug: log when component renders with description
  console.log('CommitDescription rendered with:', description.substring(0, 50));

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('handleToggle clicked, isOpen:', isOpen);

    if (!isOpen && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate position (default: below and to the right)
      let top = rect.bottom + window.scrollY + 8;
      let left = rect.left + window.scrollX;

      // Adjust if too close to bottom
      const estimatedHeight = 200; // Approximate popup height
      if (rect.bottom + estimatedHeight > viewportHeight) {
        top = rect.top + window.scrollY - estimatedHeight - 8;
      }

      // Adjust if too close to right edge
      const popupWidth = 320; // Fixed popup width
      if (rect.left + popupWidth > viewportWidth) {
        left = viewportWidth - popupWidth - 16;
      }

      setPosition({ top, left });
    }
    setIsOpen(!isOpen);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        iconRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !iconRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={iconRef}
        onClick={handleToggle}
        className="inline-flex items-center justify-center ml-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1"
        title="View description"
        type="button"
      >
        <Info className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Commit Description
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              type="button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}
    </>
  );
};

export default CommitDescription;
