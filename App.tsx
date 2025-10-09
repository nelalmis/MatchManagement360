import React from "react";
import { AppProvider } from "./src/context/AppContext";
import AppRouter from './src/navigation/AppRouter';
import { NavigationProvider, useNavigationContext } from "./src/context/NavigationContext";
import { NavigationContainer } from "@react-navigation/native";

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
