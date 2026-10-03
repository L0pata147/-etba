#!/usr/bin/env bash
# Stáhne nástroje pro sestavení APK (bez Android Studia a Gradle) a zkompiluje pomocné programy.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
TOOLS="${ANDROID_TOOLS:-$HERE/../../android-tools}"
SDK_DIR="${ANDROID_SDK_DIR:-$HERE/../../android-sdk}/platforms/android-34"
mkdir -p "$TOOLS/build" "$SDK_DIR"
M=https://repo1.maven.org/maven2
[ -f "$TOOLS/ARSCLib-1.4.0.jar" ] || curl -sSfL -o "$TOOLS/ARSCLib-1.4.0.jar" $M/io/github/reandroid/ARSCLib/1.4.0/ARSCLib-1.4.0.jar
[ -f "$TOOLS/dalvik-dx-16.0.1.jar" ] || curl -sSfL -o "$TOOLS/dalvik-dx-16.0.1.jar" $M/com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar
[ -f "$TOOLS/apksig-2.3.0.jar" ] || curl -sSfL -o "$TOOLS/apksig-2.3.0.jar" $M/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar
[ -f "$SDK_DIR/android.jar" ] || curl -sSfL -o "$SDK_DIR/android.jar" https://raw.githubusercontent.com/Sable/android-platforms/master/android-34/android.jar
javac -cp "$TOOLS/ARSCLib-1.4.0.jar" -d "$TOOLS/build" "$HERE/tools/BuildApk.java"
javac -cp "$TOOLS/apksig-2.3.0.jar" -d "$TOOLS/build" "$HERE/tools/SignApk.java"
echo "Nástroje připraveny v $TOOLS"
