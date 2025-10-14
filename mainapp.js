import React, { useState, useCallback } from 'react';
// Assuming Tailwind CSS is available

// --- CONFIGURATION ---
// IMPORTANT: This is a placeholder URL. 
// REPLACE THIS with the URL from your NEW Google Apps Script deployment (Code.gs file).
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxVXLAvVOocOmHTOmfHgnx72ZYg2ZScD8LGiSnVWLTlHsjzIQWDNJZFS6u2yQdeFzDk/exec"; 

// Define the total pool of Chromebooks for the status grid
const initialChromebooks = Array.from({ length: 15 }, (_, i) => ({
    id: `TVE-${String(i + 1).padStart(2, '0')}`, // TVE-01, TVE-02, ... TVE-15
    status: 'available', // 'available' or 'checkedOut'
}));
// --- END CONFIGURATION ---

// Utility to format number to full ID (e.g., '5' -> 'TVE-05')
const getFullId = (numberStr) => {
    const trimmedStr = numberStr.trim();
    const num = parseInt(trimmedStr, 10);
    
    // Check if the input is a valid number within the allowed range
    if (isNaN(num) || num <= 0 || num > initialChromebooks.length) {
        return '';
    }
    // Return the formatted ID string
    return `TVE-${String(num).padStart(2, '0')}`;
};

const Loader = () => (
    <div className="flex justify-center items-center p-4">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing request...
    </div>
);

const MessageModal = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
    const title = type === 'success' ? 'Success!' : 'Error!';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div className={`p-6 rounded-lg border-l-4 shadow-xl max-w-sm w-full ${bgColor}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <p className="mt-2 text-sm">{message}</p>
                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusGauge = ({ totalAvailable, totalSpare }) => {
    const total = totalSpare > 0 ? totalSpare : 1; 
    const percentage = totalSpare > 0 ? Math.round((totalAvailable / total) * 100) : 0;
    const availableCount = totalAvailable >= 0 ? totalAvailable : '...';

    let color = 'bg-green-500';
    if (percentage <= 30) {
        color = 'bg-red-500';
    } else if (percentage <= 60) {
        color = 'bg-yellow-500';
    }

    return (
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-700 border border-gray-600 w-32">
            <span className="text-xs font-semibold text-gray-300 uppercase">Available Spares</span>
            <div className="flex items-center mt-1">
                <span className="text-xl font-extrabold text-white mr-2">{availableCount}</span>
                <span className="text-sm font-medium text-gray-300">/{totalSpare}</span>
            </div>
            <div className="w-full h-1 bg-gray-600 rounded-full mt-1">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${color}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const Header = ({ totalAvailable, totalSpare }) => {
    return (
        <header className="bg-gray-800 shadow-md p-4 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-extrabold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="15" rx="2" ry="2"></rect><line x1="4" y1="21" x2="20" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    TVES Chromebook Checkout
                </h1>
                <StatusGauge totalAvailable={totalAvailable} totalSpare={totalSpare} />
            </div>
        </header>
    );
};

const ChromebookStatusGrid = ({ chromebooks, activeId, view }) => {
    const activeIdUpper = activeId.trim();

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-red-600 h-full">
            <h2 className="text-xl font-bold mb-4 text-white">
                <svg className="w-5 h-5 inline-block mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
                Spares Inventory View
            </h2>
            <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2"> 
                {chromebooks.map(cb => {
                    const isActive = cb.id === activeIdUpper;
                    let visualStatus = cb.status;

                    if (isActive) {
                        if (view === 'CHECKOUT' && cb.status === 'available') {
                            visualStatus = 'checkedOut'; 
                        } else if (view === 'RETURN' && cb.status === 'checkedOut') {
                            visualStatus = 'available';
                        }
                    }

                    const isAvailable = visualStatus === 'available';
                    const colorClass = isAvailable ? 'bg-green-500' : 'bg-red-500';

                    return (
                        <div
                            key={cb.id}
                            className={`relative flex items-center justify-center w-full aspect-square text-white font-bold text-lg rounded-lg transition-all duration-150 transform ${colorClass} shadow-md opacity-90 cursor-default
                                ${isActive ? 'ring-4 ring-yellow-400 scale-105' : ''}
                            `}
                            title={`${cb.id} is ${cb.status === 'available' ? 'Available' : 'Checked Out'} (Currently: ${isAvailable ? 'Available' : 'Checked Out'})`}
                        >
                            <span className="text-sm">
                                {cb.id.split('-')[1]}
                            </span>
                            {!isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-full h-full text-white opacity-90" viewBox="0 0 100 100">
                                        <line x1="15" y1="85" x2="85" y2="15" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ActionPanel = ({ title, icon, color, children, isHidden }) => {
    if (isHidden) return null;
    return (
        <div className={`p-6 rounded-xl shadow-lg border-t-4 ${color} bg-white transition-all duration-300`}>
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                {icon}
                {title}
            </h2>
            {children}
        </div>
    );
};

// Updated submitData for handling retries
const submitData = async (formData, retries = 3) => {
    const url = SHEET_API_URL;
    const actionType = formData.get('action');

    if (url === "YOUR_NEWLY_DEPLOYED_GOOGLE_SCRIPT_URL_HERE") {
         return { success: false, message: 'ERROR: Please replace the SHEET_API_URL in App.jsx with your newly deployed Google Script URL first.' };
    }

    // Network call is required for both CHECKOUT and RETURN
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                // Using 'no-cors' mode is required for simple form submissions to Google Apps Script.
                // NOTE: This prevents the browser from reading the server's response content.
                // We rely solely on a successful request for the action confirmation.
                mode: 'no-cors', 
                body: formData,
            });

            // In 'no-cors' mode, we check for response.type === 'opaque' to confirm success.
            if (response.ok || response.type === 'opaque') {
                
                let successMessage = `Transaction successfully logged to Google Sheet. Please verify the sheet for confirmation.`;
                
                if (actionType === 'CHECKOUT') {
                    successMessage = `Checkout logged. The system is tracking this student's Frequent Flyer status on the sheet.`;
                } else if (actionType === 'RETURN') {
                    // Message updated to reflect the new targeted update and highlighting logic
                    const id = formData.get('TVE_SPARE_ID');
                    successMessage = `Return logged for ${id}. The Google Sheet is now searching for the latest CHECKOUT row for this device and will update the action to 'RETURNED' and highlight the row green.`;
                }
                
                return { success: true, message: successMessage };
            } else {
                return { success: false, message: `Server responded with status: ${response.status}.` };
            }
        } catch (error) {
            console.error(`Fetch error (Attempt ${i + 1}):`, error);
            if (i < retries - 1) {
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
            } else {
                 return { success: false, message: `Network Error: Could not connect to the logger API after ${retries} attempts. ${error.message}` };
            }
        }
    }
    // Should be unreachable if retries > 0, but included for completeness.
    return { success: false, message: 'Failed to submit data after all retries.' };
};

