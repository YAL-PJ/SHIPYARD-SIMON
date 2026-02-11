# Notification setup (manual install)

This project now expects `expo-notifications` for true OS-level local reminder delivery.

## Install

```bash
npx expo install expo-notifications
```

If you use iOS native builds, run:

```bash
npx pod-install
```

## Rebuild

Because notifications are a native module, rebuild your dev client/app after install:

```bash
npx expo run:ios
# or
npx expo run:android
```

## Notes

- Without `expo-notifications`, reminders fall back to in-app scheduling behavior.
- With `expo-notifications` installed, reminders are scheduled as OS notifications with deep-link payload data.
