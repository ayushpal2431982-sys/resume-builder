import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token: null,
        user: null,
        loading: true
    },
    reducers: {
        login: (state, action) => {
            state.token = action.payload.token
            state.user = action.payload.user
            state.loading = false  // ADD THIS - set loading to false after login
        },
        logout: (state) => {
            state.token = null  // FIXED: was '' (empty string), should be null
            state.user = null   // FIXED: removed comma, used semicolon
            state.loading = false
            localStorage.removeItem('token')
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        }
    }
})

export const {login, logout, setLoading} = authSlice.actions

export default authSlice.reducer