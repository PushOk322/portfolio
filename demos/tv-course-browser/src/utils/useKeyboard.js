import { useEffect } from "react"



export const useKeyboard = (location, isTizenTV) => {
    useEffect(() => {
        const updateKeyboardClass = () => {
            if (window.innerHeight < 768 && isTizenTV) {
                document.body.classList.add('keyboard-open')
            } else {
                document.body.classList.remove('keyboard-open')
            }
        }
    
        const handleResize = () => {
            updateKeyboardClass()
        }
    
        window.addEventListener('resize', handleResize)
    
        updateKeyboardClass()
    
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [location])
}


