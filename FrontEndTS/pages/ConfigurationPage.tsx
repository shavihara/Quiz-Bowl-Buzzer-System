import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { fileToBase64, compressImage } from '../utils/imageUtils';
import { NeonInput, NeonFileInput } from '../components/NeonInput';
import { Team } from '../types';
import { useNavigate } from 'react-router-dom';
import { postConfig } from '../utils/espApi';
import { Trash2, Plus, Save, RotateCcw } from 'lucide-react';

export default function ConfigurationPage() {
  const { config, updateConfig, addTeam, removeTeam, resetConfig } = useConfig();
  const navigate = useNavigate();
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState<string | null>(null);

  const handleLogoUpload = async (key: 'leftLogo' | 'rightLogo' | 'mainAnimationGif', file: File) => {
    try {
      // Compress header logos to reduce localStorage size
      const base64 = key === 'mainAnimationGif' 
        ? await fileToBase64(file) 
        : await compressImage(file, 200, 200, 0.8);
      updateConfig({ [key]: base64 });
    } catch (e) {
      alert('Error uploading image');
    }
  };

  const handleTeamLogoUpload = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setNewTeamLogo(base64);
    } catch (e) {
      alert('Error uploading team logo');
    }
  };

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: newTeamName,
      logo: newTeamLogo,
      score: 0,
    };
    addTeam(newTeam);
    setNewTeamName('');
    setNewTeamLogo(null);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink">
              System Configuration
            </h1>
            <p className="text-gray-400 mt-2">Setup your quiz environment settings.</p>
          </div>
          <div className="flex gap-4">
             <button
              onClick={() => {
                if(window.confirm('Are you sure you want to reset all settings?')) resetConfig();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/40 transition-colors"
            >
              <RotateCcw size={18} /> Reset
            </button>
            <button
              onClick={async () => {
                const minutes = Math.round(config.questionTimeoutSeconds / 60);
                const durationMs = Math.max(0, minutes) * 60 * 1000;
                try { await postConfig(durationMs); } catch {}
                navigate('/');
              }}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-neon-blue text_black font-bold hover:shadow-[0_0_15px_#00f3ff] transition-all"
            >
              <Save size={18} /> Go To Quiz
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: Branding */}
          <section className="bg-dark-card p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-display text-neon-yellow mb-6 border-l-4 border-neon-yellow pl-4">
              Visual & Branding
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NeonFileInput
                  label="Header Left Logo"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload('leftLogo', e.target.files[0])}
                  preview={config.leftLogo}
                  onClear={() => updateConfig({ leftLogo: null })}
                />
                <NeonFileInput
                  label="Header Right Logo"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload('rightLogo', e.target.files[0])}
                  preview={config.rightLogo}
                  onClear={() => updateConfig({ rightLogo: null })}
                />
              </div>
              
              <NeonInput
                label="Header Title (Center)"
                value={config.headerTitle}
                onChange={(e) => updateConfig({ headerTitle: e.target.value })}
                placeholder="Ex: GRAND FINALE"
              />
              
              <NeonInput
                label="Sub-Header Info"
                value={config.headerSubtitle}
                onChange={(e) => updateConfig({ headerSubtitle: e.target.value })}
                placeholder="Ex: Round 1 - General Knowledge"
              />

              <NeonInput
                label="Question Number"
                type="number"
                value={config.currentQuestionNumber}
                placeholder="Enter question number..."
                min={1}
                step={1}
                onChange={(e) => {
                  const num = Number(e.target.value) || 1;
                  updateConfig({ currentQuestionNumber: Math.max(1, Math.round(num)) });
                }}
              />

              <NeonFileInput
                label="Main Animation GIF (Center Stage)"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload('mainAnimationGif', e.target.files[0])}
                preview={config.mainAnimationGif}
                onClear={() => updateConfig({ mainAnimationGif: null })}
              />

              <NeonInput
                label="Question Timeout (Minutes)"
                type="number"
                value={Math.round(config.questionTimeoutSeconds / 60)}
                placeholder="Enter minutes..."
                min={0}
                step={1}
                onChange={(e) => {
                  const minutes = Number(e.target.value) || 0;
                  const seconds = Math.max(0, Math.round(minutes) * 60);
                  updateConfig({ questionTimeoutSeconds: seconds });
                }}
              />
            </div>
          </section>

          {/* Section 2: Teams */}
          <section className="bg-dark-card p-6 rounded-2xl border border-gray-800 shadow-xl flex flex-col h-full">
            <h2 className="text-xl font-display text-neon-pink mb-6 border-l-4 border-neon-pink pl-4">
              Team Management ({config.teams.length}/10)
            </h2>
            
            {/* Add Team Form */}
            <div className="bg-dark-surface p-4 rounded-xl border border-gray-700 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
                <NeonInput
                  label="Team Name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter Name..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTeam()}
                />
                <div className="w-full md:w-32">
                   <NeonFileInput
                    label="Logo"
                    onChange={(e) => e.target.files?.[0] && handleTeamLogoUpload(e.target.files[0])}
                    preview={newTeamLogo}
                    onClear={() => setNewTeamLogo(null)}
                   />
                </div>
                <button
                  onClick={handleAddTeam}
                  disabled={config.teams.length >= 10 || !newTeamName}
                  className="h-12 w-full md:w-auto px-4 bg-neon-pink text-white rounded-lg font-bold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus />
                </button>
              </div>
            </div>

            {/* Team List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
              {config.teams.length === 0 && (
                <div className="text-center text-gray-500 py-10 italic">No teams added yet.</div>
              )}
              {config.teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-dark-surface rounded-lg border border-gray-700 hover:border-neon-pink transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black border border-gray-600 overflow-hidden flex items-center justify-center">
                       {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">N/A</span>}
                    </div>
                    <span className="font-display font-bold text-lg">{team.name}</span>
                  </div>
                  <button
                    onClick={() => removeTeam(team.id)}
                    className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
