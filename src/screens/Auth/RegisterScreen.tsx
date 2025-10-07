// ============================================
// RegisterScreen.tsx
// ============================================

import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { IPlayer } from "../../types";

export const RegisterScreen: React.FC = () => {
  const { setUser, setCurrentScreen, phoneNumber } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    position: '',
    jerseyNumber: '',
    birthDate: new Date(),
    lastLogin: new Date()    
  });

  const handleRegister = () => {
    const userData: any = {
      ...formData,
      phone: phoneNumber,
      id:1
    };
    setUser(userData);
    setCurrentScreen('home');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6 mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Oyuncu Bilgileri</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) => setFormData({...formData, surname: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pozisyon</label>
            <select
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="">Seçiniz</option>
              <option value="goalkeeper">Kaleci</option>
              <option value="defender">Defans</option>
              <option value="midfielder">Orta Saha</option>
              <option value="forward">Forvet</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma Numarası
              </label>
              <input
                type="number"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({...formData, jerseyNumber: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doğum Tarihi
              </label>
              <input
                type="date"
                value={formData.birthDate.toDateString()}
                onChange={(e) => setFormData({...formData, birthDate: new Date(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleRegister}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition mt-6"
          >
            Kayıt Ol
          </button>
        </div>
      </div>
    </div>
  );
};

