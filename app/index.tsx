import { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../constants/Colors';

export default function SplashPage() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center' }}>
        <Text style={styles.clubLabel}>CLUB SOCIAL Y DEPORTIVO</Text>
        <Text style={styles.clubName}>ESTRELLA DEL SUR</Text>
        <Text style={styles.clubSub}>BARILOCHE · 1958</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 28,
  },
  logo: {
    width: 200,
    height: 200,
  },
  clubLabel: {
    fontSize: 13,
    letterSpacing: 2.5,
    color: Colors.secondary,
    fontWeight: '500',
  },
  clubName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 3,
    marginTop: 6,
  },
  clubSub: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 8,
    letterSpacing: 2,
  },
});
