'use client';
import Link from "next/link";

export default function Home() {
  // Email test function
  const sendTestEmail = async () => {
    try {
      const res = await fetch('/api/send-email', { method: 'POST' });
      const data = await res.json();
      alert(data.success ? '✅ Email sent!' : '❌ Error: ' + data.error);
    } catch (error) {
      alert('Failed to send email');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">

      {/* Logo */}
      <h1 className="text-4xl font-extrabold text-center mb-2">
        Stake<span className="text-purple-500">Vault</span>
      </h1>

      {/* Tagline */}
      <p className="text-center text-gray-300 text-lg mb-10">
        Earn Daily Profit With Automated Staking & Smart Investment Plans
      </p>

      {/* CTA Buttons */}
      <div className="flex justify-center gap-4 mb-12">
        <Link href="/auth/login">
          <button className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition">
            Login
          </button>
        </Link>

        <Link href="/auth/register">
          <button className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition">
            Register
          </button>
        </Link>

        {/* TEST BUTTON - Remove after testing */}
        <button 
          onClick={sendTestEmail}
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Test Email
        </button>
      </div>

      {/* Profit Box */}
      <div className="max-w-md mx-auto bg-gray-900 p-6 rounded-2xl border border-gray-700 text-center">
        <h2 className="text-2xl font-bold mb-2 text-purple-400">
          Daily Stake Profit
        </h2>

        <p className="text-gray-300 mb-4">
          Earn stable daily profit with our automated staking engine.
        </p>

        <div className="text-4xl font-bold mb-2 text-green-400">
          1.8% / Day
        </div>

        <p className="text-gray-500 text-sm">
          * profit auto-credited to your wallet daily
        </p>
      </div>
    </main>
  );
}