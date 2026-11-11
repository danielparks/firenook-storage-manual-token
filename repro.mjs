// Run through `emulators:exec` (see package.json) so the Storage emulator is up.
//
// 1. Upload an object with the Admin SDK (a direct write, not the Firebase
//    Storage API), setting `firebaseStorageDownloadTokens` in its custom
//    metadata. This is the documented way to give such an object a download
//    token.
// 2. Ask the web SDK for its download URL.
//
// Google's emulator: getDownloadURL resolves to a URL containing the token.
// Firenook: getDownloadURL rejects with "storage/no-download-url", even though
// the Admin SDK reports the token in the object's metadata.

import { randomUUID } from "node:crypto";

import { initializeApp as initializeAdmin } from "firebase-admin/app";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { initializeApp as initializeClient } from "firebase/app";
import { connectStorageEmulator, getDownloadURL, getStorage, ref } from "firebase/storage";

const PROJECT_ID = "demo-repro";
const BUCKET = `${PROJECT_ID}.appspot.com`;
const HOST = "127.0.0.1";
const PORT = 9199;
const PATH = "images/example";
const TOKEN = randomUUID();

process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= `${HOST}:${PORT}`;

// Admin SDK: write the object with a token in its custom metadata.
const admin = initializeAdmin({ projectId: PROJECT_ID, storageBucket: BUCKET });
const file = getAdminStorage(admin).bucket().file(PATH);
await file.save(Buffer.from("not really a jpeg"), {
    contentType: "image/jpeg",
    metadata: { metadata: { firebaseStorageDownloadTokens: TOKEN } },
});

const [metadata] = await file.getMetadata();
console.log("Admin SDK sees metadata.metadata:", JSON.stringify(metadata.metadata));

// Web SDK: ask for the download URL.
const client = initializeClient({ projectId: PROJECT_ID, storageBucket: BUCKET }, "client");
const storage = getStorage(client);
connectStorageEmulator(storage, HOST, PORT);

try {
    const url = await getDownloadURL(ref(storage, PATH));
    console.log("getDownloadURL OK:", url);
    if (!url.includes(`token=${TOKEN}`)) {
        console.error("FAIL: the URL does not carry the token that was set");
        process.exitCode = 1;
    }
} catch (error) {
    console.error("FAIL: getDownloadURL threw:", error.code ?? error);
    process.exitCode = 1;
}
