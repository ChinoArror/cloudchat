import React, { useState } from 'react';
import { saveFirebaseConfig } from '../services/storage';
import Button from '../components/Button';
import Input from '../components/Input';

const SetupPage: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    try {
      const config = JSON.parse(jsonInput);
      if (!config.apiKey || !config.projectId) {
        throw new Error("Invalid config: Missing apiKey or projectId");
      }
      saveFirebaseConfig(config);
    } catch (e) {
      setError("Invalid JSON format. Please copy the object directly from Firebase Console.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 text-white relative overflow-hidden">
       {/* Background */}
       <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/40 rounded-full mix-blend-screen filter blur-3xl opacity-50"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/40 rounded-full mix-blend-screen filter blur-3xl opacity-50"></div>
      </div>

      <div className="relative glass-panel max-w-lg w-full p-8 rounded-3xl shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/30">
            ⚙️
          </div>
          <h1 className="text-2xl font-bold mb-2">Setup CloudChat</h1>
          <p className="text-gray-400 text-sm">Connect your Firebase Project to get started.</p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-xl text-xs text-yellow-200 leading-relaxed">
            <strong>Missing Configuration:</strong> The application does not have valid Firebase credentials.
            <br/><br/>
            Go to <em>Firebase Console &gt; Project Settings &gt; General &gt; Your apps &gt; SDK setup (Config)</em> and copy the <code>firebaseConfig</code> object.
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Paste Firebase Config JSON</label>
            <textarea 
              className="w-full h-48 px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-gray-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              placeholder={`{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  ...
}`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
              {error}
            </div>
          )}

          <Button fullWidth onClick={handleSave} className="mt-4">
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;