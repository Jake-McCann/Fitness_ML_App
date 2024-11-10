import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './constants/colors';
import HistoryScreen from './screens/HistoryScreen';
import CreateScreen from './screens/CreateScreen';
import SuggestionsScreen from './screens/SuggestionsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: COLORS.darkPurple,
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: COLORS.yellow,
          tabBarInactiveTintColor: COLORS.white,
          headerStyle: {
            backgroundColor: COLORS.darkPurple,
          },
          headerTintColor: COLORS.white,
        }}
      >
        <Tab.Screen 
          name="History" 
          component={HistoryScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Create" 
          component={CreateScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-circle" size={32} color={color} />
            ),
          }}
        />
        <Tab.Screen 
          name="Suggestions" 
          component={SuggestionsScreen}
          options={{
            tabBarIcon: ({ color }) => (
              <Ionicons name="bulb" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}