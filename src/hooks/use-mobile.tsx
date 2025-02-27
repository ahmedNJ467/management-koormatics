
import * as React from "react"

const MOBILE_BREAKPOINT = 768

interface MobileContextType {
  isMobile: boolean;
}

const MobileContext = React.createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  )
}

export function useMobileContext() {
  const context = React.useContext(MobileContext)
  if (context === undefined) {
    throw new Error("useMobileContext must be used within a MobileProvider")
  }
  return context
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
