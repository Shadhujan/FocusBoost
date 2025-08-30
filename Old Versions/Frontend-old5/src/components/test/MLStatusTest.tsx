// Create this as a temporary test: src/components/test/MLStatusTest.tsx

import React, { useEffect, useState } from 'react';
import {apiService} from '../../services/apiService';

const MLStatusTest: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testMLStatus = async () => {
      try {
        console.log('🧪 Testing ML status check...');
        setLoading(true);
        
        const response = await apiService.checkMLStatus();
        console.log('🧪 Full ML Status Response:', response);
        
        setStatus(response);
        
        // Debug the exact values
        console.log('🧪 Debug - response.success:', response.success);
        console.log('🧪 Debug - response.data?.models_loaded:', response.data?.models_loaded);
        console.log('🧪 Debug - typeof success:', typeof response.success);
        console.log('🧪 Debug - typeof models_loaded:', typeof response.data?.models_loaded);
        
        if (response.success && response.data?.models_loaded) {
          console.log('✅ ML Status Check: SUCCESS');
          setError(null);
        } else {
          console.log('❌ ML Status Check: FAILED');
          console.log('❌ Debug - success check:', response.success);
          console.log('❌ Debug - models_loaded check:', response.data?.models_loaded);
          setError('ML models not ready');
        }
      } catch (err) {
        console.error('🧪 Error in ML status test:', err);
        setError('Test failed');
      } finally {
        setLoading(false);
      }
    };

    testMLStatus();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4">🧪 ML Status Test</h3>
      
      {loading && (
        <div className="text-yellow-600">⏳ Testing ML status...</div>
      )}
      
      {!loading && status && (
        <div className="space-y-2">
          <div className={`font-semibold ${status.success && status.models_loaded ? 'text-green-600' : 'text-red-600'}`}>
            Status: {status.success && status.models_loaded ? '✅ WORKING' : '❌ FAILED'}
          </div>
          
          <div className="bg-gray-100 p-3 rounded text-sm">
            <strong>Raw Response:</strong>
            <pre className="mt-1 text-xs overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
          
          {error && (
            <div className="text-red-600 font-semibold">
              Error: {error}
            </div>
          )}
          
          <div className="mt-4 text-sm">
            <strong>Check Console:</strong> Look for detailed logs starting with 🧪
          </div>
        </div>
      )}
    </div>
  );
};

export default MLStatusTest;