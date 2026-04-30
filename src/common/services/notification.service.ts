import admin from "firebase-admin";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

export class NotificationService {

    private client?: admin.app.App;

    constructor() {
        try {
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || resolve('./config/social-app-ef577-firebase-adminsdk-fbsvc-69f0d62e0e.json');
            
            const serviceAccount = JSON.parse(
                readFileSync(serviceAccountPath, 'utf-8')
            );

            this.client = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("Firebase Admin initialized successfully.");
        } catch (error) {
            console.warn("Warning: Firebase Admin could not be initialized. Notifications will not work.");
            console.warn("Reason:", (error as any).message);
        }
    }

    async sendNotification({
        token,
        data
    }: {
        token: string;
        data: {
            title: string;
            body: string;
        }
    }) {
        if (!this.client) {
            console.error("Firebase client is not initialized. Cannot send notification.");
            return null;
        }

        const message = {
            token,
            data,
        };

        return await this.client.messaging().send(message);

    }

    async sendNotificatios({
        tokens,
        data
    }: {
        tokens: string[];
        data: {
            title: string;
            body: string;
        }
    }) {
        if (!this.client) {
            console.error("Firebase client is not initialized. Cannot send notifications.");
            return;
        }

        await Promise.allSettled(
            tokens.map(async token => {
                return await this.sendNotification({
                    token,
                    data
                })
            })
        )

        return;

    }
}

export const notificationService = new NotificationService();