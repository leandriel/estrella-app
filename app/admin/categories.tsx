import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories, saveCategory, deleteCategory, Category, LeagueName, Surface } from '../../lib/categories';
import { Colors } from '../../constants/Colors';
import { auth } from '../../lib/firebase';
import { fetchUserProfileByUID, UserProfile } from '../../lib/user';

const leagues: LeagueName[] = ['ADEFUL', 'LIFUBA'];
const surfaces: Surface[] = ['futsal', 'campo'];

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export default function AdminCategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [league, setLeague] = useState<LeagueName>('ADEFUL');
  const [surface, setSurface] = useState<Surface>('futsal');
  const [order, setOrder] = useState('1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid ?? null;
    setCurrentUserId(uid);

    if (uid) {
      fetchUserProfileByUID(uid).then(setCurrentProfile).catch((err) => {
        console.error('Error cargando perfil actual:', err);
      });
    }

    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const loaded = await getCategories();
      setCategories(loaded);
      if (!selectedId && loaded.length > 0) {
        setOrder(String(loaded.length + 1));
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('No se pudieron cargar las categorías. Volvé a intentar.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSelectedId(null);
    setDisplayName('');
    setLeague('ADEFUL');
    setSurface('futsal');
    setOrder(String(categories.length + 1 || 1));
    setError('');
    setSuccess('');
  };

  const handleEdit = (category: Category) => {
    setSelectedId(category.id);
    setDisplayName(category.displayName);
    setLeague(category.league);
    setSurface(category.surface);
    setOrder(String(category.order));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    console.log('Saving category as uid:', auth.currentUser?.uid, 'profile:', currentProfile);
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('Ingresá un nombre válido para la categoría.');
      return;
    }

    const parsedOrder = Number(order);
    if (Number.isNaN(parsedOrder) || parsedOrder < 1) {
      setError('Ingresá un orden válido mayor o igual a 1.');
      return;
    }

    const categoryId = selectedId ?? `${league.toLowerCase()}-${normalizeId(displayName)}-${surface}`;
    const category: Category = {
      id: categoryId,
      displayName: displayName.trim(),
      league,
      surface,
      order: parsedOrder,
    };

    setSaving(true);
    try {
      // DEBUG: Log auth state and token before saving
      console.log('[DEBUG] About to save category:', { categoryId: category.id, displayName: category.displayName });
      console.log('[DEBUG] auth.currentUser:', auth.currentUser?.uid);
      
      if (auth.currentUser) {
        try {
          const tokenResult = await auth.currentUser.getIdTokenResult(true);
          console.log('[DEBUG] idToken exists:', !!tokenResult.token);
          console.log('[DEBUG] idToken claims:', tokenResult.claims);
        } catch (tokenErr) {
          console.error('[DEBUG] Error getting idToken:', tokenErr);
        }
      } else {
        console.warn('[DEBUG] auth.currentUser is null!');
      }
      
      await saveCategory(category);
      setSuccess(selectedId ? 'Categoría actualizada correctamente.' : 'Categoría creada correctamente.');
      clearForm();
      await loadCategories();
    } catch (err) {
      console.error('Error guardando categoría:', err);
      setError('No se pudo guardar la categoría. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    Alert.alert('Eliminar categoría', '¿Querés eliminar esta categoría?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await deleteCategory(categoryId);
            setSuccess('Categoría eliminada correctamente.');
            if (selectedId === categoryId) {
              clearForm();
            }
            await loadCategories();
          } catch (err) {
            console.error('Error eliminando categoría:', err);
            setError('No se pudo eliminar la categoría. Intentá de nuevo.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Administrar categorías</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Debug auth</Text>
          <Text style={styles.debugText}>UID actual: {currentUserId ?? 'no autorizado'}</Text>
          <Text style={styles.debugText}>Perfil cargado: {currentProfile ? JSON.stringify(currentProfile.roles ?? currentProfile.permissions ?? {}) : 'no cargado'}</Text>
        </View>
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
          <Text style={styles.sectionTitle}>{selectedId ? 'Editar categoría' : 'Crear nueva categoría'}</Text>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Primera futsal"
            placeholderTextColor={Colors.mediumGray}
          />

          <Text style={styles.label}>Liga</Text>
          <View style={styles.segmentRow}>
            {leagues.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.segmentButton, league === item && styles.segmentButtonActive]}
                onPress={() => setLeague(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, league === item && styles.segmentTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Superficie</Text>
          <View style={styles.segmentRow}>
            {surfaces.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.segmentButton, surface === item && styles.segmentButtonActive]}
                onPress={() => setSurface(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, surface === item && styles.segmentTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Orden</Text>
          <TextInput
            style={styles.input}
            value={order}
            onChangeText={setOrder}
            placeholder="1"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="number-pad"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>{selectedId ? 'Guardar cambios' : 'Crear categoría'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearForm} activeOpacity={0.8}>
              <Text style={styles.clearText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Categorías existentes</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loadingIndicator} />
          ) : (
            categories.map((category) => (
              <View key={category.id} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>
                    {category.displayName}{' '}
                    <Text style={styles.categoryNameSurface}>
                      ({category.surface === 'futsal' ? 'Futsal' : 'Campo'})
                    </Text>
                  </Text>
                  <Text style={styles.categoryMeta}>{category.league} · Orden {category.order}</Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity onPress={() => handleEdit(category)} style={styles.editButton} activeOpacity={0.8}>
                    <Text style={styles.editText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(category.id)} style={styles.deleteButton} activeOpacity={0.8}>
                    <Text style={styles.deleteText}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          {categories.length === 0 && !loading ? (
            <Text style={styles.emptyText}>No hay categorías cargadas aún.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightGray,
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
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: Colors.darkGray,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F8FA',
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: Colors.darkGray,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
  },
  segmentButtonActive: {
    backgroundColor: '#FCE7EA',
    borderColor: Colors.primary,
  },
  segmentText: {
    color: Colors.darkGray,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: Colors.white,
    fontWeight: '700',
  },
  clearButton: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 14,
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearText: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.inputBorder,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  categoryNameSurface: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.mediumGray,
  },
  categoryMeta: {
    fontSize: 13,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EFF7FF',
  },
  editText: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FCE7EA',
  },
  deleteText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  alertError: {
    backgroundColor: '#FDE2E5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  alertSuccess: {
    backgroundColor: '#E8F6EF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  alertText: {
    color: Colors.darkGray,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginVertical: 16,
  },
  emptyText: {
    color: Colors.mediumGray,
    fontSize: 13,
    marginTop: 12,
  },
  debugSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  debugTitle: {
    color: Colors.secondary,
    fontWeight: '700',
    marginBottom: 6,
  },
  debugText: {
    color: Colors.darkGray,
    fontSize: 12,
  },
});
