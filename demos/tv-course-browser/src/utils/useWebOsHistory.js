import { useEffect } from "react"
import { PATH } from "../constants"


export const useWebOsHistory = (location,navigate,isLGTV) => {
    useEffect(() => {
        const handleBackButton = () => {
            if (location.pathname === `/${PATH.HOME}` && isLGTV) {
                if (window.PalmSystem) {
                    window.PalmSystem.platformBack()
                }
                return
            }
            if (location.pathname === `/${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`) {
                navigate(`${PATH.HOME}`)
            } else if (location.pathname.startsWith(`/${PATH.ACCOUNT}`)) {
                navigate(`${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`)
            } else if (location.pathname.startsWith(`/${PATH.COURSES}`)) {
                if (location.pathname !== `/${PATH.COURSES}`) {
                    navigate(`${PATH.COURSES}`)
                } else {
                    navigate(`${PATH.HOME}`)
                }
            } else if (location.pathname.startsWith(`/${PATH.AUTH}`)) {
                if (location.pathname !== `/${PATH.AUTH}`) {
                    navigate(`${PATH.AUTH}`)
                } else {
                    navigate(`${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`)
                } 
            } else {
                window.history.back()
            }
        }
    
        const handleKeyDown = (e) => {
            if (e.keyCode === 461) {
                handleBackButton()
            }
        }
    
        window.addEventListener('keydown', handleKeyDown)
    
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [location, navigate, isLGTV])
    
}

