import React from "react";
import { AppProvider } from "./src/context/AppContext";
import AppRouter from './src/navigation/AppRouter';
import { NavigationProvider, useNavigationContext } from "./src/context/NavigationContext";
import { NavigationContainer } from "@react-navigation/native";

/*
Uygulama İsmi Önerileri:

⚡ "MatchUp" - Her Spor İçin
🏆 "TeamPlay" - Takım Sporları Hub'ı
🎯 "SportSync" - Spor Organizasyon Platformu
🏅 "PlayMate" - Oyun Arkadaşı Bul
*/
export default function App() {
  return (
    <NavigationContainer>
      <NavigationProvider>
        <AppProvider>
          <AppRouter />
        </AppProvider>
      </NavigationProvider>
    </NavigationContainer>
  );
}
