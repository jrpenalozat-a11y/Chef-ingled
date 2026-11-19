#!/usr/bin/env bash
# Compila el APK solo con las herramientas del SDK de Android (sin Gradle).
# Uso: ANDROID_HOME=/ruta/al/sdk ./build.sh [versionCode]
set -euo pipefail
cd "$(dirname "$0")"
VERSION_CODE="${1:-1}"
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
PLATFORM=$(ls -d "$ANDROID_HOME"/platforms/android-* | grep -E 'android-[0-9]+$' | sort -V | tail -1)
JAR="$PLATFORM/android.jar"
echo "build-tools: $BT"; echo "plataforma: $PLATFORM"

rm -rf build && mkdir -p build/classes
"$BT/aapt2" link -o build/base.apk --manifest AndroidManifest.xml -I "$JAR" \
  --min-sdk-version 21 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "1.$VERSION_CODE"
javac -source 8 -target 8 -Xlint:-options -classpath "$JAR" -d build/classes $(find src -name '*.java')
"$BT/d8" --lib "$JAR" --min-api 21 --output build $(find build/classes -name '*.class')
(cd build && zip -q base.apk classes.dex)
"$BT/zipalign" -f 4 build/base.apk build/aligned.apk
"$BT/apksigner" sign --ks debug.keystore --ks-pass pass:android --key-pass pass:android \
  --out build/control-kendal.apk build/aligned.apk
"$BT/apksigner" verify build/control-kendal.apk
ls -l build/control-kendal.apk
