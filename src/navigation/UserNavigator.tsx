import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

import DashboardScreen from '../screens/user/DashboardScreen';
import NewsScreen from '../screens/user/NewsScreen';
import MatchesScreen from '../screens/user/MatchesScreen';
import TrainingScreen from '../screens/user/TrainingScreen';
import FixtureScreen from '../screens/user/FixtureScreen';
import ChampionshipsScreen from '../screens/user/ChampionshipsScreen';
import FeesScreen from '../screens/user/FeesScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

export type UserTabParams = {
  HomeTab: undefined;
  MatchesTab: undefined;
  FeesTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParams = {
  Dashboard: undefined;
  News: undefined;
  Matches: undefined;
  Training: undefined;
  Fixture: undefined;
  Championships: undefined;
};

const Tab = createBottomTabNavigator<UserTabParams>();
const HomeStack = createNativeStackNavigator<HomeStackParams>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Estrella del Sur' }} />
      <HomeStack.Screen name="News" component={NewsScreen} options={{ title: 'Novedades' }} />
      <HomeStack.Screen name="Matches" component={MatchesScreen} options={{ title: 'Partidos' }} />
      <HomeStack.Screen name="Training" component={TrainingScreen} options={{ title: 'Entrenamientos' }} />
      <HomeStack.Screen name="Fixture" component={FixtureScreen} options={{ title: 'Fixture' }} />
      <HomeStack.Screen name="Championships" component={ChampionshipsScreen} options={{ title: 'Campeonatos' }} />
    </HomeStack.Navigator>
  );
}

export default function UserNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'home';
          if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'MatchesTab') iconName = focused ? 'football' : 'football-outline';
          else if (route.name === 'FeesTab') iconName = focused ? 'card' : 'card-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.border,
          elevation: 8,
          shadowColor: Colors.black,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Inicio' }} />
      <Tab.Screen name="MatchesTab" component={MatchesScreen} options={{ title: 'Partidos', headerShown: true, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white, headerTitle: 'Partidos' }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: 'Cuotas', headerShown: true, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white, headerTitle: 'Mis Cuotas' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil', headerShown: true, headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white, headerTitle: 'Mi Perfil' }} />
    </Tab.Navigator>
  );
}
