import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  Clock, 
  Bell, 
  Calendar, 
  User, 
  Trash2, 
  Upload,
  Save,
  Volume2,
  VolumeX,
  Pause,
  Play
} from 'lucide-react';
import { format } from 'date-fns';

export default function Settings() {
  const { settings, updateSettings } = useData();
  const { user, updateUser, deleteAccount } = useAuth();
  const [localSettings, setLocalSettings] = useState(settings);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [newStartDate, setNewStartDate] = useState(
    user?.startDate ? format(new Date(user.startDate), 'yyyy-MM-dd') : ''
  );

  const handleSettingsChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSessionTimeChange = (session: string, time: string) => {
    setLocalSettings(prev => ({
      ...prev,
      sessionTimes: {
        ...prev.sessionTimes,
        [session]: time
      }
    }));
  };

  const handleNotificationSoundChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      notificationSounds: {
        ...prev.notificationSounds,
        [key]: value
      }
    }));
  };

  const removeCustomSound = () => {
    if (window.confirm('Are you sure you want to remove the custom notification sound?')) {
      handleNotificationSoundChange('custom', '');
      // If custom sound was being used, switch to default
      if (!localSettings.notificationSounds.default) {
        handleNotificationSoundChange('default', true);
      }
    }
  };

  const playTestSound = () => {
    if (isPlayingSound && currentAudio) {
      // Pause current sound
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlayingSound(false);
      setCurrentAudio(null);
      return;
    }

    let audio: HTMLAudioElement;
    
    if (localSettings.notificationSounds.custom && !localSettings.notificationSounds.default) {
      // Play custom sound
      audio = new Audio(localSettings.notificationSounds.custom);
    } else {
      // Play default sound
      audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvmgo=');
    }

    // Add load event listener to ensure audio is ready
    audio.addEventListener('loadeddata', () => {
      setCurrentAudio(audio);
      setIsPlayingSound(true);
      
      audio.play().catch((error) => {
        console.error('Error playing sound:', error);
        setIsPlayingSound(false);
        setCurrentAudio(null);
        alert('Error playing sound. Please try a different audio file format (MP3, WAV recommended).');
      });
    });

    audio.addEventListener('error', (e) => {
      console.error('Audio loading error:', e);
      setIsPlayingSound(false);
      setCurrentAudio(null);
      alert('Error loading audio file. Please check that the file is a valid audio format.');
    });

    audio.addEventListener('ended', () => {
      setIsPlayingSound(false);
      setCurrentAudio(null);
    });

    // Start loading the audio
    audio.load();
  };
  const saveSettings = () => {
    updateSettings(localSettings);
    alert('Settings saved successfully!');
  };

  const handleStartDateChange = () => {
    if (newStartDate && user) {
      updateUser({ startDate: new Date(newStartDate) });
      alert('Start date updated successfully!');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      deleteAccount();
    }
  };

  const handleCustomSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid audio file (MP3, WAV, OGG, or WebM).');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Audio file is too large. Please choose a file smaller than 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        handleNotificationSoundChange('custom', dataUrl);
        // Automatically switch to custom sound when uploaded
        handleNotificationSoundChange('default', false);
      };
      reader.onerror = () => {
        alert('Error reading the audio file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure your TaskMasterScheduler preferences
            </p>
          </div>
        </div>
      </div>

      {/* Session Times */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Session Times</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Morning Session
            </label>
            <input
              type="time"
              value={localSettings.sessionTimes.morning}
              onChange={(e) => handleSessionTimeChange('morning', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Afternoon Session
            </label>
            <input
              type="time"
              value={localSettings.sessionTimes.afternoon}
              onChange={(e) => handleSessionTimeChange('afternoon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evening Session
            </label>
            <input
              type="time"
              value={localSettings.sessionTimes.evening}
              onChange={(e) => handleSessionTimeChange('evening', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End of Day Time
          </label>
          <input
            type="time"
            value={localSettings.endOfDayTime}
            onChange={(e) => handleSettingsChange('endOfDayTime', e.target.value)}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-600 mt-1">
            Time when end-of-day checklist notification is sent
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-6">
          {/* Telegram Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Telegram Bot Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token
                </label>
                <input
                  type="text"
                  value={localSettings.telegramBotToken}
                  onChange={(e) => handleSettingsChange('telegramBotToken', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Telegram bot token"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID
                </label>
                <input
                  type="text"
                  value={localSettings.telegramChatId}
                  onChange={(e) => handleSettingsChange('telegramChatId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your Telegram chat ID"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Configure your Telegram bot to receive mobile notifications. Create a bot via @BotFather and get your chat ID.
            </p>
          </div>

          {/* Sound Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Sounds</h3>
            
            <div className="space-y-4">
              {/* Sound Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Notification Sound
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="useDefaultSound"
                      type="radio"
                      name="soundType"
                      checked={localSettings.notificationSounds.default}
                      onChange={() => {
                        handleNotificationSoundChange('default', true);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="useDefaultSound" className="ml-2 text-sm text-gray-700">
                      Use default notification sound
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="useCustomSound"
                      type="radio"
                      name="soundType"
                      checked={!localSettings.notificationSounds.default && !!localSettings.notificationSounds.custom}
                      onChange={() => {
                        if (localSettings.notificationSounds.custom) {
                          handleNotificationSoundChange('default', false);
                        } else {
                          alert('Please upload a custom sound first.');
                        }
                      }}
                      disabled={!localSettings.notificationSounds.custom}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <label htmlFor="useCustomSound" className={`ml-2 text-sm ${!localSettings.notificationSounds.custom ? 'text-gray-400' : 'text-gray-700'}`}>
                      Use custom notification sound
                      {!localSettings.notificationSounds.custom && ' (upload required)'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Custom Sound Upload and Management */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Notification Sound
                </label>
                
                {localSettings.notificationSounds.custom ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Custom sound uploaded</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={playTestSound}
                          className={`flex items-center px-3 py-1 text-white text-sm rounded-lg transition-colors duration-200 ${
                            isPlayingSound 
                              ? 'bg-orange-600 hover:bg-orange-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {isPlayingSound ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Test
                            </>
                          )}
                        </button>
                        <button
                          onClick={removeCustomSound}
                          className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200">
                        <Upload className="w-4 h-4 mr-2" />
                        Replace Sound
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleCustomSoundUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                  <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors duration-200">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Sound
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleCustomSoundUpload}
                      className="hidden"
                    />
                  </label>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mt-1">
                  Upload a custom audio file for notifications (MP3, WAV, etc.)
                </p>
                
                {/* Test Default Sound Button */}
                <div className="mt-3">
                  <button
                    onClick={() => {
                      if (isPlayingSound && currentAudio) {
                        currentAudio.pause();
                        currentAudio.currentTime = 0;
                        setIsPlayingSound(false);
                        setCurrentAudio(null);
                        return;
                      }
                      
                      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvmgo=');
                      setCurrentAudio(audio);
                      setIsPlayingSound(true);
                      
                      audio.addEventListener('ended', () => {
                        setIsPlayingSound(false);
                        setCurrentAudio(null);
                      });
                      
                      audio.play().catch(console.error);
                    }}
                    className={`flex items-center px-3 py-2 text-white text-sm rounded-lg transition-colors duration-200 ${
                      isPlayingSound 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {isPlayingSound ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Default Sound
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-4 h-4 mr-2" />
                        Test Default Sound
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Schedule Settings</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Day Off Interval
          </label>
          <select
            value={localSettings.dayOffInterval}
            onChange={(e) => handleSettingsChange('dayOffInterval', parseInt(e.target.value))}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={7}>Every 7 days</option>
            <option value={10}>Every 10 days</option>
            <option value={14}>Every 14 days</option>
            <option value={15}>Every 15 days</option>
            <option value={21}>Every 21 days</option>
            <option value={30}>Every 30 days</option>
          </select>
          <p className="text-sm text-gray-600 mt-1">
            Mandatory rest day frequency
          </p>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Account Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-sm text-gray-600 mt-1">
              Username cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleStartDateChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Update
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Change your account start date for analytics calculation
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </button>
            
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 mb-3">
                  Are you sure you want to delete your account? This will permanently delete all your data including sessions, tasks, and analytics. This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    Yes, Delete Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <button
          onClick={saveSettings}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
        >
          <Save className="w-5 h-5 mr-2" />
          Save All Settings
        </button>
      </div>
    </div>
  );
}
