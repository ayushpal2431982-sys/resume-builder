import React, { useEffect, useState } from 'react'
import {  Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, Briefcase, ChevronLeft, ChevronRight, DownloadIcon, EyeIcon, EyeOffIcon, FileText, FolderIcon, GraduationCap, Share2Icon, Sparkles, User } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import PersonalInfoForm from '../components/PersonalInfoForm'
import ResumePreview from '../components/ResumePreview'
import TemplateSelector from '../components/TemplateSelector'
import ColorPicker from '../components/ColorPicker'
import ProfessionalSummaryForm from '../components/ProfessionalSummaryForm'
import ExperienceForm from '../components/ExperienceForm'
import EducationForm from '../components/EducationForm'
import ProjectForm from '../components/ProjectForm'
import SkillsForm from '../components/SkillsForm'

const ResumeBuilder = () => {
  const { resumeId } = useParams()
  const { token } = useSelector((state) => state.auth)

  const [resumeData, setResumeData] = useState({
    _id: '',
    title: '',
    personal_info: {},
    professional_summary: '',
    experience: [],
    education: [],
    project: [],
    skills: [],
    template: 'classic',
    accent_color: '#3B82F6',
    public: false,
  })

  const [activeSectionIndex, setActiveSectionIndex] = useState(0)
  const [removeBackground, setRemoveBackground] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sections = [
    { id: "personal", name: "personal Info", icon:User},
    { id: "summary", name: "summary", icon: FileText },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "projects", name: "Projects", icon: FolderIcon },
    { id: "skills", name: "Skills", icon: Sparkles },
  ]
   
  const activeSection = sections[activeSectionIndex]

  // Fetch resume data from backend
  const loadResume = async () => {
    try {
      setIsLoading(true)
      const { data } = await api.get(`/api/resumes/get/${resumeId}`, {
        headers: { Authorization: token },
      })
      
      if (data.resume) {
        setResumeData(data.resume)
        document.title = data.resume.title
      }
    } catch (error) {
      toast.error('Failed to load resume')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (resumeId && token) {
      loadResume()
    }
  }, [resumeId, token])

  const changeResumeVisibility = async () => {
    try {
      const updatedPublicStatus = !resumeData.public
      
      await api.put(
        '/api/resumes/update',
        {
          resumeId: resumeData._id,
          resumeData: JSON.stringify({ public: updatedPublicStatus }),
        },
        { headers: { Authorization: token } }
      )
      
      setResumeData({...resumeData, public: updatedPublicStatus})
      toast.success(updatedPublicStatus ? 'Resume is now public' : 'Resume is now private')
    } catch (error) {
      toast.error('Failed to update visibility')
    }
  }

  const handleShare = () =>{
    const frontendUrl = window.location.href.split("/app/")[0]
    const resumeUrl = frontendUrl + "/view/" + resumeId

    if(navigator.share){
      navigator.share({url: resumeUrl, text: "My Resume",})
    }else{
      navigator.clipboard.writeText(resumeUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  const downloadResume = ()=>{
    window.print()
  }

  // ✅ FIXED: Handle image file uploads properly
  const handleSaveChanges = async () => {
    try {
      const formData = new FormData()
      
      // Add resume ID
      formData.append('resumeId', resumeData._id)
      
      // Check if there's a new image file to upload
      const hasNewImageFile = resumeData.personal_info?.image instanceof File
      
      // Create a copy of resumeData for sending
      const dataToSend = { ...resumeData }
      
      if (hasNewImageFile) {
        // If there's a File object, append it separately and remove from JSON
        formData.append('image', resumeData.personal_info.image)
        
        // Remove the File object from personal_info before stringifying
        dataToSend.personal_info = {
          ...resumeData.personal_info,
          image: '' // Backend will replace this with ImageKit URL
        }
      }
      
      // Add the rest of the resume data as JSON
      formData.append('resumeData', JSON.stringify(dataToSend))
      
      // Add removeBackground setting
      formData.append('removeBackground', removeBackground)
      
      // Send the request
      const { data } = await api.put('/api/resumes/update', formData, {
        headers: { 
          Authorization: token,
          // axios automatically sets Content-Type for FormData
        }
      })
      
      // Update local state with the response (includes new image URL)
      if (data.resume) {
        setResumeData(data.resume)
      }
      
      toast.success('Changes saved successfully!')
      
    } catch (error) {
      toast.error('Failed to save changes')
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resume...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/app"
        className="inline-flex gap-2 items-center text-slate-500 hover:text-slate-700">
        <ArrowLeftIcon className="size-4" /> Back to Dashboard
      </Link>

      <h1 className="mt-6 text-2xl font-semibold">
        {resumeData.title || ''}
      </h1>

      <div className='max-w-7xl mx-auto px-4 pb-8'>
        <div className='grid lg:grid-cols-12 gap-8'>
        {/* Left panel - Form */}
        <div className='relative lg:col-span-5 rounded-lg overflow-hidden'>
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 pt-1'>
          {/* progressbar using activeSectionIndex */}
          <hr className='absolute top-0 left-0 right-0 border-2 border-gray-200'/>
          <hr className='absolute top-0 left-0 h-1 bg-gradient-to-r from-green-500 to-green-600 border-none transition-all duration-2000'
          style={{
            width: `${(activeSectionIndex * 100) / (sections.length -1)}%`
            }}/>

          {/* Section Navigation */}
          <div className='flex justify-between items-center mb-6 border-b border-gray-300 py-1'>

            <div className='flex items-center gap-2'>
              <TemplateSelector selectedTemplate={resumeData.template} onChange={(template)=> setResumeData(prev => ({...prev, template}))}/>
                <ColorPicker selectedColor={resumeData.accent_color} onChange={(color)=>setResumeData
               (prev => ({...prev, accent_color: color})) }/>
            </div>

            <div className='flex items-center'>
              {activeSectionIndex !== 0 && (
                <button onClick={()=> setActiveSectionIndex ((prevIndex)=> Math.max(prevIndex -1, 0))} className='flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all' disabled={activeSectionIndex === 0}>
                  <ChevronLeft className='size-4'/> Previous
                </button>
              )}
                 <button onClick={()=> setActiveSectionIndex ((prevIndex)=> Math.min(prevIndex + 1, sections.length - 1))} className= {`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all ${activeSectionIndex === sections.length - 1 && "opacity-50"}`} disabled={activeSectionIndex === sections.length - 1}>
                Next <ChevronRight className='size-4'/>
             </button>
            </div>

          </div>
           
           {/* Form content */}
          <div className='space-y-6'>
                {activeSection.id === 'personal' && (
                  <PersonalInfoForm data={resumeData.personal_info} onChange={(data)=>setResumeData(prev => ({...prev, personal_info: data}))} removeBackground={removeBackground} setRemoveBackground={setRemoveBackground}/>
                )}
                {activeSection.id === "summary" && (
                  <ProfessionalSummaryForm data={resumeData.professional_summary}
                  onChange={(data)=> setResumeData(prev=> ({...prev, professional_summary: data}))} setResumeData={setResumeData}/>
                )}
                 {activeSection.id === "experience" && (
                 <ExperienceForm data={resumeData.experience}
                 onChange={(data)=> setResumeData(prev=> ({...prev, experience: data}))}/>
                 )}
                 {activeSection.id === "education" && (
                 <EducationForm data={resumeData.education}
                 onChange={(data)=> setResumeData(prev=> ({...prev, education: data}))}/>
                )} 
                 {activeSection.id === "projects" && (
                 <ProjectForm data={resumeData.project}
                 onChange={(data)=> setResumeData(prev=> ({...prev, project: data}))}/>
                )} 
                 {activeSection.id === "skills" && (
                  <SkillsForm data={resumeData.skills}
                  onChange={(data)=> setResumeData(prev=> ({...prev, skills: data}))}/>
                 )} 
                
          </div>
          <button 
            onClick={handleSaveChanges}
            className='bg-gradient-to-br from-green-100 to-green-200 ring-green-300 text-green-600 ring hover:ring-green-400 transition-all rounded-md px-6 py-2 mt-6 text-sm'>
            Save Changes
          </button>
          </div>
        </div>

        {/* Right panel - preview */}
        <div className="lg:col-span-7 max-lg:mt-6">
          <div className='relative w-full'>
            <div className='absolute bottom-3 left-0 right-0 flex items-center justify-end gap-2 z-10'>
                {resumeData.public && (
                  <button onClick={handleShare} className='flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-lg ring-blue-300 hover:ring transition-colors'>
                    <Share2Icon className='size-4'/> Share
                  </button>
                )}
                <button onClick={changeResumeVisibility} className='flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 ring-purple-300 rounded-lg hover:ring transition-colors'>
                  {resumeData.public ? <EyeIcon className='size-4'/> :
                  <EyeOffIcon className='size-4'/>}
                  {resumeData.public ? "Public" : "Private"}
                </button>
                <button onClick={downloadResume} className='flex items-center gap-2 px-6 py-2 text-xs bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-lg ring-green-300 hover:ring transition-colors'>
                   <DownloadIcon className='size-4'/> Download
                </button>
            </div>
          </div>

             <ResumePreview data={resumeData} template={resumeData.template} accentColor={resumeData.accent_color}/>
        </div>

        </div>
      </div>

    </div>
  )
}

export default ResumeBuilder