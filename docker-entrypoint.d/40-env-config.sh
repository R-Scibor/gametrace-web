#!/bin/sh
set -eu

TMP_FILE="$(mktemp /tmp/env-config.js.XXXXXX)"
trap 'rm -f "$TMP_FILE"' EXIT

awk '
function json_escape(str,    out, i, ch) {
  out = ""
  for (i = 1; i <= length(str); i++) {
    ch = substr(str, i, 1)
    if (ch == "\\") out = out "\\\\"
    else if (ch == "\"") out = out "\\\""
    else if (ch == "\b") out = out "\\b"
    else if (ch == "\f") out = out "\\f"
    else if (ch == "\n") out = out "\\n"
    else if (ch == "\r") out = out "\\r"
    else if (ch == "\t") out = out "\\t"
    else if (ch >= " ") out = out ch
  }
  return out
}
BEGIN {
  keys[1] = "VITE_DISCORD_CLIENT_ID"
  keys[2] = "VITE_DISCORD_SERVER_INVITE_URL"
  keys[3] = "VITE_DISCORD_BOT_INVITE_URL"
  printf "window.__RUNTIME_CONFIG__ = {"
  first = 1
  for (idx = 1; idx <= 3; idx++) {
    k = keys[idx]
    if (k in ENVIRON) {
      if (!first) printf ","
      printf "\n  \"%s\": \"%s\"", k, json_escape(ENVIRON[k])
      first = 0
    }
  }
  if (!first) printf "\n"
  print "};"
}
' > "$TMP_FILE"

chmod 0644 "$TMP_FILE"
mv -f "$TMP_FILE" /tmp/env-config.js
trap - EXIT
