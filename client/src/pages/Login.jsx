import { Lock, Mail, User2Icon } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../configs/api'
import { useDispatch } from 'react-redux'
import { login } from '../app/features/authSlice'
import toast from 'react-hot-toast'

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const query = new URLSearchParams(window.location.search)
  const urlState = query.get('state')  
  const [state, setState] = React.useState(urlState || "login")

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/api/users/${state}`, formData)
      dispatch(login(data))
      localStorage.setItem('token', data.token)
      toast.success(data.message)
      
      // Redirect to dashboard after successful login/register
      navigate('/app')
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm text-center bg-gray-900 border border-gray-800 rounded-2xl px-6 py-8"
      >

        <h1 className="text-white text-2xl font-medium">
          {state === "login" ? "Login" : "Sign up"}
        </h1>

        <p className="text-gray-400 text-sm mt-2">
          Please {state} to continue
        </p>

        {state !== "login" && (
          <div className="flex items-center mt-6 w-full bg-gray-800 border border-gray-700 h-11 rounded-full pl-5 gap-2">
            <User2Icon size={16} color="#6B7280" />
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div className="flex items-center w-full mt-4 bg-gray-800 border border-gray-700 h-11 rounded-full pl-5 gap-2">
          <Mail size={14} color="#6B7280" />
          <input
            type="email"
            name="email"
            placeholder="Email id"
            className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex items-center mt-4 w-full bg-gray-800 border border-gray-700 h-11 rounded-full pl-5 gap-2">
          <Lock size={16} color="#6B7280" />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mt-4 text-left">
          <button type="button" className="text-xs text-green-400 hover:underline">
            Forget password?
          </button>
        </div>

        <button
          type="submit"
          className="mt-4 w-full h-10 rounded-full text-white bg-green-600 hover:bg-green-500 transition"
        >
          {state === "login" ? "Login" : "Sign up"}
        </button>

        <p
          onClick={() =>
            setState(prev => (prev === "login" ? "register" : "login"))
          }
          className="text-gray-400 text-sm mt-4 cursor-pointer"
        >
          {state === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
          <span className="text-green-400 hover:underline ml-1">
            click here
          </span>
        </p>

      </form>
    </div>
  )
}

export default Login