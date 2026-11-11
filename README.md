# Firenook: Cannot create downloadable storage object from Admin SDK

A storage object written with the Firebase Admin SDK should be downloadable with
`getDownloadURL` from the web client SDK. This works in the Google emulator, but
not in Firenook.

Setting `firebaseStorageDownloadTokens` on the object does not work either.

## Code

[repro.mjs](repro.mjs) has a full test case, but the core of it is that the code
below should produce a storage object that `getDownloadURL` will work on:

```typescript
const admin = initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET });
const file = getStorage(admin).bucket().file(PATH);
await file.save(BUFFER, { contentType: CONTENT_TYPE });
```

It works in Google’s emulator. In Firenook, the web SDK’s `getDownloadURL`
instead fails with `storage/no-download-url`.

## Runnable test case

```sh
npm install
npm run test:google    # passes: prints a URL containing a token
npm run test:firenook  # fails:  storage/no-download-url
```

Google’s emulator needs JDK 21+.

Trimmed output:

```
❯ npm run test:google
[ . . . ]
admin sees metadata.metadata: undefined
getDownloadURL OK: http://127.0.0.1:9199/v0/b/demo-repro.appspot.com/o/test%2Fpath?alt=media&token=e1a87b0e-de6a-4fad-908d-33c1c240de36
admin sees metadata.metadata: {"firebaseStorageDownloadTokens":"e1a87b0e-de6a-4fad-908d-33c1c240de36"}
✔  Script exited successfully (code 0)
[ . . . ]
❯ npm run test:firenook
[ . . . ]
Firenook 0.2.2; engine 070297f1c1fb75b328556c3481af26cf7b5dcacc; disk/WAL state /Users/daniel/personal/projects/firenook-storage-manual-token/.firenook/runs/session-DAzZI5/state
[ . . . ]
All emulators ready
admin sees metadata.metadata: undefined
FAIL: getDownloadURL threw: storage/no-download-url
[ . . . ]
```

## Manually setting the token

[experiment.mjs](experiment.mjs) shows that the token can be explicitly set with
`{ metadata: { metadata: { firebaseStorageDownloadTokens: "whatever" } } }`.

```sh
npm install
npm run experiment:google
npm run experiment:firenook
```

The Google emulator honors the passed token, but the Firenook emulator still
doesn’t produce a download URL.
