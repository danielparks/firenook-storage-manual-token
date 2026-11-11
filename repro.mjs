// Run through `emulators:exec` (see package.json) so the Storage emulator is up.
//
// 1. Upload with the Admin SDK (a direct write, not the Firebase Storage API).
// 2. Ask the web SDK for its download URL.
//
// Google's emulator: getDownloadURL resolves to a URL containing the token.
// Firenook: getDownloadURL rejects with "storage/no-download-url".

import { initializeApp as initializeAdmin } from "firebase-admin/app";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { initializeApp as initializeClient } from "firebase/app";
import { connectStorageEmulator, getDownloadURL, getStorage, ref } from "firebase/storage";

async function logAdminMetadata(file) {
    const [metadata] = await file.getMetadata();
    console.log("admin sees metadata.metadata:", JSON.stringify(metadata.metadata));
}

const PROJECT_ID = "demo-repro";
const BUCKET = `${PROJECT_ID}.appspot.com`;
const HOST = "127.0.0.1";
const PORT = 9199;

process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= `${HOST}:${PORT}`;

const admin = initializeAdmin({ projectId: PROJECT_ID, storageBucket: BUCKET });
const client = initializeClient({ projectId: PROJECT_ID, storageBucket: BUCKET }, "client");
const storage = getStorage(client);
connectStorageEmulator(storage, HOST, PORT);

const path = "test/path";

// Admin SDK: write the object.
const file = getAdminStorage(admin).bucket().file(path);
await file.save(Buffer.from("blob"), { contentType: "text/plain" });

await logAdminMetadata(file);

// Web SDK: ask for the download URL.
try {
    const url = await getDownloadURL(ref(storage, path));
    console.log("getDownloadURL OK:", url);
    await logAdminMetadata(file);
    if (!/[?&]token=[a-f0-9]/.test(url)) {
        console.error("FAIL: the URL does not carry a token");
        process.exitCode = 1;
    }
} catch (error) {
    console.error("FAIL: getDownloadURL threw:", error.code ?? error);
    process.exitCode = 1;
}
