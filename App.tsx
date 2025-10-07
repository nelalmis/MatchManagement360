// ============================================
// Main App Component
// ============================================

import React from "react";
import { AppProvider} from "./src/context/AppContext";
import { NavigationContainer } from "@react-navigation/native";
import AppRouter  from './src/navigation/AppRouter';

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppRouter />
      </NavigationContainer>
    </AppProvider>
  );
}