/**
 * OptimizedImage Component - Advanced image optimization with lazy loading
 * WebP support, responsive images, and intelligent loading strategies
 */

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  ImgHTMLAttributes 
} from 'react'
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver'

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'loading' | 'onError'> {
  src: string
  alt: string
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'jpeg' | 'png'
  sizes?: string
  lazy?: boolean
  placeholder?: 'blur' | 'empty' | 'skeleton' | string
  blurDataURL?: string
  priority?: boolean
  fallback?: string
  onLoad?: () => void
  onError?: (error: Event) => void
  transformations?: {
    resize?: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' }
    crop?: { x: number; y: number; width: number; height: number }
    filters?: {
      blur?: number
      brightness?: number
      contrast?: number
      grayscale?: boolean
      sepia?: boolean
    }
  }
  retina?: boolean
  progressive?: boolean
  lossless?: boolean
}

interface ImageState {
  isLoading: boolean
  isLoaded: boolean
  hasError: boolean
  currentSrc: string
}

// Image optimization utilities
class ImageOptimizer {
  private static CDN_BASE = process.env.REACT_APP_IMAGE_CDN || ''
  
  static buildOptimizedUrl(
    src: string, 
    options: {
      width?: number
      height?: number
      quality?: number
      format?: string
      transformations?: OptimizedImageProps['transformations']
      retina?: boolean
      progressive?: boolean
      lossless?: boolean
    } = {}
  ): string {
    // If it's already an optimized URL or external URL, return as-is
    if (src.startsWith('http') && !src.includes(this.CDN_BASE)) {
      return src
    }

    const {
      width,
      height,
      quality = 80,
      format = 'auto',
      transformations,
      retina = false,
      progressive = true,
      lossless = false
    } = options

    // Build optimization parameters
    const params = new URLSearchParams()

    if (width) params.set('w', (retina ? width * 2 : width).toString())
    if (height) params.set('h', (retina ? height * 2 : height).toString())
    if (quality && !lossless) params.set('q', quality.toString())
    if (format !== 'auto') params.set('f', format)
    if (progressive) params.set('progressive', 'true')
    if (lossless) params.set('lossless', 'true')

    // Apply transformations
    if (transformations) {
      if (transformations.resize) {
        const { width: rw, height: rh, fit = 'cover' } = transformations.resize
        if (rw) params.set('rw', rw.toString())
        if (rh) params.set('rh', rh.toString())
        params.set('fit', fit)
      }

      if (transformations.crop) {
        const { x, y, width: cw, height: ch } = transformations.crop
        params.set('crop', `${x},${y},${cw},${ch}`)
      }

      if (transformations.filters) {
        const filters = transformations.filters
        const filterParams: string[] = []
        
        if (filters.blur) filterParams.push(`blur(${filters.blur})`)
        if (filters.brightness) filterParams.push(`brightness(${filters.brightness})`)
        if (filters.contrast) filterParams.push(`contrast(${filters.contrast})`)
        if (filters.grayscale) filterParams.push('grayscale(100%)')
        if (filters.sepia) filterParams.push('sepia(100%)')
        
        if (filterParams.length > 0) {
          params.set('filters', filterParams.join(','))
        }
      }
    }

    // Build final URL
    const baseUrl = this.CDN_BASE ? `${this.CDN_BASE}${src}` : src
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  static generateSrcSet(
    src: string,
    sizes: number[],
    options: Parameters<typeof ImageOptimizer.buildOptimizedUrl>[1] = {}
  ): string {
    return sizes
      .map(size => {
        const url = this.buildOptimizedUrl(src, { ...options, width: size })
        return `${url} ${size}w`
      })
      .join(', ')
  }

  static generateBlurDataURL(src: string): string {
    // Generate a tiny blurred version for placeholder
    return this.buildOptimizedUrl(src, {
      width: 10,
      height: 10,
      quality: 10,
      transformations: {
        filters: { blur: 20 }
      }
    })
  }

  static detectWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }
}

