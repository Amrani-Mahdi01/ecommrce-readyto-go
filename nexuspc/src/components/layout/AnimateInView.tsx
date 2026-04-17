'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimateInViewProps {
  children: ReactNode;
  className?: string;
  /** Animation variant applied once element enters viewport */
  variant?: 'fade-up' | 'fade-left' | 'scale' | 'fade';
  /** Delay in ms before animation starts once visible */
  delay?: number;
  /** How much of the element must be visible before triggering (0–1) */
  threshold?: number;
  /** HTML tag to render */
  as?: keyof React.JSX.IntrinsicElements;
}

const variantClass: Record<NonNullable<AnimateInViewProps['variant']>, string> = {
  'fade-up':   'reveal',
  'fade-left': 'reveal-left',
  'scale':     'reveal-scale',
  'fade':      'reveal',
};

export function AnimateInView({
  children,
  className,
  variant = 'fade-up',
  delay = 0,
  threshold = 0.12,
  as: Tag = 'div',
}: AnimateInViewProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (delay) el.style.transitionDelay = `${delay}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.unobserve(el); // fire once
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  const Comp = Tag as React.ElementType;

  return (
    <Comp
      ref={ref}
      className={cn(variantClass[variant], className)}
    >
      {children}
    </Comp>
  );
}
