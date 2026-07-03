import 'react-native-gesture-handler'; 
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext'; // Import du moteur
import AppNavigator from './src/navigation/AppNavigator';
import { RootSiblingParent } from 'react-native-root-siblings';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootSiblingParent>
        <AuthProvider> 
          <AppNavigator />
        </AuthProvider>
      </RootSiblingParent>
    </SafeAreaProvider>
  );
}