// Placeholder components
const SkeletonPlaceholder: React.FC<{ width?: number; height?: number; className?: string }> = ({
  width,
  height,
  className = ''
}) => (
  <div
    className={`bg-gray-200 animate-pulse ${className}`}
    style={{ width, height }}
  />
)

const BlurPlaceholder: React.FC<{ 
  src: string
  width?: number
  height?: number
  className?: string 
}> = ({ src, width, height, className = '' }) => (
  <img
    src={src}
    className={`filter blur-sm scale-110 transition-all duration-300 ${className}`}
    style={{ width, height }}
    alt=""
    aria-hidden="true"
  />
)

// Main OptimizedImage component
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  format = 'auto',
  sizes,
  lazy = true,
  placeholder = 'blur',
  blurDataURL,
  priority = false,
  fallback,
  onLoad,
  onError,
  transformations,
  retina = false,
  progressive = true,
  lossless = false,
  className = '',
  style,
  ...props
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: !priority,
    isLoaded: false,
    hasError: false,
    currentSrc: ''
  })

  const [webPSupported, setWebPSupported] = useState<boolean>(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Detect WebP support
  useEffect(() => {
    ImageOptimizer.detectWebPSupport().then(setWebPSupported)
  }, [])

  // Intersection observer for lazy loading
  const { targetRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '50px'
  })

  // Should load image
  const shouldLoad = priority || !lazy || isIntersecting

  // Generate optimized URLs
  const optimizedSrc = ImageOptimizer.buildOptimizedUrl(src, {
    width,
    height,
    quality,
    format: format === 'auto' ? (webPSupported ? 'webp' : 'jpeg') : format,
    transformations,
    retina,
    progressive,
    lossless
  })

  // Generate srcSet for responsive images
  const srcSet = sizes && width ? 
    ImageOptimizer.generateSrcSet(src, [
      Math.round(width * 0.5),
      width,
      Math.round(width * 1.5),
      Math.round(width * 2)
    ], {
      height,
      quality,
      format: format === 'auto' ? (webPSupported ? 'webp' : 'jpeg') : format,
      transformations,
      progressive,
      lossless
    }) : undefined

  // Generate blur placeholder
  const blurPlaceholderSrc = blurDataURL || 
    (placeholder === 'blur' ? ImageOptimizer.generateBlurDataURL(src) : '')

  // Handle image load
  const handleLoad = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      isLoaded: true,
      hasError: false
    }))
    onLoad?.()
  }, [onLoad])

  // Handle image error
  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setImageState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true,
      currentSrc: fallback || prev.currentSrc
    }))
    onError?.(event.nativeEvent)
  }, [onError, fallback])

  // Start loading when should load
  useEffect(() => {
    if (shouldLoad && !imageState.isLoaded && !imageState.hasError) {
      setImageState(prev => ({
        ...prev,
        isLoading: true,
        currentSrc: optimizedSrc
      }))
    }
  }, [shouldLoad, optimizedSrc, imageState.isLoaded, imageState.hasError])

  // Preload high priority images
  useEffect(() => {
    if (priority && optimizedSrc) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = optimizedSrc
      if (srcSet) link.setAttribute('imageSrcSet', srcSet)
      if (sizes) link.setAttribute('imageSizes', sizes)
      document.head.appendChild(link)

      return () => {
        try {
          document.head.removeChild(link)
        } catch (e) {
          // Link might already be removed
        }
      }
    }
    return () => {} // Return empty cleanup function when condition is false
  }, [priority, optimizedSrc, srcSet, sizes])

  // Render placeholder
  const renderPlaceholder = () => {
    if (placeholder === 'empty') return null
    
    if (placeholder === 'skeleton') {
      return (
        <SkeletonPlaceholder
          width={width}
          height={height}
          className={className}
        />
      )
    }

    if (placeholder === 'blur' && blurPlaceholderSrc) {
      return (
        <BlurPlaceholder
          src={blurPlaceholderSrc}
          width={width}
          height={height}
          className={className}
        />
      )
    }

    if (typeof placeholder === 'string' && placeholder !== 'blur') {
      return (
        <img
          src={placeholder}
          alt=""
          className={className}
          style={{ width, height, ...style }}
          aria-hidden="true"
        />
      )
    }

    return null
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    width,
    height,
    ...style
  }

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: imageState.isLoaded ? 1 : 0
  }

  return (
    <div ref={targetRef} style={containerStyle} className={className}>
      {/* Placeholder */}
      {!imageState.isLoaded && renderPlaceholder()}
      
      {/* Main image */}
      {shouldLoad && imageState.currentSrc && (
        <img
          ref={imgRef}
          src={imageState.currentSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Loading indicator */}
      {imageState.isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        >
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {imageState.hasError && !fallback && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            color: '#6b7280'
          }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🖼️</div>
            <div className="text-sm">Imagen no disponible</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for image optimization
export const useImageOptimization = () => {
  const [webPSupported, setWebPSupported] = useState<boolean>(false)

  useEffect(() => {
    ImageOptimizer.detectWebPSupport().then(setWebPSupported)
  }, [])

  const optimizeImage = useCallback((
    src: string,
    options: Parameters<typeof ImageOptimizer.buildOptimizedUrl>[1] = {}
  ) => {
    return ImageOptimizer.buildOptimizedUrl(src, {
      ...options,
      format: options.format === 'auto' ? (webPSupported ? 'webp' : 'jpeg') : options.format
    })
  }, [webPSupported])

  const generateSrcSet = useCallback((
    src: string,
    sizes: number[],
    options: Parameters<typeof ImageOptimizer.buildOptimizedUrl>[1] = {}
  ) => {
    return ImageOptimizer.generateSrcSet(src, sizes, {
      ...options,
      format: options.format === 'auto' ? (webPSupported ? 'webp' : 'jpeg') : options.format
    })
  }, [webPSupported])

  return {
    webPSupported,
    optimizeImage,
    generateSrcSet,
    generateBlurDataURL: ImageOptimizer.generateBlurDataURL
  }
}

// Image gallery component with optimization
export const OptimizedImageGallery: React.FC<{
  images: Array<{
    src: string
    alt: string
    caption?: string
    width?: number
    height?: number
  }>
  columns?: number
  gap?: number
  className?: string
}> = ({ images, columns = 3, gap = 16, className = '' }) => {
  const galleryStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap,
    width: '100%'
  }

  return (
    <div style={galleryStyle} className={className}>
      {images.map((image, index) => (
        <div key={index} className="relative group">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="w-full h-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
            placeholder="blur"
            lazy={index > 6} // Only lazy load images after the first 6
          />
          {image.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {image.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Performance monitoring for images
export const useImagePerformance = () => {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
    cacheHitRate: 0
  })

  const trackImageLoad = useCallback((loadTime: number, cached: boolean = false) => {
    setMetrics(prev => {
      const newTotal = prev.totalImages + 1
      const newLoaded = prev.loadedImages + 1
      const newAverage = (prev.averageLoadTime * prev.loadedImages + loadTime) / newLoaded
      const newCacheHitRate = cached ? 
        (prev.cacheHitRate * prev.loadedImages + 1) / newLoaded :
        (prev.cacheHitRate * prev.loadedImages) / newLoaded

      return {
        totalImages: newTotal,
        loadedImages: newLoaded,
        failedImages: prev.failedImages,
        averageLoadTime: newAverage,
        cacheHitRate: newCacheHitRate
      }
    })
  }, [])

  const trackImageError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1,
      failedImages: prev.failedImages + 1
    }))
  }, [])

  return {
    metrics,
    trackImageLoad,
    trackImageError
  }
}

export default OptimizedImage