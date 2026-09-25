#!/bin/sh
# Genera una página completa para Vercel a partir de index.html
# (index.html se publica también como Artifact, que agrega su propio <head>).
set -e
mkdir -p dist
{
  printf '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<meta name="theme-color" content="#07060a">\n'
  printf '<style>[hidden]{display:none!important}body{margin:0}</style>\n</head>\n<body>\n'
  cat index.html
  printf '\n</body>\n</html>\n'
} > dist/index.html
