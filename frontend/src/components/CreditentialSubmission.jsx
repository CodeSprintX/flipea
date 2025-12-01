import { X, CirclePlus } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

const CredentialSubmission = ({ onClose, listing }) => {
  const [newField, setNewField] = useState("")
  const [credential, setCredential] = useState([
    { type: "email", name: "Email", value: "" },
    { type: "password", name: "Password", value: "" },
  ])

  const handleAddField = () => {
    const name = newField.trim()
    if (!name) return toast("Please enter a field name")
    setCredential((prev) => [...prev, { type: "text", name, value: "" }])
    setNewField("")
  }

  const handleSubmission = async (e) => {
    e.preventDefault()
    // TODO: Implement submission logic here (e.g., API call with credential data)
    // For now, just close modal as placeholder
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-100 flex items-center justify-center sm:p-4">
      <div className="bg-white sm:rounded-lg shadow-2xl w-full max-w-lg h-screen sm:h-[320px] flex flex-col">
        {/* header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 text-white p-4 sm:rounded-t-lg flex items-center justify-between">
          <div className='flex-1 min-w-0'>
            <h3 className="text-lg font-semibold">{listing?.title}</h3>
            <p className="text-sm mt-1">Adding Credentials for {listing?.username} on {listing?.platform}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 hover:bg-white/20 hover:bg-opacity-20 rounded-lg transition-colors" >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* form */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <form onSubmit={handleSubmission} className="flex flex-col items-start gap-4 overflow-y-scroll">
            {credential.map((cred, index) => (
              <div key={cred.type} className="grid grid-cols-[2fr_3fr_1fr] items-center gap-2">
                <label className="text-sm font-medium text-gray-800">{cred.name}</label>
                <input type="text"
                  
                  value={cred.value}
                  onChange={(e) =>
                    setCredential((prev) =>
                      prev.map((c, i) => (i === index ? { ...c, value: e.target.value } : c))
                    )
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-indigo-400"
                  placeholder={`Enter ${cred.name.toLowerCase()}`}
                />
                <X
                  className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer justify-self-end"
                  onClick={() => setCredential((prev) => prev.filter((_, i) => i !== index))}
                />
              </div>
            ))}
            {/* add more field */}
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                placeholder="Field name..."
                className="flex-1 outline-none border-b border-gray-200 px-2 py-1"
              />
              <button
                type="button"
                onClick={handleAddField}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
              >
                <CirclePlus className="w-5 h-5" />
                <span>Add</span>
              </button>
            </div>
            {/* submit button */}
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 mt-4 rounded-md w-full self-start">
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CredentialSubmission