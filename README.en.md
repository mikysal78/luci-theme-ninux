# luci-theme-ninux

[🇮🇹 Italiano](README.md) · 🇬🇧 English

A lightweight, simpler LuCI theme (OpenWrt 24.10 / 25.12) with a top menu bar
(like Bootstrap) and a **Basic / Advanced** switch in the header:

- **Basic**: a short menu with just the pages a regular user needs (overview,
  Wi-Fi, interfaces, password, backup/firmware, reboot), quick-link tiles on the
  overview and pages trimmed of expert options (overview with just hostname, model, firmware version and uptime in *System*,
  and used percentage and total size for RAM and disk;
  interfaces without the *Devices* tab, add/delete buttons and global options
  except the ULA prefix; interface dialog with *General* and *DHCP* only; Wi-Fi without *Scan*, *Add*,
  *Remove* and with just *General* and *Wireless Security* in the dialog);
- **Advanced**: the full LuCI menu with dropdown categories.

Below 860 px the menu becomes a slide-in panel.

![Basic mode](docs/base.png)

Basic mode is a UI simplification, **not access control**: advanced pages stay
reachable by URL; real permissions are LuCI's users and rpcd ACLs.

## Configuration (`/etc/config/luci`, section `ninux`)

| Option | Default | Meaning |
|---|---|---|
| `default_mode` | `basic` | initial mode, `basic` or `advanced` |
| `allow_advanced` | `1` | `0` hides the switch, Basic menu only |
| `basic` (list) | overview, wireless, network, password tab, flash, reboot, logout | Basic menu pages (a page path or a single tab) |
| `logo` | `/luci-static/ninux/logo.svg` | logo URL as seen by the browser (router path, `https://…`, `data:` URI) |
| `brand` | `ninux` | logo alt text |
| `accent` / `accent_dark` | Ninux orange | accent colour (`#rgb`/`#rrggbb`) for light/dark scheme |

With OpenWISP, use the `luci-theme-ninux.json` template in the `openwisp2`
repository (variables `luci_logo`, `luci_brand`, `luci_accent`,
`luci_accent_dark`, `luci_mode`).

## Build

Add `src-git ninux_theme https://github.com/mikysal78/luci-theme-ninux.git` to
`feeds.conf`, then `./scripts/feeds update ninux_theme && ./scripts/feeds
install luci-theme-ninux` and select *LuCI → Themes → luci-theme-ninux*.

License: Apache-2.0. Parts derived from luci-theme-bootstrap (The LuCI Team).
The Ninux logo belongs to the Ninux community.
