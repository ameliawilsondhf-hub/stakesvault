"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Lock, Wallet, Shield, Zap, Info, ArrowRight, Twitter, Facebook, Instagram, Send, CreditCard, DollarSign, Activity, DollarSign as DollarSignIcon } from 'lucide-react';

// --- Helper Functions and Constants ---

// Function to generate dummy historical price data for the chart visualization
const generateHistoricalData = (latestPrice) => {
  const data = [];
  const base = latestPrice;
  const variance = 0.005; // 0.5% variance

  for (let i = 30; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60000); // Last 30 minutes, one point per minute
    let price = base * (1 + (Math.random() - 0.5) * 2 * variance);
    
    // Ensure the price is slightly lower than the current price for a positive trend visualization
    price = price * (1 - (i / 10000)); 

    data.push({
      name: time.toLocaleTimeString('en-US', { minute: '2-digit', hour: '2-digit' }),
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
};

// --- StakesVault Application Component ---

const App = () => {
  const [btcPrice, setBtcPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [prevPrice, setPrevPrice] = useState(0);

  // Determine if the price is up, down, or stable for visual feedback
  const priceChange = useMemo(() => {
    if (btcPrice > prevPrice && prevPrice !== 0) return 'up';
    if (btcPrice < prevPrice && prevPrice !== 0) return 'down';
    return 'stable';
  }, [btcPrice, prevPrice]);

  // Fetch BTC price from Binance every 3 seconds (to reduce API calls slightly)
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Implement exponential backoff for API calls
        let attempt = 0;
        const maxAttempts = 5;

        const fetchDataWithRetry = async () => {
            if (attempt >= maxAttempts) {
                throw new Error("Failed to fetch price after multiple retries.");
            }
            try {
                const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return await res.json();
            } catch (e) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchDataWithRetry(); // Recursive retry
            }
        };

        const data = await fetchDataWithRetry();
        const newPrice = parseFloat(data.price);
        
        setPrevPrice(btcPrice); // Store current price as previous
        setBtcPrice(newPrice);
        setLoading(false);

        // Update chart data whenever a new price is fetched
        setChartData((currentData) => {
          const newDataPoint = {
            name: new Date().toLocaleTimeString('en-US', { minute: '2-digit', hour: '2-digit' }),
            price: parseFloat(newPrice.toFixed(2)),
          };
          
          // Keep the last 30 points
          const updatedData = [...currentData, newDataPoint].slice(-30);

          if (currentData.length === 0) {
            // Initialize with generated data if empty
            return generateHistoricalData(newPrice);
          }
          
          return updatedData;
        });

      } catch (error) {
        console.error("Price fetch error:", error.message);
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 3000);
    return () => clearInterval(interval);
  }, [btcPrice]);


  const getPriceTextColor = () => {
    if (priceChange === 'up') return 'text-green-500';
    if (priceChange === 'down') return 'text-red-500';
    return 'text-gray-400';
  };

  // REFACTORED: StakingCard to use a 'feature' property for custom visual scenes
  const StakingCard = ({ title, description, icon: Icon, isFeatured, feature }) => {
    
    // Function to render the "best scene/visual" based on the plan's feature
    const renderFeatureVisual = () => {
        if (feature === 'safety') {
            return (
                <div className="mb-6 p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-green-400 flex items-center"><Shield className='w-4 h-4 mr-1'/> Low Volatility</p>
                        <p className="text-xl font-bold text-gray-300">Stability</p>
                    </div>
                    <div className="h-2 bg-green-900 rounded-full">
                        {/* Visual indicator for stability (full bar) */}
                        <div className="h-full bg-green-500 rounded-full w-full" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Maximum Capital Protection</p>
                </div>
            );
        } else if (feature === 'growth') {
            return (
                <div className="mb-6 p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-yellow-400 flex items-center"><Activity className='w-4 h-4 mr-1'/> Compounding Rate</p>
                        <p className="text-xl font-bold text-gray-300">Momentum</p>
                    </div>
                    <div className="h-2 bg-purple-900 rounded-full relative overflow-visible">
                        {/* Visual indicator for acceleration/compounding */}
                        <div className="h-full bg-purple-500 rounded-full w-4/5" style={{ transition: 'width 0.5s' }}></div>
                        <Zap className="absolute right-0 top-[-10px] w-6 h-6 text-yellow-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Daily Reinvestment Cycle</p>
                </div>
            );
        } else if (feature === 'pro') {
            return (
                <div className="mb-6 p-4 rounded-xl bg-gray-950 border border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-red-400 flex items-center"><TrendingUp className='w-4 h-4 mr-1'/> Max ROI Focus</p>
                        <p className="text-xl font-bold text-gray-300">Performance</p>
                    </div>
                    <div className="h-2 bg-red-900 rounded-full">
                        {/* Visual indicator for high performance */}
                        <div className="h-full bg-red-500 rounded-full w-11/12" style={{ transition: 'width 0.5s' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Algorithmically Optimized Trades</p>
                </div>
            );
        }
        return null;
    };


    return (
      <div
        className={`
          p-8 rounded-3xl transition-all duration-300 transform 
          shadow-2xl hover:shadow-purple-500/30
          ${isFeatured ? 'bg-gradient-to-br from-gray-900 via-gray-950 to-gray-800 border-2 border-purple-600' : 'bg-gray-950 border border-gray-800'}
        `}
      >
        <div className={`p-3 w-fit rounded-xl mb-4 ${isFeatured ? 'bg-purple-600/20 text-purple-400' : 'bg-gray-800/50 text-purple-500'}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-3xl font-extrabold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        
        {/* Render the new visual scene */}
        {renderFeatureVisual()}

    <a
  href="/auth/register"
  className={`block text-center w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 
    ${isFeatured 
      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/50' 
      : 'bg-gray-800 text-purple-400 hover:bg-gray-700/80'}
  `}
>
  Start Staking <ArrowRight className="inline ml-1 w-4 h-4" />
</a>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-inter">
      {/* Navbar (Simplified for Single-File React) */}
      <nav className="p-4 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            StakesVault
          </h1>
          <div className="space-x-4 text-sm text-gray-300 hidden sm:flex">
            <a href="#" className="hover:text-purple-400 transition">Dashboard</a>
            <a href="#" className="hover:text-purple-400 transition">Plans</a>
            <a href="#" className="hover:text-purple-400 transition">Security</a>
            <a href="#" className="hover:text-purple-400 transition">FAQ</a>
          </div>
          <div className="space-x-3">
       <a href="/auth/login" className="px-4 py-2 text-sm font-semibold rounded-lg text-gray-200 hover:bg-gray-800 transition">
  Login
</a>
<a href="/auth/register" className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 transition shadow-lg shadow-green-500/30">
  Register
</a>

          </div>
        </div>
      </nav>

      <main className="px-6 py-16 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <section className="text-center mb-24">
            <h2 className="text-7xl md:text-8xl font-black mb-5 leading-tight">
                Automated Staking.
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 block">
                    Effortless Returns.
                </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
                Secure your crypto assets and earn guaranteed daily passive income with our cutting-edge, algorithm-driven staking pool.
            </p>
            <div className="flex justify-center gap-6">
               <a href="/auth/register" className="px-8 py-4 text-lg font-bold rounded-xl bg-purple-600 hover:bg-purple-700 transition shadow-xl shadow-purple-500/40">
  Get Started Now
</a>

                <a href="#" className="px-8 py-4 text-lg font-bold rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition">
                    Learn More
                </a>
            </div>
        </section>

        {/* Live Price & Chart Section */}
        <section className="mb-24">
          <div className="max-w-6xl mx-auto bg-gray-900/50 p-6 md:p-10 rounded-3xl border border-gray-800 shadow-2xl">
            <div className='flex justify-between items-start mb-4'>
              <div>
                <h3 className="text-2xl font-bold text-yellow-400 flex items-center mb-1">
                    <TrendingUp className='w-6 h-6 mr-2'/> Live BTC Price (BTC/USDT)
                </h3>
                {loading ? (
                    <p className='text-4xl font-extrabold text-gray-500 animate-pulse'>Loading...</p>
                ) : (
                    <p className={`text-5xl font-extrabold transition-colors duration-500 ${getPriceTextColor()}`}>
                        ${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                )}
                <p className="text-sm text-gray-500 mt-1">Updates every 3 seconds from Binance</p>
              </div>
              <div className='text-right'>
                  <p className='text-lg font-semibold text-gray-400'>24h Change</p>
                  <p className='text-lg font-bold text-green-500'>+0.85%</p>
              </div>
            </div>

            {/* Price Chart Visualization (Recharts - requires dependency setup in a real app, but included here for completeness) */}
            <div className="h-64 mt-8 w-full bg-gray-950 rounded-2xl p-4">
              <h4 className='text-gray-400 text-sm mb-2'>BTC/USDT Price History (Last 30 data points)</h4>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                  <XAxis dataKey="name" stroke="#4a5568" tickLine={false} interval={Math.floor(chartData.length / 5)} tick={{ fontSize: 10 }} />
                  <YAxis 
                    dataKey="price" 
                    stroke="#4a5568" 
                    tickLine={false} 
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '8px' }} 
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* NOTE: Recharts is used here for a professional output but requires `recharts` package to be available in a live environment. */}
          </div>
        </section>


        {/* Plans Section */}
        <section className="mb-24">
            <h2 className="text-5xl font-black text-center mb-5">
                Choose Your <span className='text-purple-400'>Staking Plan</span>
            </h2>
            <p className="text-center text-gray-400 text-lg mb-16 max-w-3xl mx-auto">
                Select the tier that fits your investment goals. Higher returns come with advanced compounding features.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <StakingCard 
                    title="Starter Plan"
                    description="Perfect for new investors. Focus on stable, predictable income with low risk."
                    icon={Lock}
                    isFeatured={false} 
                    feature="safety" // New feature prop
                />
                <StakingCard 
                    title="Growth Plan"
                    description="Our most popular plan. Smart compounding ensures your daily returns accelerate rapidly."
                    icon={Zap}
                    isFeatured={true}
                    feature="growth" // New feature prop
                />
                <StakingCard 
                    title="Pro Plan"
                    description="Maximum ROI through high-frequency, optimized staking strategies. For serious investors."
                    icon={TrendingUp}
                    isFeatured={false} 
                    feature="pro" // New feature prop
                />
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1320] border-t border-gray-800 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid md:grid-cols-5 gap-10 border-b border-gray-800 pb-10">

            {/* Column 1: Logo & Mission */}
            <div className="md:col-span-2">
              <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                StakesVault
              </h2>
              <p className="text-gray-400 mt-4 text-base leading-7 max-w-sm">
                Secure automated staking platform designed for stable daily income, compounding profit & long-term growth.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Platform</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-purple-300">Staking Dashboard</a></li>
                <li><a href="#" className="hover:text-purple-300">Investment Plans</a></li>
                <li><a href="#" className="hover:text-purple-300">How It Works</a></li>
                <li><a href="#" className="hover:text-purple-300">Support Center</a></li>
              </ul>
            </div>

            {/* Column 3: Legal & Security */}
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Security & Legal</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className='flex items-center'><Shield className='w-4 h-4 mr-2 text-green-500'/> Encrypted Storage</li>
                <li className='flex items-center'><Lock className='w-4 h-4 mr-2 text-green-500'/> 2FA Secure Login</li>
                <li className='flex items-center'><Info className='w-4 h-4 mr-2 text-gray-500'/> Privacy Policy</li>
                <li className='flex items-center'><Info className='w-4 h-4 mr-2 text-gray-500'/> Terms of Service</li>
              </ul>
            </div>

            {/* Column 4: Payments (Using Placeholder Icons) */}
            <div>
              <h3 className="text-xl font-semibold text-purple-400 mb-4">Accepted Assets</h3>
              <div className="flex flex-wrap gap-3 mt-4">
                {/* Replaced image paths with Icons/Placeholders */}
                <div title="Crypto Payments" className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-yellow-400"><DollarSignIcon className='w-6 h-6' /></div>
                <div title="Credit/Debit Card" className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-blue-400"><CreditCard className='w-6 h-6' /></div>
                <div title="USDT" className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-green-400"><Wallet className='w-6 h-6' /></div>
                <div title="Wire Transfer" className="p-2 rounded-lg bg-gray-900 border border-gray-700 text-red-400"><Send className='w-6 h-6' /></div>
              </div>
            </div>

          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} StakesVault — All Rights Reserved.
            </p>
            
            {/* Social Media Icons */}
            <div className="flex gap-4">
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-blue-400 transition hover:bg-gray-700">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-blue-600 transition hover:bg-gray-700">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-pink-400 transition hover:bg-gray-700">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" aria-label="Telegram" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition hover:bg-gray-700">
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;