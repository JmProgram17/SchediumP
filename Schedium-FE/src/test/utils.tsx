import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/design-system/themes/ThemeProvider'

// Create a custom render function that includes providers
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

interface AllTheProvidersProps {
  children: React.ReactNode
  includeRouter?: boolean
}

function AllTheProviders({ children, includeRouter = true }: AllTheProvidersProps) {
  const queryClient = createQueryClient()

  const content = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )

  if (includeRouter) {
    return (
      <BrowserRouter>
        {content}
      </BrowserRouter>
    )
  }

  return content
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { includeRouter?: boolean },
) => {
  const { includeRouter, ...renderOptions } = options || {}
  
  return render(ui, { 
    wrapper: (props) => <AllTheProviders {...props} includeRouter={includeRouter} />, 
    ...renderOptions 
  })
}

export * from '@testing-library/react'
export { customRender as render }