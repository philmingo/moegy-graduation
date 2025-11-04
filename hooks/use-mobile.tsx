import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Initialize with actual value if window is available (client-side)
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    return false // Default for SSR
  })

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev)
    }
    mql.addEventListener("change", onChange)
    
    // Set initial value only if it's different from current state
    const currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile(prev => prev !== currentIsMobile ? currentIsMobile : prev)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
