import React, { useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { fileToBase64, compressImage } from '../utils/imageUtils';
import { NeonInput, NeonFileInput } from '../components/NeonInput';
import { Team } from '../types';
import { useNavigate } from 'react-router-dom';
import { postConfig, setEspBaseUrl, getEspBaseUrl, getHealth } from '../utils/espApi';
import { Trash2, Plus, Save, RotateCcw, Music, Play, StopCircle, Edit2, Download, Upload } from 'lucide-react';

export default function ConfigurationPage() {
  const { config, updateConfig, addTeam, removeTeam, resetConfig, updateTeam } = useConfig();
  const navigate = useNavigate();
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState<string | null>(null);
  const [espUrl, setEspUrl] = useState<string>(getEspBaseUrl());
  const [healthMsg, setHealthMsg] = useState<string>('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [editingLogo, setEditingLogo] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string>('');

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
      const base64 = await compressImage(file, 128, 128, 0.7);
      setNewTeamLogo(base64);
    } catch (e) {
      alert('Error uploading team logo');
    }
  };
  const handleEditLogoUpload = async (file: File) => {
    try {
      const base64 = await compressImage(file, 128, 128, 0.7);
      setEditingLogo(base64);
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

  const exportSettings = () => {
    const payload = {
      version: 1,
      createdAt: new Date().toISOString(),
      fields: {
        headerTitle: config.headerTitle,
        headerSubtitle: config.headerSubtitle,
        questionTimeoutSeconds: config.questionTimeoutSeconds,
        currentQuestionNumber: config.currentQuestionNumber,
        buzzerSoundEnabled: config.buzzerSoundEnabled,
        buzzerToneFreq: config.buzzerToneFreq,
        buzzerToneMs: config.buzzerToneMs,
        espBaseUrl: getEspBaseUrl(),
      },
      assets: {
        leftLogo: config.leftLogo ? { name: 'leftLogo', data: config.leftLogo } : null,
        rightLogo: config.rightLogo ? { name: 'rightLogo', data: config.rightLogo } : null,
        mainAnimationGif: config.mainAnimationGif ? { name: 'mainAnimationGif', data: config.mainAnimationGif } : null,
        buzzerAudio: config.buzzerAudioData ? { name: 'buzzerAudio', data: config.buzzerAudioData } : null,
      },
      teams: config.teams.map(t => ({ id: t.id, name: t.name, logo: t.logo ? { name: `${t.name}_logo`, data: t.logo } : null })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-config-${Date.now()}.quizcfg.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object') throw new Error('Invalid file');
      const fields = data.fields || {};
      const assets = data.assets || {};
      const teams = Array.isArray(data.teams) ? data.teams : [];
      if (fields.espBaseUrl) setEspBaseUrl(String(fields.espBaseUrl));
      const newTeams: Team[] = teams.map((t: any) => ({
        id: t.id || crypto.randomUUID(),
        name: String(t.name || 'TEAM'),
        logo: t.logo?.data || null,
        score: 0,
      }));
      updateConfig({
        headerTitle: String(fields.headerTitle || config.headerTitle),
        headerSubtitle: String(fields.headerSubtitle || config.headerSubtitle),
        questionTimeoutSeconds: Number(fields.questionTimeoutSeconds ?? config.questionTimeoutSeconds),
        currentQuestionNumber: Number(fields.currentQuestionNumber ?? config.currentQuestionNumber),
        buzzerSoundEnabled: !!fields.buzzerSoundEnabled,
        buzzerToneFreq: Number(fields.buzzerToneFreq ?? config.buzzerToneFreq),
        buzzerToneMs: Number(fields.buzzerToneMs ?? config.buzzerToneMs),
        leftLogo: assets.leftLogo?.data || null,
        rightLogo: assets.rightLogo?.data || null,
        mainAnimationGif: assets.mainAnimationGif?.data || null,
        buzzerAudioData: assets.buzzerAudio?.data || null,
        teams: newTeams,
      });
      setImportMsg(`Imported: ${file.name}`);
    } catch (e) {
      alert('Failed to import configuration. Ensure you selected a valid config file.');
    }
  };

  return (
    <div className="h-screen bg-dark-bg text-white p-4 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8 pb-24">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-pink">
              System Configuration
            </h1>
            <p className="text-gray-400 mt-2">Setup your quiz environment settings.</p>
          </div>
        <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-dark-surface border border-gray-700 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400">Module URL</span>
              <input
                value={espUrl}
                onChange={(e) => {
                  const v = e.target.value;
                  setEspUrl(v);
                  setEspBaseUrl(v);
                }}
                placeholder="http://192.168.x.x"
                className="bg-transparent outline-none text-sm text-white"
              />
              <button
                onClick={async () => {
                  try {
                    const h = await getHealth();
                    setHealthMsg(`Connected: ${h.ip}`);
                  } catch {
                    setHealthMsg('Connection failed');
                  }
                }}
                className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
              >Test</button>
              {healthMsg && <span className="text-xs text-gray-400 ml-2">{healthMsg}</span>}
            </div>
            <button
              onClick={exportSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              <Download size={18} /> Export
            </button>
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 transition-colors cursor-pointer">
              <Upload size={18} /> Import
              <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])} />
            </label>
            {importMsg && <span className="text-xs text-gray-400 self-center">{importMsg}</span>}
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
                const normalize = (u: string) => {
                  if (!u) return '';
                  const trimmed = u.trim();
                  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
                  return withProto.replace(/\/$/, '');
                };
                const base = normalize(espUrl);
                if (!base) { alert('Please set ESP32 URL first'); return; }
                setEspBaseUrl(base);
                try {
                  const h = await getHealth();
                  if (!h || !h.ok) throw new Error('health failed');
                } catch {
                  alert('ESP32 not reachable. Check the URL and network, then try Test.');
                  return;
                }
                const minutes = Math.round(config.questionTimeoutSeconds / 60);
                const durationMs = Math.max(0, minutes) * 60 * 1000;
                try { await postConfig(durationMs); } catch {
                  alert('Failed to send configuration to ESP32.');
                  return;
                }
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

            {/* Team List (rows) */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
              {config.teams.length === 0 && (
                <div className="text-center text-gray-500 py-10 italic">No teams added yet.</div>
              )}
              {config.teams.map((team, idx) => (
                <div key={team.id} className="p-3 bg-dark-surface rounded-lg border border-gray-700 transition-colors">
                  {editingTeamId === team.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="min-w-12 h-12 flex items-center justify-center text-xs font-bold text-neon-blue border border-neon-blue rounded">{idx + 1}</div>
                        <div className="w-10 h-10 rounded-full bg-black border border-gray-600 overflow-hidden flex items-center justify-center">
                          {editingLogo ? <img src={editingLogo} className="w-full h-full object-cover" /> : (team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">N/A</span>)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end w-full">
                        <NeonInput
                          label="Team Name"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          placeholder="Enter Name..."
                        />
                        <div className="w-full md:w-40">
                          <NeonFileInput
                            label="Logo"
                            onChange={(e) => e.target.files?.[0] && handleEditLogoUpload(e.target.files[0])}
                            preview={editingLogo || team.logo}
                            onClear={() => setEditingLogo(null)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:justify-end shrink-0 w-full md:w-auto md:self-start">
                        <button
                          onClick={() => { setEditingTeamId(null); setEditingName(''); setEditingLogo(null); }}
                          className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                        >Cancel</button>
                        <button
                          onClick={() => { if (!editingName.trim()) return; updateTeam(team.id, { name: editingName, logo: editingLogo }); setEditingTeamId(null); setEditingName(''); setEditingLogo(null); }}
                          className="px-3 py-2 rounded bg-neon-blue text-black font-bold text-sm"
                        >Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="min-w-12 h-12 flex items-center justify-center text-xs font-bold text-neon-blue border border-neon-blue rounded">{idx + 1}</div>
                        <div className="w-10 h-10 rounded-full bg-black border border-gray-600 overflow-hidden flex items-center justify-center">
                          {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <span className="text-xs text-gray-500">N/A</span>}
                        </div>
                        <span className="font-display font-bold text-lg">{team.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingTeamId(team.id); setEditingName(team.name); setEditingLogo(team.logo); }}
                          className="text-gray-400 hover:text-neon-blue p-2 rounded-full hover:bg-cyan-900/20 transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => removeTeam(team.id)}
                          className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Audio / Buzzer Sound */}
          <section className="bg-dark-card p-6 rounded-2xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-display text-neon-blue mb-6 border-l-4 border-neon-blue pl-4 flex items-center gap-2">
              <Music size={18} /> Quiz Buzzer Sound
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={config.buzzerSoundEnabled} onChange={(e) => updateConfig({ buzzerSoundEnabled: e.target.checked })} />
                  Enable sound in browser
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-dark-surface p-4 rounded-xl border border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Default Synth Tone</div>
                  <NeonInput
                    label="Base Frequency (Hz)"
                    type="number"
                    value={config.buzzerToneFreq}
                    min={100}
                    max={4000}
                    onChange={(e) => updateConfig({ buzzerToneFreq: Math.max(100, Math.min(4000, Number(e.target.value)||800)) })}
                  />
                  <NeonInput
                    label="Duration (ms)"
                    type="number"
                    value={config.buzzerToneMs}
                    min={50}
                    max={2000}
                    onChange={(e) => updateConfig({ buzzerToneMs: Math.max(50, Math.min(2000, Number(e.target.value)||200)) })}
                  />
                  <button
                    onClick={() => {
                      try {
                        const ac: any = (window as any).AudioContext || (window as any).webkitAudioContext;
                        const ctx = new ac();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = config.buzzerToneFreq;
                        gain.gain.value = 0.2;
                        osc.connect(gain); gain.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + config.buzzerToneMs/1000);
                      } catch {}
                    }}
                    className="mt-3 px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                  ><Play size={16} className="inline mr-1"/> Preview</button>
                </div>

                <div className="bg-dark-surface p-4 rounded-xl border border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Custom Audio File (small mp3/wav)</div>
                  <NeonFileInput
                    label="Attach Audio"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (!/^audio\//.test(f.type)) { alert('Please select an audio file'); return; }
                      if (f.size > 250000) { alert('Audio too large. Please keep under 250KB'); return; }
                      try {
                        const base64 = await fileToBase64(f);
                        updateConfig({ buzzerAudioData: base64 });
                      } catch { alert('Failed to load audio'); }
                    }}
                    preview={null}
                    onClear={() => updateConfig({ buzzerAudioData: null })}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      disabled={!config.buzzerAudioData}
                      onClick={() => { if (config.buzzerAudioData) { const a = new Audio(config.buzzerAudioData); a.play().catch(()=>{});} }}
                      className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm disabled:opacity-50"
                    ><Play size={16} className="inline mr-1"/> Preview</button>
                    <button
                      onClick={() => updateConfig({ buzzerAudioData: null })}
                      className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm"
                    ><StopCircle size={16} className="inline mr-1"/> Clear</button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">If a custom audio is provided and sound is enabled, it plays for each buzzer press. Otherwise, the synth tone is used.</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
