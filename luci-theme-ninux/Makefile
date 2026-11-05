#
# luci-theme-ninux: tema LuCI leggero con modalità Base/Avanzato
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Ninux Theme (lightweight, Basic/Advanced mode)
LUCI_DEPENDS:=+luci-base

PKG_VERSION:=0.2.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0

LUCI_URL:=https://github.com/mikysal78/luci-theme-ninux
LUCI_MAINTAINER:=Michele Salerno (NINUX Basilicata)

define Package/luci-theme-ninux/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Ninux
	[ "$$(uci -q get luci.main.mediaurlbase)" = "/luci-static/ninux" ] && \
		uci -q set luci.main.mediaurlbase=/luci-static/bootstrap
	uci commit luci
}
endef

# Dentro il feed luci il file è ../../luci.mk; come feed separato si usa
# quello del feed luci installato.
include $(if $(wildcard ../../luci.mk),../../luci.mk,$(TOPDIR)/feeds/luci/luci.mk)

# call BuildPackage - OpenWrt buildroot signature
