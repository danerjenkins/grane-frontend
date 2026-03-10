interface ProductImageProps {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  placeholderSize?: 'small' | 'medium' | 'large';
}

export default function ProductImage({
  imageUrl,
  alt,
  className = '',
  placeholderSize = 'medium',
}: ProductImageProps) {
  const iconSizes = {
    small: 'w-6 h-6',
    medium: 'w-16 h-16',
    large: 'w-24 h-24',
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  if (imageUrl) {
    return <img src={imageUrl} alt={alt} className={className} />;
  }

  return (
    <div className={`product-image-placeholder ${className}`}>
      <svg
        className={`${iconSizes[placeholderSize]} product-image-placeholder-icon`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className={`${textSizes[placeholderSize]} product-image-placeholder-text`}>
        Image coming soon
      </p>
    </div>
  );
}
