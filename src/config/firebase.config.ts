import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type Messaging, type MulticastMessage, type SendResponse } from 'firebase-admin/messaging';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './logger.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isInitialized = false;

/**
 * Attempt to locate and load Firebase Service Account Credentials.
 * Checks in priority:
 * 1. Process env FIREBASE_SERVICE_ACCOUNT_KEY (as raw JSON string or file path)
 * 2. Process env FIREBASE_SERVICE_ACCOUNT_PATH (file path)
 * 3. Default relative files: serviceAccountKey.json, firebase-service-account.json
 */
const loadServiceAccountCredentials = (): ServiceAccount | null => {
  const rootDir = path.resolve(__dirname, '../../');

  // 1. Check FIREBASE_SERVICE_ACCOUNT_KEY
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envKey && envKey.trim()) {
    const trimmed = envKey.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return JSON.parse(trimmed) as ServiceAccount;
      } catch (e: any) {
        logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:', { error: e.message });
      }
    } else {
      // Treat as file path
      const resolvedPath = path.isAbsolute(trimmed) ? trimmed : path.resolve(rootDir, trimmed);
      if (fs.existsSync(resolvedPath)) {
        try {
          return JSON.parse(fs.readFileSync(resolvedPath, 'utf-8')) as ServiceAccount;
        } catch (e: any) {
          logger.error(`Failed to read Firebase service account at path: ${resolvedPath}`, { error: e.message });
        }
      }
    }
  }

  // 2. Check FIREBASE_SERVICE_ACCOUNT_PATH
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (envPath && envPath.trim()) {
    const resolvedPath = path.isAbsolute(envPath) ? envPath : path.resolve(rootDir, envPath.trim());
    if (fs.existsSync(resolvedPath)) {
      try {
        return JSON.parse(fs.readFileSync(resolvedPath, 'utf-8')) as ServiceAccount;
      } catch (e: any) {
        logger.error(`Failed to read Firebase service account from FIREBASE_SERVICE_ACCOUNT_PATH: ${resolvedPath}`, { error: e.message });
      }
    }
  }

  // 3. Check common default file locations
  const defaultLocations = [
    path.resolve(rootDir, 'serviceAccountKey.json'),
    path.resolve(rootDir, 'firebase-service-account.json'),
    path.resolve(rootDir, 'src/config/serviceAccountKey.json'),
  ];

  for (const loc of defaultLocations) {
    if (fs.existsSync(loc)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(loc, 'utf-8')) as ServiceAccount;
        logger.info(`Loaded Firebase credentials from file: ${loc}`);
        return parsed;
      } catch (e: any) {
        logger.error(`Found credentials file at ${loc} but failed to parse:`, { error: e.message });
      }
    }
  }

  return null;
};

/**
 * Initialize Firebase Admin SDK
 */
export const initFirebase = (): boolean => {
  if (isInitialized) {
    return true;
  }

  try {
    if (getApps().length > 0) {
      isInitialized = true;
      return true;
    }

    const credentials = loadServiceAccountCredentials();

    if (!credentials) {
      logger.warn(
        '⚠️ Firebase Admin SDK not initialized: No serviceAccountKey found. In-app notifications will still be saved to the database, but FCM push notifications are paused until credentials are provided.'
      );
      return false;
    }

    initializeApp({
      credential: cert(credentials),
    });

    isInitialized = true;
    logger.info('🔥 Firebase Admin SDK initialized successfully.');
    return true;
  } catch (error: any) {
    logger.error('Failed to initialize Firebase Admin SDK:', {
      error: error.message,
      stack: error.stack,
    });
    isInitialized = false;
    return false;
  }
};

/**
 * Check if Firebase Admin is currently active and initialized
 */
export const isFirebaseReady = (): boolean => {
  return isInitialized && getApps().length > 0;
};

/**
 * Get Firebase Messaging instance if available
 */
export const getFirebaseMessaging = (): Messaging | null => {
  if (!isFirebaseReady()) {
    initFirebase();
  }
  return isFirebaseReady() ? getMessaging() : null;
};

export interface PushNotificationPayload {
  title: string;
  description: string;
  imageUrl?: string | null;
  data?: Record<string, any>;
}

export interface BatchPushResult {
  totalTokens: number;
  successCount: number;
  failureCount: number;
  failedTokens: string[];
}

/**
 * Send multicast FCM push notifications in batches of up to 400 tokens
 * (User constraint: "he cna sned. ncoaiotn upto 400 user add usig the. batch htere")
 */
export const sendBatchPushNotifications = async (
  tokens: string[],
  payload: PushNotificationPayload,
  batchSize: number = 400
): Promise<BatchPushResult> => {
  const messaging = getFirebaseMessaging();

  // Deduplicate and filter non-empty tokens
  const validTokens = [...new Set(tokens.filter(t => typeof t === 'string' && t.trim().length > 0))];

  if (!messaging || validTokens.length === 0) {
    return {
      totalTokens: validTokens.length,
      successCount: 0,
      failureCount: 0,
      failedTokens: [],
    };
  }

  // Convert all data values to strings (required by FCM data payload)
  const stringifiedData: Record<string, string> = {};
  if (payload.data) {
    for (const [key, val] of Object.entries(payload.data)) {
      if (val !== undefined && val !== null) {
        stringifiedData[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
    }
  }

  stringifiedData.title = payload.title;
  stringifiedData.description = payload.description;
  stringifiedData.click_action = 'FLUTTER_NOTIFICATION_CLICK';

  let totalSuccess = 0;
  let totalFailure = 0;
  const failedTokens: string[] = [];

  // Chunk tokens into batches of up to batchSize (400)
  for (let i = 0; i < validTokens.length; i += batchSize) {
    const chunk = validTokens.slice(i, i + batchSize);

    const message: MulticastMessage = {
      tokens: chunk,
      notification: {
        title: payload.title,
        body: payload.description,
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          priority: 'max',
          channelId: 'kirtan_education_channel',
          ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
        fcmOptions: payload.imageUrl ? { imageUrl: payload.imageUrl } : undefined,
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      response.responses.forEach((resp: SendResponse | any, index: number) => {
        if (!resp.success) {
          const failedToken = chunk[index];
          failedTokens.push(failedToken);
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            logger.warn(`Unregistered/Invalid FCM token encountered: ${failedToken}`);
          }
        }
      });
    } catch (batchError: any) {
      logger.error('Error sending multicast notification batch:', {
        error: batchError.message,
        batchSize: chunk.length,
      });
      totalFailure += chunk.length;
      failedTokens.push(...chunk);
    }
  }

  logger.info(
    `Batch push notifications completed: ${totalSuccess} succeeded, ${totalFailure} failed out of ${validTokens.length} tokens.`
  );

  return {
    totalTokens: validTokens.length,
    successCount: totalSuccess,
    failureCount: totalFailure,
    failedTokens,
  };
};
