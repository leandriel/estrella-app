import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

const MP_ACCESS_TOKEN = functions.config().mercadopago.access_token;
const FEE_AMOUNT = 2000; // Monto en pesos de la cuota mensual — cambiarlo según el club

// ============================================================
//  CLOUD FUNCTION 1: Generación automática de cuotas mensuales
//  Se ejecuta el día 1 de cada mes a las 9:00 AM (horario AR)
// ============================================================
export const generateMonthlyFees = functions
  .region('us-central1')
  .pubsub.schedule('0 12 1 * *') // Cron: día 1 de cada mes 12:00 UTC = 9:00 AR
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const dueDate = new Date(year, month - 1, 15); // Vencimiento el día 15

    // Obtener todos los usuarios activos (rol 'user')
    const usersSnap = await db.collection('users').where('role', '==', 'user').get();

    const batch = db.batch();
    const pushPromises: Promise<any>[] = [];

    for (const userDoc of usersSnap.docs) {
      const user = userDoc.data();

      // Verificar que no existe ya una cuota para este mes
      const existingFee = await db.collection('fees')
        .where('userId', '==', userDoc.id)
        .where('month', '==', month)
        .where('year', '==', year)
        .get();

      if (!existingFee.empty) continue;

      // Crear preferencia de pago en MercadoPago
      let preferenceId = '';
      let paymentUrl = '';

      try {
        const response = await axios.post(
          'https://api.mercadopago.com/checkout/preferences',
          {
            items: [{
              title: `Cuota Club Estrella del Sur - ${getMonthName(month)} ${year}`,
              quantity: 1,
              unit_price: FEE_AMOUNT,
              currency_id: 'ARS',
            }],
            payer: {
              email: user.email,
              name: user.displayName,
            },
            back_urls: {
              success: 'estrelladelsur://fees/success',
              failure: 'estrelladelsur://fees/failure',
              pending: 'estrelladelsur://fees/pending',
            },
            auto_return: 'approved',
            external_reference: `${userDoc.id}_${year}_${month}`,
            notification_url: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/mercadopagoWebhook`,
            expires: true,
            expiration_date_to: new Date(year, month - 1, 25, 23, 59, 59).toISOString(), // Expira el día 25
          },
          {
            headers: {
              Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );
        preferenceId = response.data.id;
        paymentUrl = response.data.init_point;
      } catch (err) {
        console.error(`Error creating MP preference for user ${userDoc.id}:`, err);
      }

      // Crear documento de cuota en Firestore
      const feeRef = db.collection('fees').doc();
      batch.set(feeRef, {
        userId: userDoc.id,
        month,
        year,
        amount: FEE_AMOUNT,
        status: 'pending',
        dueDate: dueDate.getTime(),
        description: `Cuota mensual ${getMonthName(month)} ${year}`,
        mercadopagoPreferenceId: preferenceId,
        paymentUrl,
        createdAt: Date.now(),
      });

      // Enviar push notification si el usuario tiene token
      if (user.expoPushToken) {
        pushPromises.push(
          sendExpoPushNotification(
            user.expoPushToken,
            '🏟️ Nueva cuota disponible',
            `Tu cuota de ${getMonthName(month)} ${year} ya está lista. Vence el 15/${month < 10 ? '0' + month : month}/${year}.`,
            { type: 'fee' }
          )
        );
      }
    }

    await batch.commit();
    await Promise.all(pushPromises);
    console.log(`✅ Cuotas generadas para ${month}/${year}`);
    return null;
  });

// ============================================================
//  CLOUD FUNCTION 2: Recordatorios de vencimiento (diario)
//  Se ejecuta cada día a las 10:00 AM hora argentina
// ============================================================
export const sendFeeReminders = functions
  .region('us-central1')
  .pubsub.schedule('0 13 * * *') // 13:00 UTC = 10:00 AR
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async () => {
    const now = Date.now();

    const feesSnap = await db.collection('fees')
      .where('status', 'in', ['pending', 'overdue'])
      .get();

    for (const feeDoc of feesSnap.docs) {
      const fee = feeDoc.data();
      const daysUntilDue = Math.ceil((fee.dueDate - now) / (1000 * 60 * 60 * 24));

      // Enviar recordatorio cuando falten 5, 3, 1 día o esté vencida (hasta -5 días)
      const shouldRemind = [5, 3, 1, 0, -1, -2, -3, -5].includes(daysUntilDue);
      if (!shouldRemind) continue;

      // Marcar como vencida si ya pasó la fecha
      if (daysUntilDue < 0 && fee.status === 'pending') {
        await feeDoc.ref.update({ status: 'overdue' });
      }

      const userDoc = await db.collection('users').doc(fee.userId).get();
      if (!userDoc.exists) continue;
      const user = userDoc.data()!;
      if (!user.expoPushToken) continue;

      let title = '';
      let body = '';
      if (daysUntilDue > 0) {
        title = `⏰ Tu cuota vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''}`;
        body = `La cuota de ${fee.description} vence el ${new Date(fee.dueDate).toLocaleDateString('es-AR')}.`;
      } else if (daysUntilDue === 0) {
        title = '🔴 Tu cuota vence HOY';
        body = `La cuota ${fee.description} vence hoy. ¡Abonala antes de que sea tarde!`;
      } else {
        title = `⚠️ Cuota VENCIDA (${Math.abs(daysUntilDue)} días)`;
        body = `Tu cuota ${fee.description} está vencida. Regularizá tu situación lo antes posible.`;
      }

      await sendExpoPushNotification(user.expoPushToken, title, body, { type: 'fee', feeId: feeDoc.id });
    }

    return null;
  });

// ============================================================
//  CLOUD FUNCTION 3: Webhook de MercadoPago
//  Recibe la confirmación de pago y actualiza el estado en Firestore
// ============================================================
export const mercadopagoWebhook = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    const { type, data } = req.body;

    if (type !== 'payment') {
      res.status(200).send('OK');
      return;
    }

    try {
      const paymentId = data.id;
      const response = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      const payment = response.data;
      if (payment.status !== 'approved') {
        res.status(200).send('OK — not approved');
        return;
      }

      // external_reference = "userId_year_month"
      const [userId, yearStr, monthStr] = (payment.external_reference as string).split('_');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const feeSnap = await db.collection('fees')
        .where('userId', '==', userId)
        .where('year', '==', year)
        .where('month', '==', month)
        .get();

      if (feeSnap.empty) {
        res.status(200).send('Fee not found');
        return;
      }

      const feeRef = feeSnap.docs[0].ref;
      await feeRef.update({
        status: 'paid',
        paidAt: Date.now(),
        mercadopagoPaymentId: String(paymentId),
      });

      // Notificar al usuario que su pago fue confirmado
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data()?.expoPushToken) {
        await sendExpoPushNotification(
          userDoc.data()!.expoPushToken,
          '✅ Pago confirmado',
          `Tu cuota de ${getMonthName(month)} ${year} fue acreditada correctamente. ¡Gracias!`,
          { type: 'fee' }
        );
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).send('Error');
    }
  });

// ============================================================
//  CLOUD FUNCTION 4: Broadcast de notificaciones (admin)
//  Llamada desde el admin cuando quiere enviar una notif masiva
// ============================================================
export const sendBroadcastNotification = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // Verificar que es admin
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'No autenticado');

    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden enviar notificaciones');
    }

    const { title, body, type } = data as { title: string; body: string; type: string };

    const usersSnap = await db.collection('users').where('expoPushToken', '!=', null).get();
    const tokens: string[] = usersSnap.docs
      .map((d) => d.data().expoPushToken)
      .filter(Boolean);

    await Promise.all(tokens.map((token) => sendExpoPushNotification(token, title, body, { type })));

    // Guardar en colección de notificaciones
    await db.collection('notifications').add({
      title,
      body,
      type,
      sentAt: Date.now(),
      read: false,
    });

    return { sent: tokens.length };
  });

// ============================================================
//  Helper: Expo Push Notifications via Expo Push API
// ============================================================
async function sendExpoPushNotification(
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  await axios.post('https://exp.host/--/api/v2/push/send', {
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
  });
}

function getMonthName(month: number): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1] ?? '';
}
