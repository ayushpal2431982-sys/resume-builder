import { Zap } from 'lucide-react'
import React from 'react'
import Title from './Title'

const Features = () => {
  return (
    <div id='features' className='flex flex-col items-center my-10 scroll-mt-12'>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-400/10 rounded-full px-6 py-1.5">
            <Zap width={14}/>
            <span>Simple Process</span>
        </div>
        <Title title='Build your resume' description='Our streamlined process helps you create a professional resume in minutes with intelligent AI-powered tools and features.'/>

      <div className="flex flex-col md:flex-row items-center gap-10">

        {/* IMAGE */}
        <img
          className="max-w-2xl w-full transition-transform duration-300 hover:scale-105"
          src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/features/card-image-1.png"
          alt="features"
        />

        <div className="space-y-6 px-4 md:px-0">

          {/* BOX 1 */}
          <div className="group flex items-center gap-6 max-w-md p-4 rounded-xl transition-all duration-300 hover:translate-x-3 hover:bg-violet-50 hover:shadow-lg">
            <div className="p-6 aspect-square bg-violet-100 rounded-full transition-colors duration-300 group-hover:bg-violet-200">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 18.667V24.5m4.668-8.167V24.5m4.664-12.833V24.5m2.333-21L15.578 13.587a.584.584 0 0 1-.826 0l-3.84-3.84a.583.583 0 0 0-.825 0L2.332 17.5M4.668 21v3.5m4.664-8.167V24.5"
                  stroke="#7F22FE"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-700 transition-colors duration-300 group-hover:text-violet-700">
                Real-Time Analytics
              </h3>
              <p className="text-sm text-slate-600 transition-colors duration-300 group-hover:text-slate-800">
                Get instant insights into your finances with live dashboards.
              </p>
            </div>
          </div>

          {/* BOX 2 */}
          <div className="group flex items-center gap-6 max-w-md p-4 rounded-xl transition-all duration-300 hover:translate-x-3 hover:bg-green-50 hover:shadow-lg">
            <div className="p-6 aspect-square bg-green-100 rounded-full transition-colors duration-300 group-hover:bg-green-200">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M14 11.667A2.333 2.333 0 0 0 11.667 14c0 1.19-.117 2.929-.304 4.667m4.972-3.36c0 2.776 0 7.443-1.167 10.36m5.004-1.144c.14-.7.502-2.683.583-3.523M2.332 14a11.667 11.667 0 0 1 21-7m-21 11.667h.01m23.092 0c.233-2.333.152-6.246 0-7"
                  stroke="#00A63E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-700 transition-colors duration-300 group-hover:text-green-700">
                Bank-Grade Security
              </h3>
              <p className="text-sm text-slate-600 transition-colors duration-300 group-hover:text-slate-800">
                End-to-end encryption, 2FA, compliance with GDPR standards.
              </p>
            </div>
          </div>

          {/* BOX 3 */}
          <div className="group flex items-center gap-6 max-w-md p-4 rounded-xl transition-all duration-300 hover:translate-x-3 hover:bg-orange-50 hover:shadow-lg">
            <div className="p-6 aspect-square bg-orange-100 rounded-full transition-colors duration-300 group-hover:bg-orange-200">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path
                  d="M4.668 25.666h16.333a2.333 2.333 0 0 0 2.334-2.333V8.166L17.5 2.333H7a2.333 2.333 0 0 0-2.333 2.333v4.667"
                  stroke="#F54900"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-700 transition-colors duration-300 group-hover:text-orange-700">
                Customizable Reports
              </h3>
              <p className="text-sm text-slate-600 transition-colors duration-300 group-hover:text-slate-800">
                Export professional, audit-ready financial reports for tax or internal review.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Features
