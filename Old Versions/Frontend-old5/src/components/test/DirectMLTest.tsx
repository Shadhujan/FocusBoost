// Alternative test: src/components/test/DirectMLTest.tsx

import React, { useEffect, useState } from 'react';

const DirectMLTest: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testDirect = async () => {
      try {
        console.log('🔥 Direct backend test...');
        
        // Call backend directly, no API service
        const response = await fetch('http://localhost:8000/api/ml/status');
        const data = await response.json();
        
        console.log('🔥 Raw Backend Response:', data);
        console.log('🔥 data.success:', data.success);
        console.log('🔥 data.models_loaded:', data.models_loaded);
        
        setStatus(data);
        setLoading(false);
        
      } catch (error) {
        console.error('🔥 Direct test error:', error);
        setLoading(false);
      }
    };

    testDirect();
  }, []);

  if (loading) {
    return <div className="p-4">🔥 Testing direct backend call...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4">🔥 Direct Backend Test</h3>
      
      <div className="space-y-4">
        <div>
          <strong>Success:</strong> {status?.success ? '✅ true' : '❌ false'}
        </div>
        <div>
          <strong>Models Loaded:</strong> {status?.models_loaded ? '✅ true' : '❌ false'}
        </div>
        <div>
          <strong>Should Work:</strong> {(status?.success && status?.models_loaded) ? '✅ YES' : '❌ NO'}
        </div>
        
        <div className="bg-gray-100 p-3 rounded text-sm">
          <strong>Full Response:</strong>
          <pre className="mt-1 text-xs overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DirectMLTest;