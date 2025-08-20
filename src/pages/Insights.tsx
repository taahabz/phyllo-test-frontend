import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { phylloApi, insightsApi } from '../lib/api';

interface AudienceData {
  accountId: string;
  audience: any;
  fetchedAt: string;
}

export const Insights = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [audienceData, setAudienceData] = useState<AudienceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get connected accounts
      const accountsResponse = await phylloApi.getAccounts();
      setAccounts(accountsResponse.accounts);

      // Get audience data for each account
      const audiencePromises = accountsResponse.accounts.map(async (account: any) => {
        try {
          const audienceResponse = await insightsApi.getAudience(account.id);
          return audienceResponse;
        } catch (err) {
          console.error(`Failed to get audience for account ${account.id}:`, err);
          return null;
        }
      });

      const audienceResults = await Promise.all(audiencePromises);
      const validAudienceData = audienceResults.filter(Boolean) as AudienceData[];
      setAudienceData(validAudienceData);

    } catch (err: any) {
      console.error('Failed to load insights data:', err);
      setError('Failed to load insights data');
    } finally {
      setLoading(false);
    }
  };

  const prepareGenderData = (audience: any) => {
    if (!audience?.gender_split) return [];
    
    return Object.entries(audience.gender_split).map(([gender, percentage]) => ({
      name: gender.charAt(0).toUpperCase() + gender.slice(1),
      value: percentage,
    }));
  };

  const prepareAgeData = (audience: any) => {
    if (!audience?.age_split) return [];
    
    return Object.entries(audience.age_split).map(([ageRange, percentage]) => ({
      ageRange,
      percentage: percentage,
    }));
  };

  const prepareLocationData = (audience: any) => {
    if (!audience?.geo_split) return [];
    
    return Object.entries(audience.geo_split)
      .slice(0, 10) // Top 10 locations
      .map(([location, percentage]) => ({
        location,
        percentage: percentage,
      }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audience Insights</h1>
                <p className="text-sm text-gray-600">Analytics for your connected accounts</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/connect')}
                className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </button>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="animate-spin w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading insights...</h3>
            <p className="text-gray-600">Fetching your audience data</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No connected accounts</h3>
            <p className="text-gray-600 mb-6">Connect your social media accounts to view audience insights</p>
            <button
              onClick={() => navigate('/connect')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Connect Your Accounts
            </button>
          </div>
        ) : audienceData.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No audience data available</h3>
            <p className="text-gray-600 mb-6">
              Audience insights may not be available for newly connected accounts or accounts with limited data.
            </p>
            <button
              onClick={loadData}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {audienceData.map((data) => {
              const account = accounts.find(acc => acc.id === data.accountId);
              const genderData = prepareGenderData(data.audience);
              const ageData = prepareAgeData(data.audience);
              const locationData = prepareLocationData(data.audience);

              return (
                <div key={data.accountId} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  {/* Account Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-8 py-6 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                        <span className="text-lg font-bold text-white">
                          {account?.platform_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {account?.platform_name || 'Unknown Platform'}
                        </h2>
                        <p className="text-gray-600">@{account?.username || account?.id}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Data fetched: {new Date(data.fetchedAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Gender Distribution */}
                      {genderData.length > 0 && (
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            Gender Distribution
                          </h3>
                          <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                              <Pie
                                data={genderData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}%`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {genderData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Age Distribution */}
                      {ageData.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            Age Distribution
                          </h3>
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={ageData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="ageRange" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip 
                                formatter={(value) => [`${value}%`, 'Percentage']}
                                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                              />
                              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Location Distribution */}
                      {locationData.length > 0 && (
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            Top Locations
                          </h3>
                          <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={locationData} layout="horizontal">
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis type="number" tick={{ fontSize: 12 }} />
                              <YAxis dataKey="location" type="category" width={80} tick={{ fontSize: 11 }} />
                              <Tooltip 
                                formatter={(value) => [`${value}%`, 'Percentage']}
                                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                              />
                              <Bar dataKey="percentage" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Raw Data (for debugging) */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <details className="group">
                        <summary className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                          <svg className="w-4 h-4 mr-2 transform group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          View Raw Data
                        </summary>
                        <div className="mt-4 bg-gray-50 rounded-xl p-4 overflow-auto">
                          <pre className="text-xs text-gray-700">
                            {JSON.stringify(data.audience, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        {audienceData.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
