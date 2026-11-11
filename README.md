# Firenook: `getDownloadURL` ignores `firebaseStorageDownloadTokens`

An object written with the Admin SDK that has `firebaseStorageDownloadTokens` in
its custom metadata has a download token in Google's emulator and in a real
Firebase project. In Firenook, the web SDK's `getDownloadURL` instead fails with
`storage/no-download-url`.

```sh
npm install
npm run test:google    # passes: prints a URL containing the token
npm run test:firenook  # fails:  storage/no-download-url
```

`repro.mjs` is the whole case. Google's emulator needs JDK 21+.
