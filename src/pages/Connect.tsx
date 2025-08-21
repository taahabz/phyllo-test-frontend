import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { phylloApi, insightsApi } from '../lib/api';

// Declare global PhylloConnect for TypeScript
declare global {
  interface Window {
    PhylloConnect: any;
  }
}

// Wait for Phyllo Connect SDK to load
const waitForPhylloSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.PhylloConnect) {
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds with 100ms intervals
    
    const checkSDK = () => {
      attempts++;
      
      if (window.PhylloConnect) {
        resolve();
      } else if (attempts >= maxAttempts) {
        reject(new Error('Phyllo Connect SDK failed to load after 5 seconds'));
      } else {
        setTimeout(checkSDK, 100);
      }
    };
    
    checkSDK();
  });
};

export const Connect = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await phylloApi.getAccounts();
      setAccounts(response.accounts);
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
      // Don't show error for empty accounts
      if (err.response?.status !== 400) {
        setError('Failed to load connected accounts');
      }
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleConnectSocials = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 1: Ensure user has Phyllo account
      await phylloApi.createUser();

      // Step 2: Get SDK token
      const tokenResponse = await phylloApi.createSdkToken();

      // Step 3: Initialize Phyllo Connect Web SDK
      console.log('SDK Token received:', tokenResponse.sdk_token);
      console.log('Token expires at:', tokenResponse.expires_at);
      
      // Wait for PhylloConnect to load
      await waitForPhylloSDK();
      
      // Initialize Phyllo Connect with v2 API
      const phylloConnect = window.PhylloConnect.initialize({
        clientDisplayName: 'Phyllo Test App',
        environment: 'staging',
        userId: user?.id, // Use user.id directly since user_id doesn't exist on tokenResponse
        token: tokenResponse.sdk_token,
        workPlatformId: undefined // Optional: specify if you want to connect to specific platform
      });
      
      // Set up event listeners
      phylloConnect.on('accountConnected', async (accountId: string, workPlatformId: string, userId: string) => {
        console.log('Account connected:', { accountId, workPlatformId, userId });
        
        // Test call to fetch audience demographics immediately after connection
        try {
          const res = await insightsApi.getAudience(accountId);
          if (res.audience && Object.keys(res.audience).length > 0) {
            console.log("User demographics:", res.audience);
          } else {
            console.log("No demographics available yet");
          }
        } catch (error) {
          console.log("No demographics available yet - this is normal for newly connected accounts");
        }
        
        setLoading(false);
        loadAccounts(); // Refresh accounts list
      });
      
      phylloConnect.on('accountDisconnected', (accountId: string, workPlatformId: string, userId: string) => {
        console.log('Account disconnected:', { accountId, workPlatformId, userId });
        loadAccounts(); // Refresh accounts list
      });
      
      phylloConnect.on('tokenExpired', (userId: string) => {
        console.log('Token expired for user:', userId);
        setError('Session expired. Please try connecting again.');
        setLoading(false);
      });
      
      phylloConnect.on('exit', (reason: string, userId: string) => {
        console.log('Phyllo Connect exited:', { reason, userId });
        setLoading(false);
      });
      
      phylloConnect.on('connectionFailure', (reason: string, workPlatformId: string, userId: string) => {
        console.log('Connection failed:', { reason, workPlatformId, userId });
        setError(`Failed to connect to ${workPlatformId}: ${reason}`);
        setLoading(false);
      });
      
      // Open the Connect interface
      phylloConnect.open();

    } catch (err: any) {
      console.error('Connect error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to connect socials');
      setLoading(false);
    }
  };

  const handleViewInsights = () => {
    navigate('/insights');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Connect Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Social Accounts</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Link your social media accounts to unlock powerful audience insights and analytics for your content.
            </p>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleConnectSocials}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Connect Social Accounts
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connected Accounts</h2>
              <p className="text-gray-600 text-sm mt-1">Manage your connected social media accounts</p>
            </div>
            <button
              onClick={loadAccounts}
              disabled={loadingAccounts}
              className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <svg className={`w-4 h-4 mr-2 ${loadingAccounts ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loadingAccounts ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loadingAccounts ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="text-gray-500">Loading connected accounts...</div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts connected yet</h3>
              <p className="text-gray-500">
                Connect your social media accounts to start getting insights
              </p>
            </div>
          ) : (
            <div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <div key={account.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                        <span className="text-lg font-bold text-white">
                          {account.platform_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {account.platform_name || 'Unknown Platform'}
                        </div>
                        <div className="text-sm text-gray-600">
                          @{account.username || account.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Connected {new Date(account.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={handleViewInsights}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    View Audience Insights
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
