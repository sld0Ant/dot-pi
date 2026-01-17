#!/bin/bash
cd "$(dirname "$0")"

for cast in recordings/*.cast; do
  [ -f "$cast" ] || continue
  name=$(basename "$cast" .cast)
  echo -n "Uploading $name... "
  asciinema upload "$cast"
done
