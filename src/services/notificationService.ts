import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C8102E',
    });
    await Notifications.setNotificationChannelAsync('fees', {
      name: 'Cuotas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F39C12',
    });
    await Notifications.setNotificationChannelAsync('matches', {
      name: 'Partidos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 100, 100, 100],
      lightColor: '#C8102E',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
};

export const scheduleLocalNotification = async (
  title: string,
  body: string,
  triggerAt: Date,
  data?: Record<string, string>
) => {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: { date: triggerAt },
  });
};

export const sendFeeReminderNotifications = async (userId: string, daysUntilDue: number) => {
  let title = '';
  let body = '';
  if (daysUntilDue > 0) {
    title = `Cuota por vencer en ${daysUntilDue} días`;
    body = `Tu cuota mensual vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}. No te olvides de abonarla.`;
  } else if (daysUntilDue === 0) {
    title = 'Tu cuota vence HOY';
    body = 'La cuota mensual vence hoy. Abonala para evitar recargos.';
  } else {
    title = 'Cuota VENCIDA';
    body = `Tu cuota mensual está vencida hace ${Math.abs(daysUntilDue)} día${Math.abs(daysUntilDue) > 1 ? 's' : ''}. Regularizá tu situación cuanto antes.`;
  }
  await saveNotification({ userId, title, body, type: 'fee' });
};

const saveNotification = async (data: {
  userId?: string;
  title: string;
  body: string;
  type: Notification['type'];
  extra?: Record<string, string>;
}) => {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    sentAt: Date.now(),
    read: false,
  });
};

export const broadcastMatchNotification = async (title: string, body: string) => {
  await saveNotification({ title, body, type: 'match' });
};

export const broadcastGoalNotification = async (
  playerName: string,
  team: string,
  division: string,
  currentScore: string
) => {
  const title = `GOL de ${playerName}!`;
  const body = `${team} anota en ${division}. Resultado: ${currentScore}`;
  await saveNotification({ title, body, type: 'goal' });
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', 'in', [userId, null]),
    orderBy('sentAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
};

export const markNotificationRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};
