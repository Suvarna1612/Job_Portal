import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import kconvert from "k-convert";
import moment from "moment";
import JobCard from "../components/JobCard";
import Footer from "../components/Footer";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@clerk/clerk-react";

const ApplyJob = () => {
  const { id } = useParams();
  const { getToken } = useAuth()
  const [JobData, setJobData] = useState(null);
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false)
  const [showResumeOptions, setShowResumeOptions] = useState(false)
  const [selectedResume, setSelectedResume] = useState(null)
  const [useDefaultResume, setUseDefaultResume] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [learningSuggestions, setLearningSuggestions] = useState(null)
  const navigate = useNavigate();

  const { jobs, backendUrl, userData, userApplications, fetchUserApplications } = useContext(AppContext);

  const fetchJob = async () => {
    try {
      const { data } = await axios.get(backendUrl + `/api/jobs/${id}`);

      if (data.success) {
        setJobData(data.job);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  const applyHandler = async () => {
    try {
      if(!userData){
        return toast.error("Please login to apply for this job");
      }
      
      // If resume options modal is not shown yet, show it first
      if(!showResumeOptions){
        setShowResumeOptions(true)
        return;
      }

      // If user wants to use default resume but doesn't have one
      if(useDefaultResume && !userData.resume){
        return toast.error("You don't have a default resume. Please upload one.");
      }

      // If user wants to use custom resume but hasn't selected one
      if(!useDefaultResume && !selectedResume){
        return toast.error("Please select a resume file");
      }

      setIsProcessing(true)
      const token = await getToken()

      // If using custom resume, upload it first
      if(!useDefaultResume && selectedResume){
        toast.info("Uploading resume...")
        const formData = new FormData()
        formData.append('resume', selectedResume)
        
        const uploadResponse = await axios.post(backendUrl+'/api/users/update-resume',
          formData,
          {headers:{ Authorization : `Bearer ${token}`}}
        )

        if(!uploadResponse.data.success){
          setIsProcessing(false)
          return toast.error("Failed to upload resume")
        }
      }

      toast.info("Analyzing resume...")
      const {data} = await axios.post(backendUrl+'/api/users/apply',
        {jobId: JobData._id},
        {headers: {Authorization: `Bearer ${token}`}}
      )

      setIsProcessing(false)

      if(data.success){
        toast.success(data.message)
        fetchUserApplications()
        setShowResumeOptions(false)
        setSelectedResume(null)
        setUseDefaultResume(true)
        setLearningSuggestions(null)
      }
      else{
        toast.error(data.message)
        // Show learning suggestions if available
        if(data.suggestions){
          setLearningSuggestions(data.suggestions)
        }
      }

    } catch (error) {
      setIsProcessing(false)
      toast.error(error.message)
    }
  }

  const checkAlreadyApplied = () => {
    const hasApplied = userApplications.some(item => item.jobId._id === JobData._id)
    setIsAlreadyApplied(hasApplied)
  }

  // Get the application details for this job
  const getApplicationForJob = () => {
    return userApplications.find(item => item.jobId._id === JobData._id)
  }

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    if(userApplications.length > 0 && JobData){
      checkAlreadyApplied()
    }
  },[JobData,userApplications,id])

  return JobData ? (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col py-10 container px-4 2xl:px-20 mx-auto">
        <div className="bg-white text-black rounded-lg w-ful">
          <div className="flex justify-center md:justify-between flex-wrap gap-8 px-14 py-20 mb-6 bg-sky-50 border border-sky-400 rounded-xl">
            <div className="flex flex-col md:flex-row items-center">
              <img
                className="h-24 bg-white rounded-lg p-4 mr-4 max-md:mb-4 border"
                src={JobData.companyId.image}
                alt=""
              />
              <div className="text-center md:text-left text-neutral-700">
                <h1 className="text-2xl sm:text-4xl font-medium ">
                  {JobData.title}
                </h1>
                <div className="flex flex-row flex-wrap max-md:justify-center gap-y-2 gap-6 items-center text-gray-600 mt-2">
                  <span className="flex item-center gap-1">
                    <img src={assets.suitcase_icon} alt="" />
                    {JobData.companyId.name}
                  </span>
                  <span className="flex item-center gap-1">
                    <img src={assets.location_icon} alt="" />
                    {JobData.location}
                  </span>
                  <span className="flex item-center gap-1">
                    <img src={assets.person_icon} alt="" />
                    {JobData.level}
                  </span>
                  <span className="flex item-center gap-1">
                    <img src={assets.money_icon} alt="" />
                    CTC: {kconvert.convertTo(JobData.salary)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center">
              {(() => {
                const application = getApplicationForJob()
                if (application && application.status === 'Accepted') {
                  return (
                    <div className="space-y-2">
                      <button 
                        onClick={() => navigate(`/prepare-interview/${application._id}`)}
                        className="bg-green-600 p-2.5 px-10 text-white rounded hover:bg-green-700"
                      >
                        Prepare for Job
                      </button>
                      <p className="text-green-600 font-medium">Application Accepted!</p>
                    </div>
                  )
                } else {
                  return (
                    <button onClick={applyHandler} className="bg-blue-600 p-2.5 px-10 text-white rounded ">
                      {isAlreadyApplied ? 'Already Applied' : 'Apply Now'}
                    </button>
                  )
                }
              })()}
              <p className="mt-1 text-gray-600 ">
                Posted {moment(JobData.date).fromNow()}
              </p>
            </div>
          </div>

          {/* Resume Selection Modal */}
          {showResumeOptions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Choose Resume to Apply</h3>
              
              {userData.resume ? (
                <div className="mb-4">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white bg-white">
                    <input
                      type="radio"
                      name="resumeChoice"
                      checked={useDefaultResume}
                      onChange={() => {
                        setUseDefaultResume(true)
                        setSelectedResume(null)
                      }}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">Use Default Resume</p>
                      <a
                        href={userData.resume}
                        target="_blank"
                        className="text-sm text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View current resume
                      </a>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You don't have a default resume yet. Upload one below or go to your Profile to set a default resume.
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white bg-white">
                  <input
                    type="radio"
                    name="resumeChoice"
                    checked={!useDefaultResume}
                    onChange={() => setUseDefaultResume(false)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Upload Different Resume</p>
                    <p className="text-sm text-gray-600">Choose a specific resume for this job</p>
                  </div>
                </label>
              </div>

              {!useDefaultResume && (
                <div className="ml-7 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="bg-white border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                      {selectedResume ? selectedResume.name : 'Select PDF file'}
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setSelectedResume(e.target.files[0])}
                      className="hidden"
                    />
                    <img src={assets.profile_upload_icon} alt="" className="w-5 h-5" />
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={applyHandler}
                  disabled={isProcessing}
                  className={`${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white px-6 py-2 rounded-lg flex items-center gap-2`}
                >
                  {isProcessing && (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isProcessing ? 'Processing...' : 'Submit Application'}
                </button>
                <button
                  onClick={() => {
                    setShowResumeOptions(false)
                    setSelectedResume(null)
                    setUseDefaultResume(true)
                  }}
                  disabled={isProcessing}
                  className={`border border-gray-300 px-6 py-2 rounded-lg ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Learning Suggestions */}
          {learningSuggestions && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-orange-800">
                  💡 Learning Suggestions to Improve Your Profile
                </h3>
                <button
                  onClick={() => setLearningSuggestions(null)}
                  className="text-orange-600 hover:text-orange-800"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-orange-700 mb-4">
                Based on the job requirements, here are specific areas you can focus on to become eligible for this role:
              </p>

              <div className="space-y-4">
                {learningSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 text-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {suggestion.category}: {suggestion.title}
                        </h4>
                        <p className="text-gray-600 text-sm mb-2">
                          {suggestion.description}
                        </p>
                        {suggestion.resources && suggestion.resources.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-gray-700">Recommended Resources:</span>
                            <ul className="text-xs text-blue-600 mt-1">
                              {suggestion.resources.map((resource, idx) => (
                                <li key={idx} className="ml-2">• {resource}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  💪 <strong>Pro Tip:</strong> Focus on 2-3 suggestions at a time, build projects to demonstrate your skills, 
                  and update your resume before applying again!
                </p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row justify-between items-start">
            <div className="w-full lg:w-2/3">
              <h2 className="font-bold text-2xl mb-4">Job Description</h2>
              <div
                className="rich-text"
                dangerouslySetInnerHTML={{ __html: JobData.description }}
              ></div>
              {(() => {
                const application = getApplicationForJob()
                if (application && application.status === 'Accepted') {
                  return (
                    <button 
                      onClick={() => navigate(`/prepare-interview/${application._id}`)}
                      className="bg-green-600 p-2.5 px-10 text-white rounded mt-10 hover:bg-green-700"
                    >
                      Prepare for Job
                    </button>
                  )
                } else {
                  return (
                    <button onClick={applyHandler} className="bg-blue-600 p-2.5 px-10 text-white rounded mt-10">
                      {isAlreadyApplied ? 'Already Applied' : 'Apply Now'}
                    </button>
                  )
                }
              })()}
            </div>
            {/* Right Section More Jobs */}
            <div className="w-full lg:w-1/3 mt-8 lg:mt-0 lg:ml-8 space-y-5">
              <h2>More Jobs from {JobData.companyId.name}</h2>
              {jobs
                .filter(
                  (job) =>
                    job._id !== JobData._id &&
                    job.companyId._id === JobData.companyId._id
                )
                .filter((job) => {
                  //Set of applied jobs
                  const appliedJobsIds = new Set(userApplications.map(app => app.jobId && app.jobId._id))
                  //Return true if the user is not applied for the job
                  return !appliedJobsIds.has(job._id)
                })
                .slice(0, 4)
                .map((job, index) => (
                  <JobCard key={index} job={job} />
                ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default ApplyJob;
