// ============================================
// INDEX.TS (EXPO)
// ============================================

import 'react-native-gesture-handler'; // ⚠️ EN ÜSTTE OLMALI!
import { registerRootComponent } from 'expo';
// import App from './App';
import AppV2 from './AppV2';
import AppV3 from './AppV3';
import AppTest from './AppTest';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(AppV3);
