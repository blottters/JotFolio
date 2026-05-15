# Lane 5 Settings, Recovery, Plugins, AI Audit

Date: 2026-05-14

Scope: Settings, Vault & Recovery, Trash, Import/Export, Extensions, Privacy, and the AI Assistant route.

## Findings Fixed

- AI Assistant route no longer renders global search as a stand-in. It now shows an honest source-grounded status page and routes "Open AI Keys" to Settings > AI Keys.
- Vault zip export now skips folder records returned by vault adapters and reads only file records.
- Extension enable toggles now have explicit accessible names and still require inline review before enabling plugins with write or network permissions.
- Privacy crash-report toggle now has an explicit accessible action name.

## Verified

- Added targeted tests for AI route routing, Settings initial tab routing, vault export folder filtering, plugin enable confirmation, and Privacy toggle naming.
- Existing Settings Trash inline-confirmation coverage remains in place for restore, permanent delete, and empty trash.

## Flagged For Follow-Up

- Ollama is described as local/optional-key in AI Keys, but the shared AI call gate still requires a key. Treat this as an auth-policy decision before changing behavior.
- JSON/Markdown export is entry-only by design. Full backup remains the Vault & Recovery zip export.
