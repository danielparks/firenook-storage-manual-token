# Firenook: Cannot create downloadable storage object from Admin SDK

The Firebase web SDK’s `getDownloadURL` requires a token be written into a
storage object’s metadata in order to produce a download URL. A storage object
written with the Admin SDK with `firebaseStorageDownloadTokens` in its custom
metadata meets that criteria in Google’s emulator, but not in Firenook 0.2.2.

[repro.mjs](repro.mjs) has a full test case, but the core of it is that the code
below should produce a storage object that `getDownloadURL` will work on:

```typescript
const admin = initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET });
const file = getStorage(admin).bucket().file(PATH);
await file.save(BUFFER, {
    contentType: CONTENT_TYPE,
    metadata: { metadata: { firebaseStorageDownloadTokens: TOKEN } },
});
```

It works in Google’s emulator. In Firenook, the web SDK’s `getDownloadURL`
instead fails with `storage/no-download-url`.

```sh
npm install
npm run test:google    # passes: prints a URL containing the token
npm run test:firenook  # fails:  storage/no-download-url
```

Google’s emulator needs JDK 21+.

Trimmed output:

```
❯ npm run test:google
[ . . . ]
Admin SDK sees metadata.metadata: {"firebaseStorageDownloadTokens":"a6e90f5f-e37e-4b43-9d58-128a2ada20f5"}
getDownloadURL OK: http://127.0.0.1:9199/v0/b/demo-repro.appspot.com/o/images%2Fexample?alt=media&token=a6e90f5f-e37e-4b43-9d58-128a2ada20f5
✔  Script exited successfully (code 0)
[ . . . ]
❯ npm run test:firenook
[ . . . ]
Firenook 0.2.2; engine 070297f1c1fb75b328556c3481af26cf7b5dcacc; disk/WAL state /Users/daniel/personal/projects/firenook-storage-manual-token/.firenook/runs/session-DAzZI5/state
[ . . . ]
All emulators ready
Admin SDK sees metadata.metadata: {"firebaseStorageDownloadTokens":"5b213914-e9f8-4062-89ed-0e8df52b20e6"}
FAIL: getDownloadURL threw: storage/no-download-url
[ . . . ]
```
