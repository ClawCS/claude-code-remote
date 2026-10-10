# Pinned document tools — preparation, not activation

Prepared on `trinkgut-jammers-web-01`, Ubuntu 24.04 x86_64, 10 October 2026.
The application services, document-processing sandbox and upload remain disabled.

## Sources and installation

`build-document-tools.sh` accepts only fresh root-owned targets under
`/opt/trinkgut-document-tools`. It does not remove or reuse an interrupted build.
The SHA-256 pins are checked before extraction. Official downloads:

- [Poppler 26.10.0](https://poppler.freedesktop.org/poppler-26.10.0.tar.xz)
- [Poppler data 0.4.12](https://poppler.freedesktop.org/poppler-data-0.4.12.tar.gz)
- [QPDF 12.4.2 Linux x86_64](https://github.com/qpdf/qpdf/releases/download/v12.4.2/qpdf-12.4.2-bin-linux-x86_64.zip)

The QPDF digest was independently checked against the official release API and
SHA-256 manifest. Poppler's retained HTTPS archives match the recorded hashes;
its detached PGP signature was not independently verified.

Official Ubuntu dependencies were installed without upgrading existing packages:
`cmake build-essential pkgconf libjpeg-dev libpng-dev libfreetype-dev
libfontconfig-dev liblcms2-dev libopenjp2-7-dev libharfbuzz-dev zlib1g-dev
libssl-dev libbrotli-dev bubblewrap`. The Caddy Cloudsmith repository returned
HTTP 402 on the general index refresh; Ubuntu-only index refresh succeeded.
No signature bypass or change to the Caddy repository/package was made.

The actual transient build unit used MemoryMax=1800M, MemorySwapMax=0,
CPUQuota=150%, TasksMax=64, Nice=10, IOWeight=10, RuntimeMaxSec=1200,
LimitCORE=0, ProtectHome=yes, ProtectSystem=strict, PrivateTmp=yes,
PrivateNetwork=yes, NoNewPrivileges=yes and an empty CapabilityBoundingSet.
Only `/opt/trinkgut-document-tools` was writable; credential/private application
paths were inaccessible. The script ran as root against authenticated downloads,
not applicant input. **This build unit is not the future processing sandbox.**

Build succeeded in 2 min 38.672 s, with observed peak 852.2 MiB and no swap.
These are compilation measurements, not applicant-processing capacity figures.
Both Poppler utilities report 26.10.0 and QPDF reports 12.4.2. `ldd` resolves all
required libraries; actual library/font policy binding remains to be qualified.
Upstream CMake emitted warnings about unused OpenJPEG utilities absent from the
development package; it configured and built the selected PDF utilities successfully.

| Installed file | SHA-256 |
| --- | --- |
| `prefix/qpdf-12.4.2/bin/qpdf` | `9ac787a28597e8428289a12ba3fedafd74bdfb4b4da1be814722faf76f14f21b` |
| `prefix/poppler-26.10.0/bin/pdftoppm` | `485dd176c22305751813a953cb7068915d01edd1a2fb40db3bda3d54783e5d69` |
| `prefix/poppler-26.10.0/bin/pdfinfo` | `74b7b8d50fc3078cd88e1d8b11a0e3f0a67ea43dd525133dda010a852094a194` |
| `prefix/poppler-26.10.0/lib/libpoppler.so.165.0.0` | `775cc989afda2e16045e9827371d029687aeed0d8c7663d8ec4e2755d826ffb7` |

## Antivirus preparation

Ubuntu packages `clamav-base`, `libclamav12`, `clamav-daemon` and
`clamav-freshclam` version `1.5.4+dfsg-0ubuntu0.24.04.1` are installed.
Default daemon, socket and updater services were masked before installation and
remain inactive. In particular the package's default socket permissions and scan
limits are **not** accepted as the application configuration.

One bounded, unprivileged `freshclam` run downloaded and tested official databases
at 06:55 UTC: daily 28149, main 63, bytecode 339. Exit 0; no scanner was notified
or started. Actual engine metadata reports daily date 10 October 2026 06:24:04 UTC.
Signature freshness must be checked again at use; this is not a permanent approval.
No applicant file, EICAR fixture, mailbox, SMTP or deletion was touched.

Before use, qualify the isolated processing policy, full file/descriptor/resource
boundaries, constrained local-only scanner configuration, signature updates,
visual synthetic outputs, failure behavior and simultaneous website capacity.
Never change `productionReady` merely because these binaries now exist.
