import create from 'zustand'
import axios from 'axios'

const initialState = {
    status: 'idle',
    offert: null,  
}


const useOffertStore = create((set) => ({
    ...initialState,

      fetchOffertData: async () => {
        set({ status: 'loading' })
        try {
            const offertData = `${process.env.WEBPACK_BASE_URL}${process.env.WEBPACK_SCHEMA_OFFERT}`
            const response = await axios.get(offertData)
            set({
                status: 'success',
                offert: response.data  
            })
        } catch (error) {
            console.error(error)
            set({ status: 'failed' })
        }
    },
}))

export default useOffertStore
