import { randomUUID } from "node:crypto";
import { initializeApp as initializeAdmin } from "firebase-admin/app";
import { getStorage as getAdminStorage } from "firebase-admin/storage";
import { initializeApp as initializeClient } from "firebase/app";
import { connectStorageEmulator, getDownloadURL, getStorage, ref } from "firebase/storage";

const PROJECT_ID = "demo-repro",
    BUCKET = `${PROJECT_ID}.appspot.com`,
    HOST = "127.0.0.1",
    PORT = 9199;
process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= `${HOST}:${PORT}`;
const admin = initializeAdmin({ projectId: PROJECT_ID, storageBucket: BUCKET });
const client = initializeClient({ projectId: PROJECT_ID, storageBucket: BUCKET }, "client");
const storage = getStorage(client);
connectStorageEmulator(storage, HOST, PORT);

for (const withToken of [true, false]) {
    const path = `images/${withToken ? "with" : "without"}-token`;
    const token = randomUUID();
    const file = getAdminStorage(admin).bucket().file(path);
    await file.save(Buffer.from("hello bytes"), {
        contentType: "image/jpeg",
        ...(withToken && { metadata: { metadata: { firebaseStorageDownloadTokens: token } } }),
    });
    const [md] = await file.getMetadata();
    console.log(`\n== ${path}; admin sees metadata.metadata:`, JSON.stringify(md.metadata));
    let url;
    try {
        url = await getDownloadURL(ref(storage, path));
        console.log("getDownloadURL:", url, url.includes("token=") ? "(has token)" : "(NO token)");
    } catch (e) {
        console.log("getDownloadURL threw:", e.code ?? e);
    }
    const urls = {
        "returned URL": url,
        "no token": `http://${HOST}:${PORT}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`,
        "bogus token": `http://${HOST}:${PORT}/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=bogus`,
    };
    for (const [label, u] of Object.entries(urls)) {
        if (!u) continue;
        const r = await fetch(u);
        console.log(
            `  GET (${label}): ${r.status} ${JSON.stringify((await r.text()).slice(0, 60))}`,
        );
    }
}
