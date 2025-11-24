// @ts-nocheck
// This directive handles platform-specific module import issues and global variable access.

import React, { useEffect, useState } from "react";
import { Copy, Clock, Upload, CheckCircle, DollarSign, RefreshCw } from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Define the structure of the data fetched from Firestore
interface DepositSettings {
  depositAddress: string;
  qrImage: string;
  minDeposit: number;
  network: string;
}

// --- GLOBAL VARIABLE ACCESS (Platform-Injected) ---
// Safely accessing the configuration variables provided by the environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-deposit-app';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// Deposit Page Component
const DepositPage = () => {
  // State for Firebase connection and user data
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // State for application data
  const [settings, setSettings] = useState<DepositSettings | null>(null); 
  const [showAddress, setShowAddress] = useState(false);
  const [timer, setTimer] = useState(1200); // Address time limit (20 minutes)
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // --- 1. FIREBASE INITIALIZATION AND AUTHENTICATION ---
  useEffect(() => {
    if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase configuration is missing or empty. Using mock data.");
        // Set mock data if Firebase config is unavailable
        setSettings({
            depositAddress: "MOCK_TXYZS1K3g6Dq1rLg8BvN4XjS6QhH5D7E4F2G1H", 
            qrImage: "https://placehold.co/200x200/1e293b/ffffff?text=MOCK+QR+Code", 
            minDeposit: 20,
            network: "USDT TRC20 (Tron)",
        });
        setIsAuthReady(true);
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);
        
        setDb(firestore);
        setAuth(firebaseAuth);

        // Handle authentication: Custom Token -> Anonymous
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user: User | null) => {
            if (user) {
                setUserId(user.uid);
            } else if (initialAuthToken) {
                try {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } catch (e) {
                    console.error("Custom Auth Failed, falling back to anonymous:", e);
                    await signInAnonymously(firebaseAuth);
                }
            } else {
                await signInAnonymously(firebaseAuth).catch(e => console.error("Anonymous Auth Failed:", e));
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe(); 

    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
  }, []);

  // Use a separate useEffect to ensure userId is set after auth completes
  useEffect(() => {
    if (auth && isAuthReady) {
        const checkAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(crypto.randomUUID()); // Fallback random ID
            }
        });
        return () => checkAuth();
    }
  }, [auth, isAuthReady]);


  // --- 2. SETTINGS FETCH FROM FIRESTORE (CORE LOGIC) ---
  useEffect(() => {
    // Fetch settings only when Auth is ready and DB instance is available
    if (isAuthReady && db) {
        const fetchSettings = async () => {
            try {
                // The app looks for data in this public path:
                // /artifacts/{appId}/public/data/settings/deposit_config
                const docRef = doc(db, `artifacts/${appId}/public/data/settings`, "deposit_config");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setSettings(docSnap.data() as DepositSettings);
                    console.log("Deposit settings successfully fetched from database.");
                } else {
                    // Fallback mock data if the document is not found
                    console.warn("No 'deposit_config' document found. Using fallback data.");
                    setSettings({
                        depositAddress: "MOCK_TXYZS1K3g6Dq1rLg8BvN4XjS6QhH5D7E4F2G1H", 
                        qrImage: "https://placehold.co/200x200/1e293b/ffffff?text=MOCK+QR+Code", 
                        minDeposit: 20,
                        network: "USDT TRC20 (Tron)",
                    });
                }
            } catch (error) {
                console.error("Error fetching settings from database:", error);
                setMessage("Error: Failed to load deposit settings.");
            }
        };

        fetchSettings();
    }
  }, [isAuthReady, db]); 

  // --- 3. TIMER LOGIC ---
  useEffect(() => {
    if (showAddress && timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0 && showAddress) {
        setMessage("⚠️ Address validity expired. Please refresh the page to request a new address.");
    }
  }, [showAddress, timer]);

  // Convert seconds to MM:SS format
  const formatTime = (sec: number) =>
    `${Math.floor(sec / 60)}:${("0" + (sec % 60)).slice(-2)}`;

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage("");
    }
  };

  // --- 4. COPY TO CLIPBOARD FUNCTION ---
  const copyToClipboard = (text: string) => {
    try {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy'); 
        document.body.removeChild(tempInput);
        
        setIsCopied(true);
        setMessage("✅ Address copied successfully!");
        setTimeout(() => {
          setMessage("");
          setIsCopied(false);
        }, 3000);
    } catch (err) {
        setMessage("❌ Failed to copy address.");
        console.error('Copy failed:', err);
    }
  };

  // --- 5. DEPOSIT SUBMISSION SIMULATION ---
  const submitDeposit = async () => {
    setMessage("");

    const parsedAmount = Number(amount);

    if (!settings) {
      setMessage("❌ Settings are not loaded. Please wait.");
      return;
    }

    if (!amount || parsedAmount < settings.minDeposit) {
      setMessage(`❌ The minimum deposit is $${settings.minDeposit}.`);
      return;
    }

    if (!file) {
      setMessage("❌ Please upload a screenshot of your payment proof.");
      return;
    }

    setLoading(true);

    try {
        // Simulate file upload and deposit request (In a real app, you would upload the file and create a Firestore entry)
        console.log(`📸 Simulating screenshot upload: ${file.name}`);
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        console.log(`💰 Simulating deposit request: $${parsedAmount} (User ID: ${userId})`);
        
        // This is where you would call addDoc/setDoc to Firestore
        // to record the user's deposit request.
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // --- SUCCESS RESPONSE ---
        setMessage("✅ Deposit request submitted! Your balance will be credited after manual verification.");
        
        // Reset form fields
        setAmount("");
        setFile(null);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";

    } catch (error) {
      console.error("Deposit submission error:", error);
      setMessage("❌ An error occurred while submitting the request.");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (!isAuthReady || !settings)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-purple-500"></div>
        <p className="text-white text-xl ml-4">Loading application data...</p>
      </div>
    );

  // Main Deposit Page UI
  return (
    <div className="min-h-screen bg-gray-950 text-white flex justify-center items-center p-4 sm:p-6 font-sans">
      <div className="bg-gray-900 border border-purple-600/30 p-6 sm:p-8 rounded-3xl w-full max-w-2xl shadow-2xl shadow-purple-900/50">

        {/* Header and Title */}
        <div className="flex justify-center mb-6">
            <DollarSign className="w-12 h-12 text-purple-400 p-2 rounded-full bg-purple-900/50 border border-purple-600/50"/>
        </div>

        <h1 className="text-4xl font-extrabold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Deposit Funds
        </h1>
        <p className="text-gray-400 text-center mb-8">Secure and fast deposits via {settings.network}</p>

        {/* Instructions Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-8 space-y-2">
            <h2 className="text-xl font-bold text-white mb-2">Payment Instructions</h2>
            <p className="text-sm text-gray-300 flex items-start">1. Transfer funds to the address provided below (Network: <span className='text-yellow-400 ml-1 font-semibold'>TRC20</span>).</p>
            <p className="text-sm text-gray-300 flex items-start">2. The minimum deposit amount is <span className='text-green-400 ml-1 font-semibold'>${settings.minDeposit}</span>.</p>
            <p className="text-sm text-gray-300 flex items-start">3. Upload proof (screenshot) and amount to submit the request.</p>
        </div>
        
        {/* Current User ID */}
        <p className="text-xs text-center text-gray-500 mb-4 truncate">
            User ID: {userId || "Authenticating..."}
        </p>

        {/* Action Button / Address Section Toggle */}
        {!showAddress && (
          <button
            onClick={() => {
                setShowAddress(true);
                setTimer(1200); 
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-4 rounded-xl text-lg font-bold shadow-lg shadow-purple-500/40 transition-all"
          >
            Request Deposit Address
          </button>
        )}

        {/* Deposit Form Section */}
        {showAddress && (
          <div className="mt-6 space-y-6">

            {/* ADDRESS SECTION */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <p className="text-sm mb-2 text-gray-300 flex items-center">
                <Copy className="w-4 h-4 mr-2 text-purple-400"/> USDT Deposit Address:
              </p>

              <div className="flex items-center bg-gray-900 p-2 rounded-xl border border-gray-700">
                <input
                  // Address fetched from Firestore settings
                  value={settings.depositAddress}
                  readOnly
                  className="w-full bg-transparent outline-none text-sm text-white font-mono truncate mr-2"
                />
                <button
                  className={`flex items-center px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    isCopied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  onClick={() => copyToClipboard(settings.depositAddress)}
                  disabled={timer === 0}
                >
                  <Copy className="w-4 h-4 mr-1"/> {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* QR CODE & TIMER */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
                {/* QR CODE */}
                <div className="flex-shrink-0 bg-white p-2 rounded-lg shadow-md">
                    <img
                        // QR image URL fetched from Firestore settings
                        src={settings.qrImage}
                        width={150}
                        height={150}
                        alt="QR Code"
                        className="rounded-md"
                        onError={(e) => { 
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; 
                            target.src = "https://placehold.co/150x150/ff0000/ffffff?text=QR+Error";
                        }}
                    />
                </div>
                
                {/* TIMER */}
                <div className="text-center sm:text-left flex-grow">
                    <p className="text-lg text-gray-300 font-medium flex items-center justify-center sm:justify-start mb-1">
                        <Clock className="w-5 h-5 mr-2 text-yellow-400"/>
                        Address Validity:
                    </p>
                    <p className={`text-4xl font-extrabold ${timer < 60 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                        {formatTime(timer)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">For security, the address will expire after this time.</p>
                </div>
            </div>

            {/* AMOUNT INPUT */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Deposit Amount (USD)
              </label>
              <input
                type="number"
                placeholder={`Enter amount (min $${settings.minDeposit})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 bg-gray-700/50 border border-gray-600 rounded-xl outline-none focus:border-blue-500 transition-all text-white"
                min={settings.minDeposit}
                disabled={loading || timer === 0}
              />
            </div>

            {/* FILE UPLOAD */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Payment Screenshot (Mandatory)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  disabled={loading || timer === 0}
                />
                <label
                  htmlFor="file-upload"
                  className={`block w-full p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all 
                    ${loading || timer === 0 
                      ? 'bg-gray-800 border-gray-600 text-gray-500'
                      : 'bg-gray-700/50 border-gray-600 hover:border-purple-500'
                    }`}
                >
                  {file ? (
                    <span className="text-green-400 font-semibold flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 mr-2"/> {file.name} (Uploaded)
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center justify-center">
                      <Upload className="w-5 h-5 mr-2"/> Click to upload screenshot
                    </span>
                  )}
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Upload your payment proof (PNG, JPG, JPEG).
              </p>
            </div>

            {/* MESSAGE */}
            {message && (
              <div className={`p-4 rounded-xl text-center font-semibold text-sm ${
                message.includes("✅") || message.includes("copied")
                  ? "bg-green-900/50 text-green-400 border border-green-700"
                  : "bg-red-900/50 text-red-400 border border-red-700"
              }`}>
                {message}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              onClick={submitDeposit}
              disabled={loading || timer === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl text-lg font-bold shadow-xl shadow-purple-500/40 transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 animate-spin mr-3"/>
                  Submitting Request...
                </div>
              ) : (
                "Submit Deposit Request"
              )}
            </button>
            <p className="text-xs text-center text-gray-500 mt-3">
                *All transactions require manual confirmation from our side.
            </p>

          </div>
        )}
      </div>
    </div>
  );
}

// Export the component
export default DepositPage;