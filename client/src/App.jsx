import React, { useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import Login from './pages/Login'
import { useDispatch, useSelector } from 'react-redux'
import api from './configs/api'
import { login, setLoading } from './app/features/authSlice'
import { Toaster } from 'react-hot-toast'

const App = () => {
  const dispatch = useDispatch()
  const { loading, user } = useSelector((state) => state.auth) // ADD THIS LINE

  useEffect(() => {
    const getUserData = async () => {
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.log('No token found, skipping auth check')
        dispatch(setLoading(false))
        return
      }

      console.log('Token found, validating...', token.substring(0, 20) + '...')

      try {
        const { data } = await api.get('/api/users/data', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        console.log('User data received:', data)
        
        if (data?.user) {
          dispatch(login({ token, user: data.user }))
          console.log('Login successful, user:', data.user.name)
        } else {
          console.log('No user data in response, clearing token')
          localStorage.removeItem('token')
          dispatch(setLoading(false))
        }
      } catch (error) {
        console.error('Auth validation failed:', error.response?.status, error.response?.data)
        // Only clear token if it's actually a 401 error
        if (error.response?.status === 401) {
          console.log('Invalid or expired token, clearing...')
          localStorage.removeItem('token')
        }
        dispatch(setLoading(false))
      }
    }

    getUserData()
  }, [dispatch])

  // ADD THIS LOADING CHECK
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />

        <Route path='app' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='builder/:resumeId' element={<ResumeBuilder />} />
        </Route>

        <Route path='view/:resumeId' element={<Preview />} />
      </Routes>
    </>
  )
}

export default App