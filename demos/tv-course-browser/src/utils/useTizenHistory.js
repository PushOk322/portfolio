import { useEffect } from "react"
import { PATH } from "../constants"


export const useTizenHistory = (location,navigate,isTizenTV) => {
    useEffect(() => {
        const handlePopState = () => {
            const currentPath = location.pathname
            if (currentPath === `/${PATH.HOME}` && isTizenTV()) {
                tizen.application.getCurrentApplication().exit()
                return
            }
            if (currentPath === `/${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`) {
                navigate(`${PATH.HOME}`)
            } else if (currentPath.startsWith(`/${PATH.ACCOUNT}`)) {
                navigate(`${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`)
            } else if (currentPath.startsWith(`/${PATH.COURSES}`)) {
                if (currentPath !== `/${PATH.COURSES}`) {
                    navigate(`${PATH.COURSES}`)
                } else {
                    navigate(`${PATH.HOME}`)
                }
            } else if (currentPath.startsWith(`/${PATH.AUTH}`)) {
                if (currentPath !== `/${PATH.AUTH}`) {
                    navigate(`${PATH.AUTH}`)
                } else {
                    navigate(`${PATH.ACCOUNT}/${PATH.ACCOUNT_SETTINGS}`)
                }
            } else {
                window.history.back()
            }
        }
    
        const handleKeyDown = (e) => {
            if (e.keyCode === 10009) {
                handlePopState()
            }
        }
    
        window.addEventListener('keydown', handleKeyDown)
        // window.addEventListener('popstate', handlePopState)
    
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            // window.removeEventListener('popstate', handlePopState)
        }
    }, [location, isTizenTV, navigate])
    
}

