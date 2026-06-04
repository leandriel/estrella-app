import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store';
import { setUser } from '../store/slices/authSlice';
import { subscribeToAuthChanges } from '../services/authService';
import { registerForPushNotifications } from '../services/notificationService';
import { updatePushToken } from '../services/authService';
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import AdminNavigator from './AdminNavigator';
import { Colors } from '../constants/colors';

export default function AppNavigator() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((profile) => {
      dispatch(setUser(profile));
    });
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    registerForPushNotifications().then((token) => {
      if (token) updatePushToken(user.id, token);
    });
  }, [user?.id]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? <AuthNavigator /> : user.role === 'admin' ? <AdminNavigator /> : <UserNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});
