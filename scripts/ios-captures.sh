#!/usr/bin/env bash
# Captures de l'application iOS dans le simulateur, en français puis en arabe (#145).
# Usage (macOS, Xcode) : scripts/ios-captures.sh <chemin/App.app> <dossier de sortie>
# Le simulateur est remis à zéro pour chaque langue : la langue du téléphone est donc celle de la
# première ouverture (détection de #112, sans choix mémorisé).
set -euo pipefail

APP="$1"
OUT="$2"
BUNDLE_ID="tn.croncare.app"
mkdir -p "$OUT"

# Premier iPhone disponible sur le runtime iOS le plus récent.
DEVICE=$(xcrun simctl list devices available -j | python3 -c '
import json, sys
devices = json.load(sys.stdin)["devices"]
runtimes = sorted((r for r in devices if "iOS" in r), reverse=True)
print(next(d["udid"] for r in runtimes for d in devices[r] if d["name"].startswith("iPhone")))
')
echo "Simulateur : $DEVICE"

for LANG_CODE in fr ar; do
  xcrun simctl shutdown "$DEVICE" 2>/dev/null || true
  xcrun simctl erase "$DEVICE"
  xcrun simctl boot "$DEVICE"
  xcrun simctl spawn "$DEVICE" defaults write -g AppleLanguages -array "$LANG_CODE"
  xcrun simctl spawn "$DEVICE" defaults write -g AppleLocale -string "${LANG_CODE}_TN"
  # Redémarrage pour appliquer la langue du système.
  xcrun simctl shutdown "$DEVICE"
  xcrun simctl boot "$DEVICE"
  xcrun simctl bootstatus "$DEVICE" -b >/dev/null
  echo "Langue du simulateur : $(xcrun simctl spawn "$DEVICE" defaults read -g AppleLanguages | tr -d '\n ')"
  xcrun simctl install "$DEVICE" "$APP"
  xcrun simctl launch "$DEVICE" "$BUNDLE_ID"
  sleep 20
  xcrun simctl io "$DEVICE" screenshot "$OUT/connexion-$LANG_CODE.png"
  xcrun simctl terminate "$DEVICE" "$BUNDLE_ID" || true
done
xcrun simctl shutdown "$DEVICE" || true
ls -l "$OUT"
