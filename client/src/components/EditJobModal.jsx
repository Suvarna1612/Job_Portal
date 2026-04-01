import { useState, useEffect } from 'react'
import { assets, JobCategories, JobLocations } from '../assets/assets'

const EditJobModal = ({ isOpen, onClose, job, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    salary: '',
    level: '',
    category: '',
    expiryDate: '',
    maxApplications: '',
    customQuestions: []
  })

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        location: job.location || '',
        salary: job.salary || '',
        level: job.level || '',
        category: job.category || '',
        expiryDate: job.expiryDate ? new Date(job.expiryDate).toISOString().split('T')[0] : '',
        maxApplications: job.maxApplications || '',
        customQuestions: job.customQuestions || []
      })
    }
  }, [job])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(job._id, formData)
  }

  const addCustomQuestion = () => {
    setFormData(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, { question: '', required: true, type: 'text' }]
    }))
  }

  const removeCustomQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.filter((_, i) => i !== index)
    }))
  }

  const updateCustomQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customQuestions: prev.customQuestions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Edit Job</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <img src={assets.cross_icon} alt="Close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Full Stack Developer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className='flex flex-wrap gap-2 text-sm'>
                {JobLocations.map((loc, i) => {
                  const locationArray = formData.location ? formData.location.split(', ') : [];
                  const isSelected = locationArray.includes(loc);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        let newLocs = [...locationArray];
                        if (isSelected) {
                          newLocs = newLocs.filter(l => l !== loc);
                        } else {
                          newLocs.push(loc);
                        }
                        setFormData(prev => ({
                          ...prev,
                          location: newLocs.join(', ')
                        }));
                      }}
                      className={`px-3 py-1.5 border rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Category</option>
                {JobCategories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <select
                name="level"
                value={formData.level}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Level</option>
                <option value="Beginner Level">Beginner Level</option>
                <option value="Intermediate Level">Intermediate Level</option>
                <option value="Senior Level">Senior Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary (USD)</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                required
                min="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 75000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (Optional)</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Applications (Optional)</label>
              <input
                type="number"
                name="maxApplications"
                value={formData.maxApplications}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="8"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Describe the job role, responsibilities, requirements..."
            />
          </div>

          {/* Custom Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Custom Questions (Optional)</label>
              <button
                type="button"
                onClick={addCustomQuestion}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <img src={assets.add_icon} alt="Add" className="w-4 h-4" />
                Add Question
              </button>
            </div>
            
            {formData.customQuestions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateCustomQuestion(index, 'question', e.target.value)}
                      placeholder="Enter your question"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className="flex items-center gap-4 mt-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => updateCustomQuestion(index, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Required
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateCustomQuestion(index, 'type', e.target.value)}
                        className="text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Text</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomQuestion(index)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <img src={assets.cross_icon} alt="Remove" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-blue-200"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditJobModal