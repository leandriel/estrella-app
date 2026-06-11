import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../../lib/firebase';
import { buildUserPermissions, buildUserRoles, NewUserType, UserProfile } from '../../lib/user';
import { getCategories, Category } from '../../lib/categories';
import { Colors } from '../../constants/Colors';

const userTypes: Array<{ key: NewUserType; label: string }> = [
  { key: 'admin', label: 'Admin' },
  { key: 'subadmin', label: 'Subadmin' },
  { key: 'user', label: 'Usuario' },
  { key: 'player', label: 'Jugador' },
];

export default function CreateUserScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<NewUserType>('user');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let canceled = false;

    async function loadCategories() {
      setIsLoadingCategories(true);
      try {
        const categoriesFromDb = await getCategories();
        if (!canceled) {
          setAvailableCategories(categoriesFromDb);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
        if (!canceled) {
          setError('No se pudieron cargar las categorías. Revisá la conexión y que existan en Firestore.');
        }
      } finally {
        if (!canceled) {
          setIsLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      canceled = true;
    };
  }, []);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((item) => item !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email.trim() || !password || !confirmPassword || !firstName.trim() || !lastName.trim()) {
      setError('Completá todos los campos obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      setError('No se encontró sesión de administrador. Volvé a iniciar sesión.');
      return;
    }

    if (!adminPassword.trim()) {
      setError('Ingresá tu contraseña de administrador para confirmar la creación.');
      return;
    }

    if (userType === 'player' && selectedCategories.length === 0) {
      setError('Seleccioná al menos una categoría para el jugador.');
      return;
    }

    setLoading(true);

    try {
      const secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);

      const newUser = await createUserWithEmailAndPassword(secondaryAuth, email.trim().toLowerCase(), password);

      const roles = buildUserRoles(userType);
      const permissions = buildUserPermissions(roles);
      const profileData: UserProfile = {
        id: newUser.user.uid,
        email: email.trim().toLowerCase(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        name: firstName.trim(),
        surname: lastName.trim(),
        roles,
        isPlayer: userType === 'player',
        permissions,
        metadata: {
          createdAt: serverTimestamp(),
          createdBy: currentUser.uid,
        },
        ...(userType === 'player' ? { playerProfile: { categories: selectedCategories } } : {}),
      } as UserProfile;

      await setDoc(doc(db, 'users', newUser.user.uid), profileData);
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setSuccess('Usuario creado correctamente.');
      setTimeout(() => router.replace('/dashboard'), 1200);
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setError('El email ya está registrado.');
      } else if (code === 'auth/invalid-email') {
        setError('El email no es válido.');
      } else if (code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Error al crear el usuario. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Crear nuevo usuario</Text>
            <Text style={styles.pageSubtitle}>Como admin podés crear cualquier perfil del club.</Text>
          </View>

          {error ? (
            <View style={styles.feedbackBoxError}>
              <Text style={styles.feedbackText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.feedbackBoxSuccess}>
              <Text style={styles.feedbackText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Nombre"
              placeholderTextColor={Colors.mediumGray}
            />

            <Text style={styles.label}>Apellido</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Apellido"
              placeholderTextColor={Colors.mediumGray}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@estrellasur.com"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={Colors.mediumGray}
              secureTextEntry
            />

            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar contraseña"
              placeholderTextColor={Colors.mediumGray}
              secureTextEntry
            />

            <Text style={styles.label}>Tipo de usuario</Text>
            <View style={styles.userTypeRow}>
              {userTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.userTypeButton,
                    userType === type.key && styles.userTypeButtonActive,
                  ]}
                  onPress={() => setUserType(type.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.userTypeText,
                      userType === type.key && styles.userTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {userType === 'player' && (
              <View style={styles.categoriesSection}>
                <Text style={styles.label}>Categorías del jugador</Text>
                <Text style={styles.helpText}>
                  Seleccioná las categorías válidas del torneo. Campo = cancha de 11.
                </Text>
                {isLoadingCategories ? (
                  <Text style={styles.helpText}>Cargando categorías desde Firestore...</Text>
                ) : availableCategories.length === 0 ? (
                  <Text style={styles.helpText}>
                    No hay categorías registradas. Crealas primero desde Administrar categorías.
                  </Text>
                ) : (
                  (['ADEFUL', 'LIFUBA'] as const).map((league) => {
                    const leagueCategories = availableCategories.filter((c) => c.league === league);
                    if (leagueCategories.length === 0) return null;
                    return (
                      <View key={league} style={styles.leagueSection}>
                        <Text style={styles.leagueTitle}>{league}</Text>
                        {(['futsal', 'campo'] as const).map((surface) => {
                          const surfaceCategories = leagueCategories.filter((c) => c.surface === surface);
                          if (surfaceCategories.length === 0) return null;
                          return (
                            <View key={surface} style={styles.surfaceSection}>
                              <Text style={styles.surfaceTitle}>
                                {surface === 'futsal' ? 'Futsal' : 'Campo'}
                              </Text>
                              <View style={styles.categoryGrid}>
                                {surfaceCategories.map((category) => {
                                  const selected = selectedCategories.includes(category.id);
                                  return (
                                    <TouchableOpacity
                                      key={category.id}
                                      style={[
                                        styles.categoryButton,
                                        selected && styles.categoryButtonActive,
                                      ]}
                                      onPress={() => toggleCategory(category.id)}
                                      activeOpacity={0.8}
                                    >
                                      <Text
                                        style={[
                                          styles.categoryButtonText,
                                          selected && styles.categoryButtonTextActive,
                                        ]}
                                      >
                                        {category.displayName}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </View>
            )}

            <Text style={styles.label}>Contraseña admin</Text>
            <TextInput
              style={styles.input}
              value={adminPassword}
              onChangeText={setAdminPassword}
              placeholder="Contraseña de administrador"
              placeholderTextColor={Colors.mediumGray}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>CREAR USUARIO</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.darkGray,
    marginBottom: 6,
  },
  pageSubtitle: {
    color: Colors.mediumGray,
    marginBottom: 18,
    fontSize: 13,
  },
  feedbackBoxError: {
    backgroundColor: '#FFF0F0',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  feedbackBoxSuccess: {
    backgroundColor: '#E8F6EA',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  feedbackText: {
    color: Colors.darkGray,
    fontSize: 13,
  },
  formSection: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    boxShadow: '0 5px 18px rgba(0,0,0,0.05)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
    fontSize: 15,
    color: Colors.darkGray,
  },
  userTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  userTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  userTypeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FCE7EA',
  },
  userTypeText: {
    color: Colors.darkGray,
    fontWeight: '600',
  },
  userTypeTextActive: {
    color: Colors.primary,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  helpText: {
    color: Colors.darkGray,
    marginBottom: 8,
    fontSize: 12,
  },
  leagueSection: {
    marginBottom: 14,
  },
  leagueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  surfaceSection: {
    marginBottom: 10,
  },
  surfaceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mediumGray,
    marginBottom: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },
  categoryButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FCE7EA',
  },
  categoryButtonText: {
    color: Colors.darkGray,
  },
  categoryButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  categoryInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  categoryInput: {
    flex: 1,
  },
  addCategoryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addCategoryText: {
    color: Colors.white,
    fontWeight: '700',
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#EAF2FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryTagText: {
    color: Colors.darkGray,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 8,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.secondary,
    fontWeight: '600',
  },
});
