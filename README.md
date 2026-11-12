# Firenook: Storage object does not use download tag assigned with Admin SDK

> [!NOTE]
> Previously this repo was for [Firenook #174 — Cannot create downloadable
> storage object from Admin SDK][firenook-174] (see [old version of this repo
> ][tag-for-firenook-174]).

When creating a storage object with the Firebase Admin SDK it is possible to
explicitly set the download token in the objects metadata. The Google emulator
uses the token from the metadata, but Firenook ignores it and creates its own.

## Code

[experiment.mjs](experiment.mjs) has a full test case, but here’s the gist:

```javascript
const admin = initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET });
const file = getStorage(admin).bucket().file(PATH);
await file.save(BUFFER, {
    contentType: CONTENT_TYPE,
    metadata: { metadata: { firebaseStorageDownloadTokens: TOKEN } },
});

console.log(
    "before. tokens match?",
    file.getMetadata().metadata.firebaseStorageDownloadTokens === TOKEN,
);
const client = initializeApp({ projectId: PROJECT_ID, storageBucket: BUCKET }, "client");
const _url = await getDownloadURL(ref(getStorage(client), PATH));
console.log(
    "after. tokens match?",
    file.getMetadata().metadata.firebaseStorageDownloadTokens === TOKEN,
);
```

In the Google emulator the token will match before and after `getDownloadURL`.

In the Firenook the token will match before `getDownloadURL`, but afterward it
will be a new, generated token.

## Runnable test case

```sh
npm install
npm run test:google
npm run test:firenook
```

Google’s emulator needs JDK 21+.

This also checks what happend if the token is not set. Trimmed output:

```
❯ npm run test:google
[ . . . ]

test/with-token token matches before? true
test/with-token token matches after? true

[ . . . ]

test/without-token token empty before? true
test/without-token token after? 500bb45e-63b0-4788-99a4-d0cccaea0b67

[ . . . ]
❯ npm run test:firenook
[ . . . ]
Firenook 0.2.3; engine 2294132253f03395b0d9bafe391d35075e928112; disk/WAL state /Users/daniel/personal/projects/firenook-storage-manual-token/.firenook/runs/session-CtPSzG/state
[ . . . ]

test/with-token token matches before? true
test/with-token token matches after? false

[ . . . ]

test/without-token token empty before? true
test/without-token token after? ae0cfa01-0e09-428b-ad6d-2f7c2c49999c

[ . . . ]
```

[firenook-174]: https://github.com/firenook-dev/firenook/issues/174
[tag-for-firenook-174]: https://github.com/danielparks/firenook-storage-manual-token/tree/firenook-174
