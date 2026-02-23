# Run BetterBlood on Android Virtual Device (AVD)

This guide walks you through running the BetterBlood mobile app on a virtual Android device using Android Studio's emulator.

## Prerequisites

1. **Android Studio** installed
2. **Node.js 20+** installed
3. **Docker Desktop** installed and running

## Step 1: Start Backend Services

```bash
# Navigate to project
cd /path/to/betterblood

# Start all infrastructure (PostgreSQL, Redis, Kong)
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Verify services
 docker-compose ps
```

## Step 2: Run Database Migrations

```bash
# Install dependencies at root
npm install

# Run migrations
npm run db:migrate

# Seed test data (optional)
npm run db:seed
```

## Step 3: Start Backend Services

Open 3 separate terminal windows:

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm install
npm run dev
```

**Terminal 2 - CGM Service:**
```bash
cd services/cgm-service
npm install
npm run dev
```

**Terminal 3 - Food Service:**
```bash
cd services/food-service
npm install
npm run dev
```

**Verify services are running:**
```bash
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # CGM Service
curl http://localhost:3003/health  # Food Service
```

## Step 4: Setup Android Virtual Device

### Option A: Using Android Studio GUI

1. Open **Android Studio**
2. Click **More Actions** → **Virtual Device Manager**
3. Click **Create Device**
4. Select a phone (e.g., **Pixel 7**)
5. Select system image (recommend **Android 14.0 API 34**)
6. Click **Download** if needed, then **Next**
7. Configure:
   - **AVD Name**: BetterBlood-Test
   - **Graphics**: Hardware
   - **RAM**: 2048 MB (or more)
8. Click **Finish**
9. Click **Launch** (play button) to start the emulator

### Option B: Using Command Line

```bash
# List available system images
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --list | grep system-images

# Create AVD (example)
$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd \
  -n BetterBlood-Test \
  -k "system-images;android-34;google_apis;x86_64" \
  -d "pixel_7"

# Start emulator
$ANDROID_HOME/emulator/emulator -avd BetterBlood-Test -gpu host
```

## Step 5: Configure Mobile App

```bash
cd apps/mobile

# Install dependencies
npm install

# For Android - set Metro bundler to use correct IP
echo '192.168.1.100' > .metro-host  # Use your machine's actual IP
```

## Step 6: Run on Virtual Device

### Metro Bundler Setup

**Terminal 1 - Start Metro:**
```bash
cd apps/mobile
npx react-native start
```

**Terminal 2 - Install and Launch:**
```bash
cd apps/mobile

# Make sure emulator is running
adb devices
# Should show: emulator-5554   device

# Run on Android
npx react-native run-android
```

### Alternative: Using Android Studio

1. Open `apps/mobile/android` folder in Android Studio
2. Wait for Gradle sync to complete
3. Select your AVD from the device dropdown
4. Click **Run** (green play button)

## Step 7: Verify App is Working

1. **App loads** - You should see the BetterBlood login screen
2. **Test registration** - Create a new account
3. **Test login** - Sign in with created account
4. **Dashboard** - You should see glucose dashboard

### Simulate CGM Data

Since no physical CGM is connected, use the simulation endpoint:

```bash
curl -X POST http://localhost:8000/api/v1/cgm/simulate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"glucoseValue": 120}'
```

Or use the app's Dashboard → Quick Actions → Simulate (if implemented in UI).

## Troubleshooting

### Metro Bundler Connection Issues

**Error: "Unable to connect to Metro"**

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Or manually
cd apps/mobile
rm -rf node_modules
rm -rf android/app/build
npm install
npx react-native run-android
```

### ADB Device Not Found

```bash
# List devices
adb devices

# If none, restart ADB
adb kill-server
adb start-server

# Check emulator is running
$ANDROID_HOME/emulator/emulator -list-avds
```

### Backend Not Connecting

```bash
# Check backend is accessible from emulator
adb shell
ping 10.0.2.2  # This is host machine from emulator

# Test API endpoint
curl http://10.0.2.2:8000/health
```

**Note**: Android emulator uses `10.0.2.2` to access host machine.

### API URL Configuration

Update `apps/mobile/src/services/api.ts` to use correct IP:

```typescript
// For physical device - use your computer's IP
const API_BASE_URL = 'http://192.168.1.100:8000';

// For Android emulator - use 10.0.2.2
const API_BASE_URL = 'http://10.0.2.2:8000';

// For iOS simulator - use localhost
const API_BASE_URL = 'http://localhost:8000';
```

### Port Conflicts

```bash
# Find and kill process using port 8081 (Metro)
lsof -ti:8081 | xargs kill -9

# For Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

## Using Expo Go (Alternative)

If you prefer not to use Android Studio:

```bash
cd apps/mobile

# Install Expo CLI
npm install -g @expo/cli

# Start Expo
npx expo start

# Scan QR code with Expo Go app on physical device
# Or press 'a' to launch on Android emulator
```

## Performance Tips for Virtual Device

1. **Enable Hardware Acceleration**:
   - Windows: Enable Intel HAXM or AMD Hypervisor
   - macOS: HVF is enabled by default
   - Linux: Enable KVM

2. **Allocate sufficient RAM**:
   - AVD: 2048-4096 MB
   - Host machine: At least 8GB total

3. **Use x86_64 system image** for better performance

4. **Disable unnecessary animations**:
   ```bash
   adb shell settings put global window_animation_scale 0.0
   adb shell settings put global transition_animation_scale 0.0
   adb shell settings put global animator_duration_scale 0.0
   ```

## Quick Reference Commands

```bash
# Start everything (after initial setup)
docker-compose up -d                    # Backend infrastructure
cd services/auth-service && npm run dev &
cd services/cgm-service && npm run dev &  
cd services/food-service && npm run dev &
cd apps/mobile && npx react-native run-android

# Stop everything
docker-compose down
pkill -f "node.*dev"
adb emu kill  # Stop emulator
```

## Next Steps

Once running on virtual device:
1. Create account via mobile app
2. Log in and explore dashboard
3. Log food items
4. View glucose history
5. Test all features

For physical device testing, see [PHYSICAL_DEVICE_SETUP.md](./PHYSICAL_DEVICE_SETUP.md)