#!/bin/bash
cd "$(dirname "$0")" || exit 1
printf '\nNiki’s World — Across 101\nOpen http://127.0.0.1:4173/ in your browser.\nKeep this window open while exploring. Press Control-C to stop.\n\n'
/usr/bin/python3 serve.py
