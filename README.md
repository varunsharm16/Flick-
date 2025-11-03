# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Pose estimation test screen

The project now ships with an Expo-compatible **TestPose** screen (`app/TestPose.tsx`) that mirrors the usage of the [`quickpose-react-native-pose-estimation`](https://github.com/quickpose/quickpose-react-native-pose-estimation) SDK. The screen renders a full-screen camera preview, overlays pose landmarks, and logs each frame to the console.

Because the upstream SDK is distributed as a native module, running it inside Expo Go requires a JS shim. The default implementation in `lib/pose/quickpose-expo.ts` provides a deterministic mock so that routing, overlay, and logging can be verified without the native binary. To ship the real model in an EAS build:

1. Add the QuickPose native module to your project (either by vendoring the GitHub repository or consuming the private npm package).
2. Replace the shim inside `lib/pose/quickpose-expo.ts` with direct calls to the native bridge exposed by the SDK (for example, re-exporting the native camera view and estimate helpers).
3. Run `npx expo prebuild` and configure the iOS/Android projects following the QuickPose README (camera permissions, ML models, etc.).
4. Build the app with `eas build` to produce an iOS binary containing the native module.

During development the mock landmarks are still rendered so that UI iterations can continue while the native integration is being finalised.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
