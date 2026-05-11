import { Client, Account, Databases, ID } from 'appwrite';

export const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);

export const APPWRITE_CONFIG = {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    collections: {
        users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        texts: import.meta.env.VITE_APPWRITE_TEXTS_COLLECTION_ID,
        results: import.meta.env.VITE_APPWRITE_RESULTS_COLLECTION_ID,
    }
};

export { ID };
