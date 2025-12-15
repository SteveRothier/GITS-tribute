import { useState, useEffect } from 'react'

interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isSmallMobile: boolean // < 650px
  isTinyMobile: boolean // < 500px
  width: number
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    const width = window.innerWidth
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isSmallMobile: width < 650,
      isTinyMobile: width < 500,
      width
    }
  })

  useEffect(() => {
    // Créer les media queries
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)')
    const desktopQuery = window.matchMedia('(min-width: 1024px)')

    const updateState = () => {
      const width = window.innerWidth
      setState({
        isMobile: mobileQuery.matches,
        isTablet: tabletQuery.matches,
        isDesktop: desktopQuery.matches,
        isSmallMobile: width < 650,
        isTinyMobile: width < 500,
        width
      })
    }

    // Ajouter les listeners
    mobileQuery.addEventListener('change', updateState)
    tabletQuery.addEventListener('change', updateState)
    desktopQuery.addEventListener('change', updateState)
    window.addEventListener('resize', updateState)

    // Cleanup
    return () => {
      mobileQuery.removeEventListener('change', updateState)
      tabletQuery.removeEventListener('change', updateState)
      desktopQuery.removeEventListener('change', updateState)
      window.removeEventListener('resize', updateState)
    }
  }, [])

  return state
}






























