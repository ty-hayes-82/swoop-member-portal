import { useState } from 'react';

export default function LandingImage({
  src,
  srcSet,
  sizes,
  alt,
  eager = false,
  aspectRatio,
  radius = 16,
  fallback,
  width,
  height,
  style,
  ...rest
}) {
  const [failed, setFailed] = useState(false);

  if (failed && fallback) return fallback;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
      fetchpriority={eager ? 'high' : 'auto'}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        borderRadius: radius,
        aspectRatio,
        ...style,
      }}
      {...rest}
    />
  );
}
