'use client';

import { useEffect, useState, RefObject } from 'react';

export function useIsVisible(ref: RefObject<HTMLElement | null>) {
  const [isIntersecting, setIsIntersecting] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of the target element is visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isIntersecting;
}
