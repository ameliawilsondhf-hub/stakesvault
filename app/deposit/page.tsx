"use client";

import React, { useState, useEffect } from 'react';
// Firebase imports ko sahi rakha gaya hai
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, Firestore } from 'firebase/firestore'; // Firestore type import kiya
import { Loader2, Zap, Copy, QrCode } from 'lucide-react';

// 1. Zaroori Global Variables ke liye Type Declaration
// Yeh step 'Cannot find name' errors ko fix karta hai
declare global {
  var __app_id: string;
  var __firebase_config: string;
  var __initial_auth_token: string;
}

// 2. docSnap.data() error ko fix karne ke liye Interface define karte hain
interface DepositConfig {
  depositAddress: string;
  qrImage: string;
  minDeposit: number;
  network: string;
}

const initialConfig: DepositConfig = {
  depositAddress: 'Loading...',
  qrImage: 'https://placehold.co/400x400/eeeeee/000000?text=QR+Code',
  minDeposit: 0,
  network: 'Loading...',
};

const App = () => {
  // state mein DepositConfig type ka istemal karte hain
  const [config, setConfig] = useState<DepositConfig>(initialConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState('');

  // Global variables ko directly use kar sakte hain kyunki humne unhe declare kar diya hai
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  useEffect(() => {
    if (!firebaseConfig) {
      setError("Firebase config available nahi hai. Configuration check karein.");
      setLoading(false);
      return;
    }

    let auth;
    let db: Firestore; // TypeScript ke liye type define kiya
    let unsubscribe = () => {};

    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);

      const authenticate = async () => {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (authError) {
          console.error("Authentication Error:", authError);
          // Agar custom token fail ho jaye, to anonymous sign-in try karein
          await signInAnonymously(auth);
        }
      };

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          // Auth ke baad hi fetch karein
          fetchDepositConfig(db, user.uid);
        } else {
          authenticate();
        }
      });
      
      authenticate();

    } catch (e) {
      console.error("Firebase Initialization Error:", e);
      // Agar 'e' Error type ka hai to uska message use karein
      setError(`Firebase initialize nahi ho paya. Error: ${e instanceof Error ? e.message : String(e)}`);
      setLoading(false);
    }
    
    return () => unsubscribe();
  }, []); 

  // Firestore se deposit settings fetch karein
  // dbInstance ko explicit 'Firestore' type diya
  const fetchDepositConfig = async (dbInstance: Firestore, currentUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      // Path: /artifacts/{appId}/public/data/settings/deposit_config
      const docPath = `/artifacts/${appId}/public/data/settings/deposit_config`;
      const configDocRef = doc(dbInstance, docPath);

      const docSnap = await getDoc(configDocRef);

      if (docSnap.exists()) {
        // docSnap.data() ko DepositConfig type mein cast kiya
        setConfig(docSnap.data() as DepositConfig);
      } else {
        setError("Deposit config document nahi mila. Firestore path check karein.");
      }
    } catch (fetchError) {
      console.error("Firestore Fetch Error:", fetchError);
      setError("Data fetch karte waqt error aaya.");
    } finally {
      setLoading(false);
    }
  };

  // Clipboard mein copy karne ka function
  const copyToClipboard = (text: string) => {
    // navigator.clipboard ki availability check ki
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          setCopyStatus('Address Copy Ho Gaya!');
          setTimeout(() => setCopyStatus(''), 2000);
        }).catch(err => {
            console.error("Clipboard API failed, falling back:", err);
            fallbackCopy(text);
        });
    } else {
        fallbackCopy(text);
    }
  };
  
  const fallbackCopy = (text: string) => {
      const el = document.createElement('textarea');
      el.value = text;
      // Zaroori style lagayein taaki element dikhe nahi
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      // Use execCommand for broader support in iframe environments
      document.execCommand('copy'); 
      document.body.removeChild(el);
      setCopyStatus('Address Copy Ho Gaya! (Fallback)');
      setTimeout(() => setCopyStatus(''), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-700 font-medium">Data Load Ho Raha Hai...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Aaya!</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  // Helper function to handle image error with proper TypeScript type checking
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 3. Image error fix: Event type ko React.SyntheticEvent<HTMLImageElement> mein cast kiya
    const target = e.target as HTMLImageElement;
    target.onerror = null; 
    target.src = "https://placehold.co/400x400/94A3B8/ffffff?text=Image+Nahi+Mili";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <h1 className="text-3xl font-extrabold text-gray-900">Deposit Karein</h1>
          <p className="text-gray-500 mt-1">Apna fund transfer karne ke liye neeche di gayi details istemal karein.</p>
        </div>
        
        {/* QR Code Section */}
        <div className="flex justify-center mb-8">
          <div className="p-4 border border-gray-200 rounded-xl bg-white shadow-inner">
            <img 
              src={config.qrImage} 
              alt="Deposit QR Code" 
              className="w-full max-w-xs h-auto rounded-lg object-contain"
              onError={handleImageError} // Image error ke liye naya handler use kiya
            />
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-4">
          
          {/* Network Detail */}
          <DetailCard title="Network Type" value={config.network} icon={QrCode} color="bg-blue-50/text-blue-700" />

          {/* Deposit Address Detail */}
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-600 flex items-center">
                <Copy className="w-4 h-4 mr-2 text-indigo-500" />
                Deposit Address
              </h3>
              <button 
                onClick={() => copyToClipboard(config.depositAddress)}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
              >
                {copyStatus || 'Copy Karein'}
              </button>
            </div>
            <p className="text-sm sm:text-base font-mono break-all bg-gray-50 p-2 rounded-lg text-gray-800">
              {config.depositAddress}
            </p>
          </div>

          {/* Min Deposit Detail */}
          <DetailCard title="Minimum Deposit" value={`${config.minDeposit} USDT`} icon={Zap} color="bg-green-50/text-green-700" />
          
        </div>
        
        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-red-500 font-medium">
            Zaroori: Sirf USDT (TRC20) network se transfer karein. Galat network se bheja gaya fund kho sakta hai.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            User ID: {userId || 'Nahi Mila'} | App ID: {appId}
          </p>
        </div>

      </div>
    </div>
  );
};

// Reusable card component for details
// Props ko bhi interface se type kiya
interface DetailCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className={`flex justify-between items-center p-4 rounded-xl shadow-sm ${color.split('/')[0]} border border-gray-200`}>
    <h3 className={`text-sm font-medium flex items-center ${color.split('/')[1]}`}>
      <Icon className="w-4 h-4 mr-2" />
      {title}
    </h3>
    <p className="text-base font-semibold text-gray-900">{value}</p>
  </div>
);

export default App;