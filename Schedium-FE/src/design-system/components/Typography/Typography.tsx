import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const typographyVariants = cva(
  'text-gray-900 dark:text-gray-100',
  {
    variants: {
      variant: {
        h1: 'text-4xl md:text-5xl font-bold leading-tight tracking-tight',
        h2: 'text-3xl md:text-4xl font-semibold leading-tight tracking-tight',
        h3: 'text-2xl md:text-3xl font-semibold leading-snug tracking-tight',
        h4: 'text-xl md:text-2xl font-semibold leading-snug tracking-tight',
        h5: 'text-lg md:text-xl font-semibold leading-normal',
        h6: 'text-base md:text-lg font-semibold leading-normal',
        'body-large': 'text-lg font-normal leading-relaxed',
        'body': 'text-base font-normal leading-normal',
        'body-small': 'text-sm font-normal leading-normal tracking-wide',
        'body-xs': 'text-xs font-normal leading-tight tracking-wide',
        'label': 'text-sm font-medium leading-tight tracking-wide',
        'button': 'text-sm font-medium leading-tight tracking-wide',
        'caption': 'text-xs font-normal leading-tight tracking-wide text-gray-600 dark:text-gray-400',
        'overline': 'text-xs font-semibold leading-tight tracking-widest uppercase',
        'code': 'text-sm font-normal leading-tight font-mono',
      },
      color: {
        default: 'text-gray-900 dark:text-gray-100',
        muted: 'text-gray-600 dark:text-gray-400',
        subtle: 'text-gray-500 dark:text-gray-500',
        primary: 'text-primary-600 dark:text-primary-400',
        secondary: 'text-secondary-600 dark:text-secondary-400',
        success: 'text-success-600 dark:text-success-400',
        warning: 'text-warning-600 dark:text-warning-400',
        error: 'text-error-600 dark:text-error-400',
        inverse: 'text-gray-100 dark:text-gray-900',
      },
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
        justify: 'text-justify',
      },
    },
    defaultVariants: {
      variant: 'body',
      color: 'default',
      align: 'left',
    },
  }
)

export interface TypographyProps extends VariantProps<typeof typographyVariants> {
  as?: keyof JSX.IntrinsicElements
  children: React.ReactNode
  className?: string
}

export const Typography = forwardRef<any, TypographyProps>(
  ({ as = 'p', variant, color, align, children, className, ...props }, ref) => {
    const classes = cn(typographyVariants({ variant, color, align }), className)

    if (as === 'h1') return <h1 ref={ref} className={classes} {...props}>{children}</h1>
    if (as === 'h2') return <h2 ref={ref} className={classes} {...props}>{children}</h2>
    if (as === 'h3') return <h3 ref={ref} className={classes} {...props}>{children}</h3>
    if (as === 'h4') return <h4 ref={ref} className={classes} {...props}>{children}</h4>
    if (as === 'h5') return <h5 ref={ref} className={classes} {...props}>{children}</h5>
    if (as === 'h6') return <h6 ref={ref} className={classes} {...props}>{children}</h6>
    if (as === 'label') return <label ref={ref} className={classes} {...props}>{children}</label>
    if (as === 'span') return <span ref={ref} className={classes} {...props}>{children}</span>
    if (as === 'code') return <code ref={ref} className={classes} {...props}>{children}</code>
    if (as === 'div') return <div ref={ref} className={classes} {...props}>{children}</div>
    
    return <p ref={ref} className={classes} {...props}>{children}</p>
  }
)

Typography.displayName = 'Typography'

// Convenience components for common use cases
interface HeadingProps extends Omit<TypographyProps, 'variant'> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export const Heading = forwardRef<any, HeadingProps>(
  ({ level = 1, ...props }, ref) => {
    const variant = `h${level}` as TypographyProps['variant']
    return (
      <Typography
        ref={ref}
        variant={variant}
        {...props}
      />
    )
  }
)

Heading.displayName = 'Heading'

interface TextProps extends Omit<TypographyProps, 'variant'> {
  size?: 'large' | 'base' | 'small' | 'xs'
}

export const Text = forwardRef<any, TextProps>(
  ({ size = 'base', ...props }, ref) => {
    const variant = size === 'base' ? 'body' : (`body-${size}` as TypographyProps['variant'])
    return (
      <Typography
        ref={ref}
        variant={variant}
        {...props}
      />
    )
  }
)

Text.displayName = 'Text'

export const Label = forwardRef<any, Omit<TypographyProps, 'variant'>>(
  (props, ref) => (
    <Typography
      ref={ref}
      variant="label"
      as="label"
      {...props}
    />
  )
)

Label.displayName = 'Label'

export const Code = forwardRef<any, Omit<TypographyProps, 'variant'>>(
  ({ className, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="code"
      as="code"
      className={cn('bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded', className)}
      {...props}
    />
  )
)

Code.displayName = 'Code'