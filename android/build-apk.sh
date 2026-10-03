#!/usr/bin/env bash
# Sestaví APK bez Gradle/AGP: javac -> dx -> ARSCLib (zdroje + manifest) -> apksig (podpis).
# Potřebuje: JDK 17+, android.jar (API 34) a nástroje z Maven Central (viz README).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SDK_JAR="${ANDROID_JAR:-$HERE/../../android-sdk/platforms/android-34/android.jar}"
TOOLS="${ANDROID_TOOLS:-$HERE/../../android-tools}"
OUT="$HERE/build-apk"
SRC="$HERE/app/src/main"
VERSION_NAME="${VERSION_NAME:-1.0}"

rm -rf "$OUT" && mkdir -p "$OUT/classes" "$OUT/stage/resources/package_1" "$OUT/stage/root/assets" "$OUT/stage/dex"

echo "› Kompilace Javy"
javac -source 8 -target 8 -nowarn -encoding UTF-8 -bootclasspath "$SDK_JAR" -classpath "$SDK_JAR" \
  -d "$OUT/classes" $(find "$SRC/java" -name '*.java') 2>&1 | grep -v JAVA_TOOL_OPTIONS || true

echo "› Převod na DEX"
java -cp "$TOOLS/dalvik-dx-16.0.1.jar" com.android.dx.command.Main --dex --min-sdk-version=26 \
  --output="$OUT/stage/dex/classes.dex" "$OUT/classes" 2>&1 | grep -v JAVA_TOOL_OPTIONS || true

echo "› Zdroje a manifest"
cp "$SRC/AndroidManifest.xml" "$OUT/stage/AndroidManifest.xml"
cp -r "$SRC/res" "$OUT/stage/resources/package_1/res"
# public.xml – pevná ID zdrojů (vyžaduje ARSCLib)
python3 - "$OUT/stage/resources/package_1/res" <<'PY'
import os, re, sys, xml.etree.ElementTree as ET
res = sys.argv[1]
types = {}
for d in sorted(os.listdir(res)):
    base = d.split('-')[0]
    path = os.path.join(res, d)
    if base == 'values':
        for f in sorted(os.listdir(path)):
            for el in ET.parse(os.path.join(path, f)).getroot():
                t = 'style' if el.tag == 'style' else el.tag
                types.setdefault(t, set()).add(el.get('name'))
    else:
        for f in os.listdir(path):
            types.setdefault(base, set()).add(os.path.splitext(f)[0])
lines = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>']
for ti, t in enumerate(sorted(types), start=1):
    for ei, n in enumerate(sorted(types[t])):
        lines.append(f'  <public type="{t}" name="{n}" id="0x7f{ti:02x}{ei:04x}" />')
lines.append('</resources>')
open(os.path.join(res, 'values', 'public.xml'), 'w').write('\n'.join(lines) + '\n')
PY
printf '{"package_id":127,"package_name":"cz.maturita.trener"}\n' > "$OUT/stage/resources/package_1/package.json"
cp "$SRC/assets/index.html" "$OUT/stage/root/assets/index.html"

java -cp "$TOOLS/ARSCLib-1.4.0.jar:$TOOLS/build" BuildApk "$OUT/stage" "$OUT/unsigned.apk" 2>&1 | grep -v JAVA_TOOL_OPTIONS

echo "› Podpis"
java --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-exports java.base/sun.security.pkcs=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED -cp "$TOOLS/apksig-2.3.0.jar:$TOOLS/build" SignApk "$OUT/unsigned.apk" "$OUT/maturitni-trener.apk" \
  "$HERE/keystore/maturitni-trener.jks" maturitni-trener maturita2027 2>&1 | grep -v JAVA_TOOL_OPTIONS
ls -la "$OUT/maturitni-trener.apk"
