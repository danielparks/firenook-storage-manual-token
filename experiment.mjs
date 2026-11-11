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

for (const token of ["FAKE-TOKEN", null]) {
    const path = `test/${token ? "with" : "without"}-token`;
    const file = getAdminStorage(admin).bucket().file(path);
    await file.save(Buffer.from("hello bytes"), {
        contentType: "text/plain",
        ...(token && { metadata: { metadata: { firebaseStorageDownloadTokens: token } } }),
    });
    console.log(`\n== ${path}`);
    await logAdminMetadata(file);
    let url;
    try {
        url = await getDownloadURL(ref(storage, path));
        console.log("getDownloadURL:", url, url.includes("token=") ? "(has token)" : "(NO token)");
    } catch (e) {
        console.log("getDownloadURL threw:", e.code ?? e);
    }
    await logAdminMetadata(file);
    const urls = {
        "getDownloadURL": url,
        "constructed with no token": `http://${HOST}:${PORT}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`,
        "constructed with bogus token": `http://${HOST}:${PORT}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=bogus`,
    };
    for (const [label, u] of Object.entries(urls)) {
        const r = u && await fetch(u);
        const status = u
          ? `GET ${r.status} ${JSON.stringify((await r.text()).slice(0, 60))}`
          : "no url";
        console.log(`  ${label}: ${status}`);
    }
}
