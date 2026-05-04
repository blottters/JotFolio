# Code Signing + Notarization

Unsigned installers trigger scary OS warnings and break `electron-updater`. Both platforms require per-org keys you obtain out-of-band.

---

## macOS — Apple Developer ID

### One-time setup

1. Enroll in the Apple Developer Program (~$99/year): https://developer.apple.com/programs/enroll/
2. Apple ID → create an **app-specific password** at https://appleid.apple.com/account/manage → Security → App-Specific Passwords. Label it `jotfolio-notarize`.
3. Find your **Team ID** at https://developer.apple.com/account → Membership. 10-character alphanumeric.
4. In Xcode or at developer.apple.com: create a **Developer ID Application** certificate.
   - Download the `.cer` file.
   - Double-click → imports into Keychain.
   - From Keychain Access → File → Export Items → export as `.p12` with a password. Save somewhere safe.
5. Base64-encode the `.p12` for CI:
   ```
   base64 -i jotfolio-developer-id.p12 | pbcopy
   ```

### GitHub Secrets to add

Repo → Settings → Secrets and variables → Actions:

- `MAC_CERTIFICATE` — base64 `.p12` contents
- `MAC_CERTIFICATE_PASSWORD` — `.p12` export password
- `APPLE_ID` — your Apple ID email
- `APPLE_APP_SPECIFIC_PASSWORD` — the app-specific password from step 2
- `APPLE_TEAM_ID` — the 10-char team ID

### Enable notarization in release builds

Current local builds keep `build.mac.notarize` set to `false` so package tests can run without Apple credentials. For signed CI releases, enable notarization through the release environment using Apple credentials:

- `APPLE_API_KEY`, `APPLE_API_KEY_ID`, and `APPLE_API_ISSUER`; or
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`; or
- `APPLE_KEYCHAIN` and `APPLE_KEYCHAIN_PROFILE`.

Do not commit Apple private keys or passwords to the repo.

### What happens in CI

`electron-builder` sees the Mac secrets in env → loads the cert from `CSC_LINK` base64 → code-signs the app bundle → hands it to Apple's notarization service via `@electron/notarize` → waits for the stapler to attach the notarization ticket → produces a signed+notarized `.dmg` + `.zip`.

Notarization typically takes 2–10 minutes. CI logs show the wait.

---

## Windows — Authenticode

### Options (pick one)

**Option A: Azure Trusted Signing** (recommended in 2026)

- Cheapest serious option (~$10/month)
- No physical token required
- Setup: https://learn.microsoft.com/en-us/azure/trusted-signing/quickstart
- Produces an identity validation call (15 min video with a human) → once approved, you get a signing endpoint

**Option B: EV Code Signing Certificate from a CA** (DigiCert, Sectigo, SSL.com)

- $300–$600/year
- Ships as a hardware USB token (FIPS 140-2 L2) — signing must happen on a machine with the token plugged in
- Immediately trusted by SmartScreen (no reputation warm-up) — this is the big advantage over OV
- CI must use a self-hosted runner with the token plugged in, or use a remote-signing proxy service

**Option C: OV Code Signing Certificate** (cheapest, $70–$200/year)

- Software-based `.pfx` file (no token)
- Triggers Windows SmartScreen warnings until enough users install it to build reputation (~2 weeks to 3 months)
- Simplest CI path — just a file, like the Mac cert
- Good for personal projects + pre-launch. Upgrade to EV when you're past early adopters.

### OV / PFX setup (simplest path)

1. Purchase OV cert from SSL.com or SignMyCode. You'll need business/org paperwork.
2. They send a `.pfx` file + password.
3. Base64-encode for CI:
   ```
   certutil -encode jotfolio.pfx jotfolio-b64.txt
   # then copy content between BEGIN/END markers
   ```
4. GitHub Secrets:
   - `WIN_CERTIFICATE` — base64 pfx
   - `WIN_CERTIFICATE_PASSWORD` — pfx password

### Azure Trusted Signing (recommended once approved)

Use `package.json` `build.win.signtoolOptions` or a release-only electron-builder config with:
```json
"win": {
  "target": ["nsis"],
  "signAndEditExecutable": true,
  "signtoolOptions": {
    "sign": "./tools/trusted-signing-hook.js"
  }
}
```
And ship a small Node hook that calls Azure's sign-file REST API. Instructions in Microsoft docs above.

---

## Linux

Not required. AppImage + `.deb` ship unsigned. Users verify via SHA256 checksum that GitHub Releases publishes alongside each file.

---

## Verifying a release signed

Mac: `codesign --verify --deep --strict --verbose=2 JotFolio.app`
Mac notarization: `spctl --assess -vv JotFolio.app` → expect "accepted, source=Notarized Developer ID"
Windows: right-click `.exe` → Properties → Digital Signatures tab → should list your cert with "OK"

PowerShell verification:

```powershell
Get-AuthenticodeSignature .\JotFolio-Setup-x.y.z.exe
```

Expected Windows status for a trusted release: `Valid`.

---

## First-run SmartScreen warnings

Even signed apps trigger the "unknown publisher" SmartScreen prompt until they accumulate reputation. EV certs bypass this. For OV + unsigned pre-launch builds, expect: "Microsoft Defender SmartScreen prevented an unrecognized app from starting" → user clicks "More info" → "Run anyway". Document this in your install instructions.

---

## Revocation

If the signing cert is compromised, revoke it immediately via the CA portal (Windows) or Apple Developer (Mac). Push a new release signed with the new cert. Users with older signed installers are fine — signing is verified at install time, not continuously.

---

## Cost summary

| Need | Cost/year |
|---|---|
| Apple Developer Program (Mac sign + notarize) | $99 |
| Windows OV cert (SSL.com OV, SignMyCode) | $70–200 |
| Windows EV cert (DigiCert, Sectigo) | $300–600 |
| Azure Trusted Signing (monthly billing) | ~$120 |
| Linux | $0 |
| **Min viable** | **~$170/year** (Apple + Windows OV) |
| **Recommended long-term** | **~$219/year** (Apple + Azure Trusted Signing) |

---

## Pre-launch fallback

Ship Linux AppImage first (zero signing). Launch macOS notarized build as soon as Apple enrollment clears (~24hr). Delay Windows signed build until you're past early adopters and ready for Azure Trusted Signing. Users on Windows in the meantime click-through SmartScreen or install via `choco install` (Chocolatey packages are community-signed).
