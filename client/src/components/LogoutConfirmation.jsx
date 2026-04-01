import { assets } from '../assets/assets'

const LogoutConfirmation = ({ isOpen, onConfirm, onCancel, companyName }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <img src={assets.cross_icon} alt="Close" className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600">
            Are you sure you want to logout from <span className="font-medium">{companyName}</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            You'll need to login again to access the recruiter dashboard.
          </p>
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default LogoutConfirmation