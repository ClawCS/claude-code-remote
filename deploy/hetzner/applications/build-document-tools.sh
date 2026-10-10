#!/bin/bash
# Pinned tool preparation only. Does not activate an application/scanner service.
# Run in a constrained systemd build unit after supplying the three official
# archives under /opt/trinkgut-document-tools/downloads. No applicant input.
set -euo pipefail
umask 022
ROOT=/opt/trinkgut-document-tools
test "$(uname -s)" = Linux
test "$(uname -m)" = x86_64
test -d "$ROOT/downloads"
test ! -L "$ROOT"
# Never combine pinned archives with leftovers from an interrupted/older build.
# Existing targets require explicit operator inspection; this script deletes none.
for target in "$ROOT/src" "$ROOT/build" "$ROOT/prefix/poppler-26.10.0" "$ROOT/prefix/qpdf-12.4.2"; do
  if test -e "$target" || test -L "$target"; then
    printf 'Refusing existing build target: %s\n' "$target" >&2
    exit 1
  fi
done
cd "$ROOT/downloads"
printf '%s\n' \
  '6792cb7c69205007ad87d2e936cecc5b3a31fac29ab54ffc3175fdb6b2a6ce35  poppler-26.10.0.tar.xz' \
  'c835b640a40ce357e1b83666aabd95edffa24ddddd49b8daff63adb851cdab74  poppler-data-0.4.12.tar.gz' \
  'db367d897829f22c4198ce1094143c9d467bd6ee7dfabc44ba6f02056b24f8b1  qpdf-12.4.2-bin-linux-x86_64.zip' | sha256sum --check --strict
mkdir -p "$ROOT/src" "$ROOT/build" "$ROOT/prefix/qpdf-12.4.2"
cd "$ROOT/src"
tar --no-same-owner --no-same-permissions -xf "$ROOT/downloads/poppler-26.10.0.tar.xz"
tar --no-same-owner --no-same-permissions -xf "$ROOT/downloads/poppler-data-0.4.12.tar.gz"
cd "$ROOT/prefix/qpdf-12.4.2"
cmake -E tar xf "$ROOT/downloads/qpdf-12.4.2-bin-linux-x86_64.zip"
QPDF_VERSION="$("$ROOT/prefix/qpdf-12.4.2/bin/qpdf" --version)"
printf '%s\n' "$QPDF_VERSION"
test "${QPDF_VERSION%%$'\n'*}" = 'qpdf version 12.4.2'
PREFIX="$ROOT/prefix/poppler-26.10.0"
make -C "$ROOT/src/poppler-data-0.4.12" install prefix="$PREFIX"
cmake -S "$ROOT/src/poppler-26.10.0" -B "$ROOT/build/poppler" \
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$PREFIX" \
  -DCMAKE_BUILD_WITH_INSTALL_RPATH=ON -DCMAKE_INSTALL_RPATH="$PREFIX/lib" \
  -DBUILD_SHARED_LIBS=ON -DENABLE_UTILS=ON -DFONT_CONFIGURATION=fontconfig \
  -DENABLE_LCMS=ON -DENABLE_LIBJPEG=ON -DENABLE_LIBOPENJPEG=ON \
  -DENABLE_BROTLI=ON -DENABLE_HARFBUZZ=ON -DWITH_PNG=ON \
  -DENABLE_CPP=OFF -DENABLE_GLIB=OFF -DENABLE_QT5=OFF -DENABLE_QT6=OFF \
  -DENABLE_GOBJECT_INTROSPECTION=OFF -DENABLE_GTK_DOC=OFF \
  -DENABLE_LIBCURL=OFF -DENABLE_NSS3=OFF -DENABLE_GPGME=OFF \
  -DENABLE_PGP_SIGNATURES=OFF -DENABLE_BOOST=OFF -DENABLE_LIBTIFF=OFF \
  -DBUILD_MANUAL_TESTS=OFF -DBUILD_GTK_TESTS=OFF -DBUILD_QT5_TESTS=OFF \
  -DBUILD_QT6_TESTS=OFF -DBUILD_CPP_TESTS=OFF -DRUN_GPERF_IF_PRESENT=OFF \
  -DWITH_Cairo=OFF -DPOPPLER_DATADIR="$PREFIX/share/poppler"
cmake --build "$ROOT/build/poppler" --target pdftoppm pdfinfo --parallel 2
cmake -DCMAKE_INSTALL_LOCAL_ONLY=TRUE -P "$ROOT/build/poppler/cmake_install.cmake"
install -d -m 0755 "$PREFIX/bin"
install -m 0755 "$ROOT/build/poppler/utils/pdftoppm" "$ROOT/build/poppler/utils/pdfinfo" "$PREFIX/bin/"
"$PREFIX/bin/pdftoppm" -v
"$PREFIX/bin/pdfinfo" -v
printf '%s\n' 'DOCUMENT_TOOL_BUILD_COMPLETE_NOT_PRODUCTION_QUALIFIED'
