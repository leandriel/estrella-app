import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { login, clearError } from '../../store/slices/authSlice';
import { resetPassword } from '../../services/authService';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresá tu email y contraseña.');
      return;
    }
    dispatch(login({ email: email.trim(), password }));
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Ingresá tu email', 'Escribí tu email para recibir el link de recuperación.');
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert('Email enviado', 'Revisá tu correo para recuperar tu contraseña.');
    } catch {
      Alert.alert('Error', 'No se pudo enviar el email. Verificá que el correo sea correcto.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.clubName}>Club Estrella del Sur</Text>
        <Text style={styles.subtitle}>Bariloche · Desde 1958</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.formTitle}>Iniciar Sesión</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => dispatch(clearError())}>
              <Ionicons name="close" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.inputPassword]}
            placeholder="Contraseña"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.loginBtnText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tenés cuenta? Contactá al administrador del club.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: Colors.primary,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
    padding: 8,
  },
  logo: { width: 100, height: 100 },
  clubName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    flexGrow: 1,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { flex: 1, color: Colors.error, fontSize: 13 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  inputPassword: { paddingRight: 40 },
  eyeBtn: { position: 'absolute', right: 14 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: 4 },
  forgotText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: Colors.white, fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  footer: { marginTop: 32, alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center' },
});
