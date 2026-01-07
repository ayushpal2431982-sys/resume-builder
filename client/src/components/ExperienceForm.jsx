import { Loader2, Plus, Sparkle, Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import api from '../configs/api'

const ExperienceForm = ({ data, onChange }) => {
  const { token } = useSelector(state => state.auth)
  const [enhancingIndex, setEnhancingIndex] = useState(null)

  const addExperience = () => {
    const newExperience = {
      company: '',
      position: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    }
    onChange([...data, newExperience])
  }

  const removeExperience = (index) => {
    onChange(data.filter((_, i) => i !== index))
  }

  const updateExperience = (index, field, value) => {
    const updatedData = [...data]
    updatedData[index] = { ...updatedData[index], [field]: value }
    onChange(updatedData)
  }

  const enhanceDescription = async (index) => {
    try {
      setEnhancingIndex(index)
      
      const currentDesc = data[index]?.description
      if (!currentDesc || currentDesc.trim() === "") {
        toast.error('Please enter some description first!')
        setEnhancingIndex(null)
        return
      }

      console.log('Enhancing description for index:', index)
      console.log('Current description:', currentDesc)

      const response = await api.post('/api/ai/enhance-experience',
        { userContent: currentDesc },
        { headers: { Authorization: token } }
      )

      console.log('Response received:', response.data)

      updateExperience(index, 'description', response.data.enhancedContent)
      toast.success('Description enhanced successfully!')
    } catch (error) {
      console.error('Enhancement error:', error)
      console.error('Error response:', error.response)
      toast.error(error?.response?.data?.message || 'Failed to enhance description')
    } finally {
      setEnhancingIndex(null)
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Professional Experience</h3>
          <p className='text-sm text-gray-500'>Add your job experience</p>
        </div>
        <button
          type='button'
          onClick={addExperience}
          className='flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors'
        >
          <Plus className='size-4' />
          Add Experience
        </button>
      </div>

      <div className='space-y-4'>
        {data && data.length > 0 && data.map((exp, index) => (
          <div key={index} className='border border-gray-300 rounded-lg p-4 bg-white'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='font-semibold text-gray-900'>Experience #{index + 1}</h4>
              <button
                type='button'
                onClick={() => removeExperience(index)}
                className='text-red-500 hover:text-red-700 p-1'
              >
                <Trash2 className='size-4' />
              </button>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <input
                type='text'
                value={exp.company || ''}
                onChange={(e) => updateExperience(index, 'company', e.target.value)}
                placeholder='Company Name'
                className='w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none text-sm'
              />
              <input
                type='text'
                value={exp.position || ''}
                onChange={(e) => updateExperience(index, 'position', e.target.value)}
                placeholder='Position/Job Title'
                className='w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none text-sm'
              />
            </div>

            <div className='grid grid-cols-2 gap-4 mt-4'>
              <div>
                <label className='block text-xs text-gray-600 mb-1'>Start Date (MM/YYYY)</label>
                <input
                  type='text'
                  value={exp.start_date || ''}
                  onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                  placeholder='02/2024'
                  className='w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none text-sm'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-600 mb-1'>End Date (MM/YYYY)</label>
                <input
                  type='text'
                  value={exp.end_date || ''}
                  onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                  placeholder='Present'
                  disabled={exp.is_current}
                  className='w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:bg-gray-100'
                />
              </div>
            </div>

            <div className='mt-4'>
              <label className='flex items-center gap-2 text-sm text-gray-700 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={exp.is_current || false}
                  onChange={(e) => {
                    updateExperience(index, 'is_current', e.target.checked)
                    if (e.target.checked) {
                      updateExperience(index, 'end_date', 'Present')
                    }
                  }}
                  className='rounded'
                />
                Currently Working Here
              </label>
            </div>

            <div className='mt-4'>
              <div className='flex items-center justify-between mb-2'>
                <label className='text-sm font-medium text-gray-700'>Job Description</label>
                <button
                  type='button'
                  disabled={enhancingIndex === index}
                  onClick={() => enhanceDescription(index)}
                  className='flex items-center gap-2 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50'
                >
                  {enhancingIndex === index ? (
                    <>
                      <Loader2 className='size-3 animate-spin' />
                      <span>Enhancing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkle className='size-3' />
                      <span>Enhance with AI</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={exp.description || ''}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                rows={5}
                placeholder='Example: Developed web applications using HTML, CSS, JavaScript, React...'
                className='w-full p-3 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none'
              />
            </div>
          </div>
        ))}

        {(!data || data.length === 0) && (
          <div className='text-center py-8 text-gray-500'>
            <p>No experience added yet. Click "Add Experience" to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExperienceForm