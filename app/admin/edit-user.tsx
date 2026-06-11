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
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchUserProfileByUID,
  updateUserProfile,
  NewUserType,
  UserProfile,
} from '../../lib/user';
import { getCategories, Category } from '../../lib/categories';
import { Colors } from '../../constants/Colors';

const userTypes: Array<{ key: NewUserType; label: string }> = [
  { key: 'admin', label: 'Admin' },
  { key: 'subadmin', label: 'Subadmin' },
  { key: 'user', label: 'Usuario' },
  { key: 'player', label: 'Jugador' },
];

function inferType(profile: UserProfile): NewUserType {
  if (profile.isPlayer) return 'player';
  if (profile.roles?.admin) return 'admin';
  if (profile.roles?.subadmin) return 'subadmin';
  return 'user';
}

export default function EditUserScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState<NewUserType>('user');
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) return;
    Promise.all([fetchUserProfileByUID(uid), getCategories()])
      .then(([profile, categories]) => {
        if (!profile) {
          setError('No se encontró el usuario.');
          return;
        }
        setEmail(profile.email ?? '');
        setFirstName(profile.name ?? '');
        setLastName(profile.surname ?? '');
        setUserType(inferType(profile));
        setSelectedCategories(profile.playerProfile?.categories ?? []);
        setAvailableCategories(categories);
      })
      .catch(() => setError('Error cargando los datos del usuario.'))
      .finally(() => setLoading(false));
  }, [uid]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('Nombre y apellido son obligatorios.');
      return;
    }
    if (userType === 'player' && selectedCategories.length === 0) {
      setError('Seleccioná al menos una categoría para el jugador.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(uid!, firstName.trim(), lastName.trim(), userType, selectedCategories);
      setSuccess('Usuario actualizado correctamente.');
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      setError('No se pudo actualizar el usuario. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando usuario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Editar usuario</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.alertError}>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          ) : null}
          {success ? (
            <View style={styles.alertSuccess}>
              <Text style={styles.alertText}>{success}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.emailDisplay}>{email}</Text>

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

            <Text style={styles.label}>Tipo de usuario</Text>
            <View style={styles.typeRow}>
              {userTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typeButton, userType === type.key && styles.typeButtonActive]}
                  onPress={() => setUserType(type.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeText, userType === type.key && styles.typeTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {userType === 'player' && (
              <View style={styles.categoriesSection}>
                <Text style={styles.label}>Categorías del jugador</Text>
                {availableCategories.length === 0 ? (
                  <Text style={styles.helpText}>
                    No hay categorías registradas. Crealas desde Administrar categorías.
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

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancelar</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.mediumGray,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  container: {
    padding: 16,
    paddingBottom: 36,
  },
  alertError: {
    backgroundColor: '#FDE2E5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  alertSuccess: {
    backgroundColor: '#E8F6EF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  alertText: {
    color: Colors.darkGray,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  emailDisplay: {
    fontSize: 13,
    color: Colors.mediumGray,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
    color: Colors.darkGray,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  typeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FCE7EA',
  },
  typeText: {
    color: Colors.darkGray,
    fontWeight: '600',
  },
  typeTextActive: {
    color: Colors.primary,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  helpText: {
    color: Colors.mediumGray,
    fontSize: 13,
    marginBottom: 8,
  },
  leagueSection: {
    marginBottom: 12,
  },
  leagueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 8,
  },
  surfaceSection: {
    marginBottom: 10,
  },
  surfaceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mediumGray,
    marginBottom: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
  },
  categoryButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FCE7EA',
  },
  categoryButtonText: {
    color: Colors.darkGray,
    fontSize: 13,
  },
  categoryButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.secondary,
    fontWeight: '600',
  },
});
