/**
 * Loading Component
 * Reusable loading spinner and skeleton screens
 */

export function LoadingSpinner({ size = 'medium', color = 'primary' }) {
  const sizes = {
    small: '16px',
    medium: '24px',
    large: '40px',
  };

  const colors = {
    primary: '#4CAF50',
    white: '#ffffff',
    secondary: '#2196F3',
  };

  return (
    <div
      className="spinner"
      style={{
        width: sizes[size],
        height: sizes[size],
        borderColor: `${colors[color]}33`,
        borderTopColor: colors[color],
      }}
    />
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: '20px',
        background: '#f5f5f5',
      }}
    >
      <LoadingSpinner size="large" />
      <p style={{ color: '#666', fontSize: '16px' }}>{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default LoadingSpinner;
