import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ManageMatchesScreen from '../screens/admin/ManageMatchesScreen';
import EditMatchScreen from '../screens/admin/EditMatchScreen';
import PlayersScreen from '../screens/admin/PlayersScreen';
import TournamentSetupScreen from '../screens/admin/TournamentSetupScreen';
import StandingsAdminScreen from '../screens/admin/StandingsAdminScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

export type AdminTabParams = {
  AdminHomeTab: undefined;
  MatchesAdminTab: undefined;
  TournamentTab: undefined;
  ProfileAdminTab: undefined;
};

export type AdminMatchStackParams = {
  ManageMatches: undefined;
  EditMatch: { matchId: string };
  Players: { divisionId: string };
  StandingsAdmin: { championshipId: string };
};

const Tab = createBottomTabNavigator<AdminTabParams>();
const MatchStack = createNativeStackNavigator<AdminMatchStackParams>();

function AdminMatchStackNavigator() {
  return (
    <MatchStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.secondary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <MatchStack.Screen name="ManageMatches" component={ManageMatchesScreen} options={{ title: 'Gestión de Partidos' }} />
      <MatchStack.Screen name="EditMatch" component={EditMatchScreen} options={{ title: 'Editar Partido' }} />
      <MatchStack.Screen name="Players" component={PlayersScreen} options={{ title: 'Jugadores' }} />
      <MatchStack.Screen name="StandingsAdmin" component={StandingsAdminScreen} options={{ title: 'Tabla de Posiciones' }} />
    </MatchStack.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'grid';
          if (route.name === 'AdminHomeTab') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'MatchesAdminTab') iconName = focused ? 'football' : 'football-outline';
          else if (route.name === 'TournamentTab') iconName = focused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'ProfileAdminTab') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: Colors.tabBarBackground,
          borderTopColor: Colors.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="AdminHomeTab" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="MatchesAdminTab" component={AdminMatchStackNavigator} options={{ title: 'Partidos' }} />
      <Tab.Screen name="TournamentTab" component={TournamentSetupScreen} options={{ title: 'Torneos', headerShown: true, headerStyle: { backgroundColor: Colors.secondary }, headerTintColor: Colors.white, headerTitle: 'Gestión de Torneos' }} />
      <Tab.Screen name="ProfileAdminTab" component={ProfileScreen} options={{ title: 'Perfil', headerShown: true, headerStyle: { backgroundColor: Colors.secondary }, headerTintColor: Colors.white, headerTitle: 'Mi Perfil' }} />
    </Tab.Navigator>
  );
}
