import { useState } from 'react';
import { getStoredSession } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function DebugPanel() {
    const [results, setResults] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const session = getStoredSession();

    const testBackendAPI = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/employee/dashboard', {
                headers: {
                    'Authorization': `Bearer ${session?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            setResults({
                type: 'Backend API',
                status: response.status,
                data
            });
        } catch (error) {
            setResults({
                type: 'Backend API',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        setLoading(false);
    };

    const testSupabaseDirect = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .eq('is_published', true);

            setResults({
                type: 'Supabase Direct',
                data,
                error
            });
        } catch (error) {
            setResults({
                type: 'Supabase Direct',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        setLoading(false);
    };

    const testHealthCheck = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            setResults({
                type: 'Health Check',
                status: response.status,
                data
            });
        } catch (error) {
            setResults({
                type: 'Health Check',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        setLoading(false);
    };

    return (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md">
            <h3 className="font-bold mb-2">Debug Panel</h3>

            <div className="space-y-2 mb-4">
                <button
                    onClick={testHealthCheck}
                    disabled={loading}
                    className="block w-full px-3 py-1 bg-blue-500 text-white rounded text-sm"
                >
                    Test Health Check
                </button>
                <button
                    onClick={testBackendAPI}
                    disabled={loading}
                    className="block w-full px-3 py-1 bg-green-500 text-white rounded text-sm"
                >
                    Test Backend API
                </button>
                <button
                    onClick={testSupabaseDirect}
                    disabled={loading}
                    className="block w-full px-3 py-1 bg-purple-500 text-white rounded text-sm"
                >
                    Test Supabase Direct
                </button>
            </div>

            {loading && <p className="text-sm text-gray-500">Loading...</p>}

            {results && (
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                    <strong>{results.type}:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                        {JSON.stringify(results, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}