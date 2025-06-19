/**
 * Simple Intersection Observer Hook
 * Basic implementation for image lazy loading
 */

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverProps {
  threshold?: number
  root?: Element | null
  rootMargin?: string
}

export const useIntersectionObserver = <T extends HTMLElement = HTMLElement>(
  options: UseIntersectionObserverProps = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<T>(null)

  useEffect(() => {
    if (!targetRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: options.threshold || 0.1,
        root: options.root || null,
        rootMargin: options.rootMargin || '50px',
      }
    )

    observer.observe(targetRef.current)

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current)
      }
    }
  }, [options.threshold, options.root, options.rootMargin])

  return { targetRef, isIntersecting }
}