const CheckoutForm = ({ onAction, chromebookNumber, setChromebookNumber, chromebooks }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState(''); // Text input value
    const [isLoading, setIsLoading] = useState(false);

    // Filter chromebooks to find only available ones and map to their numbers and IDs
    const availableChromebooks = chromebooks
        .filter(cb => cb.status === 'available')
        .map(cb => {
            // Get the non-padded number for display and value (e.g., '1' from 'TVE-01')
            const num = String(parseInt(cb.id.split('-')[1], 10)); 
            return { num, id: cb.id };
        });


    const handleNumberChange = (e) => {
        // The value from the select element is the non-padded number string ('1' through '15')
        setChromebookNumber(e.target.value);
    };

    const handleClear = () => {
        setName('');
        setEmail('');
        setReason('');
        setChromebookNumber(''); // Resets the dropdown selection
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setIsLoading(true);

        const idToSubmit = getFullId(chromebookNumber);

        if (!idToSubmit) {
            setIsLoading(false);
            onAction(false, 'Please select a valid, available Chromebook ID.', chromebookNumber, 'CHECKOUT');
            return;
        }

        // Prepare data to send to Google Script, including student name and email for Frequent Flyer tracking.
        const formData = new URLSearchParams();
        formData.append('action', 'CHECKOUT');
        formData.append('TVE_SPARE_ID', idToSubmit);
        formData.append('studentName', name.trim());
        formData.append('studentEmail', email.trim().toLowerCase()); // Crucial for tracking
        formData.append('issueReason', reason.trim()); 
        formData.append('checkedOutBy', 'FRONT_DESK'); 

        const result = await submitData(formData);
        
        setIsLoading(false);
        onAction(result.success, result.message, idToSubmit, 'CHECKOUT');

        if (result.success) {
            setName('');
            setEmail('');
            setReason('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
                <label htmlFor="student-name" className="block text-sm font-medium text-gray-700">Student Name</label>
                <input
                    type="text"
                    id="student-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-600 focus:ring-red-600 p-2 border"
                    placeholder="John Doe"
                />
            </div>

            <div>
                <label htmlFor="student-email" className="block text-sm font-medium text-gray-700">Student Email (Login ID)</label>
                <input
                    type="email"
                    id="student-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-600 focus:ring-red-600 p-2 border"
                    placeholder="firstname.lastname@tvstudents.org"
                />
            </div>
            
            {/* Chromebook ID Dropdown */}
            <div>
                <label htmlFor="checkout-id" className="block text-sm font-medium text-gray-700">Chromebook ID (Select Number)</label>
                <select
                    id="checkout-id"
                    value={chromebookNumber}
                    onChange={handleNumberChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-600 focus:ring-red-600 p-2 border bg-white font-mono"
                >
                    <option value="" disabled>Select Chromebook ID</option>
                    {availableChromebooks.map(cb => (
                        <option key={cb.num} value={cb.num}>
                            {cb.num} (TVE-SPARE-{cb.num})
                        </option>
                    ))}
                </select>
                {availableChromebooks.length === 0 && (
                     <p className="mt-1 text-sm text-red-600 font-semibold">No Chromebooks currently available for checkout.</p>
                )}
            </div>
            {/* End Chromebook ID Dropdown */}

            <div>
                <label htmlFor="issue-reason" className="block text-sm font-medium text-gray-700">Issue Reason</label>
                <input
                    type="text"
                    id="issue-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-600 focus:ring-red-600 p-2 border"
                    placeholder="Device repair, lost, dead battery, etc."
                />
            </div>
            
            <div className="flex space-x-3">
                <button
                    type="button" 
                    onClick={handleClear}
                    className="flex-shrink-0 w-1/4 flex justify-center items-center py-3 px-3 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                    title="Clear all form fields"
                >
                    {/* Clear/Reset Icon (using a circle-X for clarity) */}
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </button>

                <button
                    type="submit"
                    disabled={isLoading || availableChromebooks.length === 0}
                    className="flex-grow w-3/4 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader /> : (
                        <>
                            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M7 21l-4-4a2 2 0 010-2l7-7"></path></svg>
                            Log Checkout
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};


const ReturnForm = ({ onAction, chromebookNumber, setChromebookNumber, chromebooks }) => {
    // Staff PIN state removed as requested
    const [isLoading, setIsLoading] = useState(false);

    // Filter chromebooks to find only checked-out ones and map to their numbers and IDs
    const checkedOutChromebooks = chromebooks
        .filter(cb => cb.status === 'checkedOut')
        .map(cb => {
            // Get the non-padded number for display and value (e.g., '1' from 'TVE-01')
            const num = String(parseInt(cb.id.split('-')[1], 10)); 
            return { num, id: cb.id };
        });
    
    const handleNumberChange = (e) => {
        // The value from the select element is the non-padded number string ('1' through '15')
        setChromebookNumber(e.target.value);
    };
    
    const handleClear = () => {
        // Clear only the chromebook number selection for the return form
        setChromebookNumber(''); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const idToSubmit = getFullId(chromebookNumber);
        
        if (!idToSubmit) {
            onAction(false, 'Please select a valid, checked-out Chromebook ID.', chromebookNumber, 'RETURN');
            return;
        }

        setIsLoading(true);
        
        // Prepare data to send to Google Script
        const formData = new URLSearchParams();
        formData.append('action', 'RETURN');
        formData.append('TVE_SPARE_ID', idToSubmit); // Crucial ID for finding the original row
        formData.append('returnedBy', 'FRONT_DESK'); 

        const result = await submitData(formData);
        
        setIsLoading(false);
        onAction(result.success, result.message, idToSubmit, 'RETURN');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Chromebook ID Dropdown */}
            <div>
                <label htmlFor="return-id" className="block text-sm font-medium text-gray-700">Chromebook ID (Select Number)</label>
                <select
                    id="return-id"
                    value={chromebookNumber}
                    onChange={handleNumberChange}
                    required
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-600 focus:ring-red-600 p-2 border bg-white font-mono"
                >
                    <option value="" disabled>Select Chromebook ID</option>
                    {checkedOutChromebooks.map(cb => (
                        <option key={cb.num} value={cb.num}>
                            {cb.num} (TVE-SPARE-{cb.num})
                        </option>
                    ))}
                </select>
                {checkedOutChromebooks.length === 0 && (
                     <p className="mt-1 text-sm text-green-600 font-semibold">No Chromebooks currently checked out.</p>
                )}
            </div>
            {/* End Chromebook ID Dropdown */}
            
            <div className="flex space-x-3">
                <button
                    type="button" 
                    onClick={handleClear}
                    className="flex-shrink-0 w-1/4 flex justify-center items-center py-3 px-3 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
                    title="Clear the selected Chromebook ID"
                >
                    {/* Clear/Reset Icon (using a circle-X for clarity) */}
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                </button>
                <button
                    type="submit"
                    disabled={isLoading || checkedOutChromebooks.length === 0}
                    className="flex-grow w-3/4 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader /> : (
                        <>
                            <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>
                            Complete Return
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};


const App = () => {
    // --- State Management ---
    const [view, setView] = useState('CHECKOUT'); // 'CHECKOUT' or 'RETURN'
    const [modal, setModal] = useState({ message: '', type: '' });
    
    // State for Chromebook Inventory
    const [chromebooks, setChromebooks] = useState(initialChromebooks);
    // State for raw Chromebook ID number input (e.g., '5')
    const [chromebookNumber, setChromebookNumber] = useState(''); 

    // Derived state: Full ID used for comparison and submission (e.g., 'TVE-05')
    const activeId = getFullId(chromebookNumber); 

    // Derived State for Header Gauge
    const totalSpare = chromebooks.length;
    const totalAvailable = chromebooks.filter(cb => cb.status === 'available').length;

    // Handler for updating inventory state after a successful submission
    const handleAction = useCallback((success, message, submittedId, actionType) => {
        setModal({ message, type: success ? 'success' : 'error' });

        if (success) {
            setChromebooks(prev => prev.map(cb => {
                if (cb.id === submittedId) {
                    return { 
                        ...cb, 
                        status: actionType === 'CHECKOUT' ? 'checkedOut' : 'available' 
                    };
                }
                return cb;
            }));
            // Clear the raw number field on success
            setChromebookNumber(''); 
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 font-sans">
            <Header totalAvailable={totalAvailable} totalSpare={totalSpare} />

            <main className="max-w-4xl mx-auto p-4 md:p-6">
                
                {/* Responsive Two-column layout on desktop: Forms on Left, Grid on Right */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    
                    {/* LEFT COLUMN: Forms and Toggle (md:order-1) */}
                    <div className="md:col-span-1">
                        {/* Action View Toggle */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => {
                                    setView('CHECKOUT');
                                    setChromebookNumber(''); 
                                }}
                                className={`p-4 rounded-xl shadow-md transition duration-200 ease-in-out ${
                                    view === 'CHECKOUT' 
                                        ? 'bg-red-700 text-white font-bold transform scale-105' 
                                        : 'bg-white text-gray-600 hover:bg-red-50'
                                }`}
                            >
                                <svg className="w-6 h-6 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path><path d="M7 21l-4-4a2 2 0 010-2l7-7"></path></svg>
                                Check Out
                            </button>
                            <button
                                onClick={() => {
                                    setView('RETURN');
                                    setChromebookNumber(''); 
                                }}
                                className={`p-4 rounded-xl shadow-md transition duration-200 ease-in-out ${
                                    view === 'RETURN' 
                                        ? 'bg-gray-900 text-white font-bold transform scale-105' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <svg className="w-6 h-6 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>
                                Return
                            </button>
                        </div>

                        {/* Main Action Forms */}
                        <ActionPanel 
                            title="Log Device Checkout" 
                            icon={<svg className="w-6 h-6 mr-2 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>}
                            color="border-red-600" 
                            isHidden={view !== 'CHECKOUT'}
                        >
                            <CheckoutForm 
                                onAction={handleAction} 
                                chromebooks={chromebooks} 
                                chromebookNumber={chromebookNumber}
                                setChromebookNumber={setChromebookNumber}
                            />
                        </ActionPanel>

                        <ActionPanel 
                            title="Process Device Return" 
                            icon={<svg className="w-6 h-6 mr-2 text-gray-800" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>}
                            color="border-gray-900" 
                            isHidden={view !== 'RETURN'}
                        >
                            <ReturnForm 
                                onAction={handleAction} 
                                chromebooks={chromebooks} 
                                chromebookNumber={chromebookNumber}
                                setChromebookNumber={setChromebookNumber}
                            />
                        </ActionPanel>
                    </div>

                    {/* RIGHT COLUMN: Visual Status Grid (md:order-2) */}
                    <div className="md:col-span-1">
                        <ChromebookStatusGrid 
                            chromebooks={chromebooks} 
                            activeId={activeId}
                            view={view}
                        />
                    </div>
                </div>

            </main>

            <MessageModal {...modal} onClose={() => setModal({ message: '', type: '' })} />
        </div>
    );
};

export default App;
