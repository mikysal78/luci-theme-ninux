#
# luci-theme-ninux: tema LuCI leggero con modalità Base/Avanzato
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Ninux Theme (lightweight, Basic/Advanced mode)
# Tutto quello che porta luci-light tranne luci-theme-bootstrap: con questo
# tema si può avere LuCI completa anche senza Bootstrap (router con poca flash).
LUCI_DEPENDS:= \
	+luci-base \
	+luci-mod-admin-full \
	+IPV6:luci-proto-ipv6 \
	+luci-app-firewall \
	+luci-proto-ppp \
	+rpcd-mod-rrdns \
	+uhttpd \
	+uhttpd-mod-ubus

PKG_VERSION:=0.3.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0

LUCI_URL:=https://github.com/mikysal78/luci-theme-ninux
LUCI_MAINTAINER:=Michele Salerno (NINUX Basilicata)

define Package/luci-theme-ninux/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Ninux
	# torna al primo tema rimasto (Bootstrap, se c'è ancora)
	if [ "$$(uci -q get luci.main.mediaurlbase)" = "/luci-static/ninux" ]; then
		next=$$(uci -q show luci.themes | sed -n "s/^luci\.themes\.[^=]*='\(.*\)'$$/\1/p" | head -n 1)
		uci -q set luci.main.mediaurlbase="$${next:-/luci-static/bootstrap}"
	fi
	uci commit luci
}
endef

# Dentro il feed luci il file è ../../luci.mk; come feed separato si usa
# quello del feed luci installato.
include $(if $(wildcard ../../luci.mk),../../luci.mk,$(TOPDIR)/feeds/luci/luci.mk)

# call BuildPackage - OpenWrt buildroot signature
