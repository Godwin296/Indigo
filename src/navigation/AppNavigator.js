import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, Feather } from '@expo/vector-icons';

// Écrans
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FeedScreen from '../screens/FeedScreen';
import AddPostScreen from '../screens/AddPostScreen';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#F5B53D', // Couleur Gold pour l'actif
        tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
      }}
    >
      <Tab.Screen 
        name="Accueil" 
        component={FeedScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> 
        }}
      />
      <Tab.Screen 
        name="Recherche" 
        component={View} 
        options={{ 
          tabBarIcon: ({ color }) => <Feather name="search" size={24} color={color} /> 
        }}
      />
      <Tab.Screen 
        name="Publier" 
        component={AddPostScreen} 
        options={{ 
          tabBarLabel: ({color}) => <Text style={[styles.tabBarLabel, {color, marginTop: 12}]}>Publier</Text>,
          tabBarIcon: () => (
            <View style={styles.addBtnContainer}>
               <View style={styles.addBtn}>
                 <Ionicons name="add" size={32} color="white" />
               </View>
            </View>
          ) 
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={View} 
        options={{ 
          tabBarIcon: ({ color }) => (
            <View>
              <Feather name="message-square" size={24} color={color} />
              <View style={styles.badge}><Text style={styles.badgeText}>2</Text></View>
            </View>
          ) 
        }}
      />
      <Tab.Screen 
        name="Profil" 
        component={ProfileScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} /> 
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.indigoPrimary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#050530' } }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050530' },
  tabBar: {
    backgroundColor: '#0A0C23',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    height: 85,
    paddingBottom: 20,
    position: 'absolute',
    elevation: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: -5
  },
  addBtnContainer: {
    top: -15, // Élévation visuelle
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: '#6C3BFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#6C3BFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#F5B53D',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    color: '#000',
    fontWeight: 'bold',
  }
});
