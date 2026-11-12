import { initializeApp as initializeAdmin } from "firebase-admin/app";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { initializeApp as initializeClient } from "firebase/app";
import { connectStorageEmulator, getDownloadURL, getStorage, ref } from "firebase/storage";

async function adminMetadata(file) {
    const [metadata] = await file.getMetadata();
    console.log("admin sees metadata.metadata:", JSON.stringify(metadata.metadata));
    return metadata.metadata;
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

const REFERENCE_TEXT = "hello bytes";
console.log();

for (const token of ["FAKE-TOKEN", null]) {
    const path = `test/${token ? "with" : "without"}-token`;
    const file = getAdminStorage(admin).bucket().file(path);
    await file.save(Buffer.from(REFERENCE_TEXT), {
        contentType: "text/plain",
        ...(token && { metadata: { metadata: { firebaseStorageDownloadTokens: token } } }),
    });
    console.log(`== ${path}`);
    const before = await adminMetadata(file);
    let url;
    try {
        url = await getDownloadURL(ref(storage, path));
        console.log("getDownloadURL:", url);
    } catch (e) {
        console.log("getDownloadURL threw:", e.code ?? e);
    }
    const after = await adminMetadata(file);

    const response = url && (await fetch(url));
    if (url) {
        const text = await response?.text();
        if (response.status === 200 && text === REFERENCE_TEXT) {
            console.log("GET download matches");
        } else {
            console.log(`ERROR: GET download does NOT match:`, text);
        }
    } else {
        console.log("ERROR: no download URL");
    }

    console.log();
    if (token) {
        console.log(
            `${path} token matches before?`,
            before?.firebaseStorageDownloadTokens === token,
        );
        console.log(`${path} token matches after?`, after?.firebaseStorageDownloadTokens === token);
    } else {
        console.log(
            `${path} token empty before?`,
            before?.firebaseStorageDownloadTokens === undefined,
        );
        console.log(`${path} token after?`, after?.firebaseStorageDownloadTokens);
    }
    console.log();
}
