'use strict';
'require baseclass';
'require ui';

/*
 * luci-theme-ninux: menu in alto (a scomparsa su mobile) con due modalità.
 *
 *  - basic:    solo le pagine elencate in luci.ninux.basic (o DEFAULT_BASIC),
 *              con le schede filtrate, dei riquadri rapidi nella panoramica e
 *              alcune parti delle pagine nascoste (vedi BASIC_STATUS qui
 *              sotto e "Semplificazioni della modalità Base" nel CSS);
 *  - advanced: il menu completo di LuCI.
 *
 * La modalità è solo una comodità di presentazione: le pagine avanzate restano
 * raggiungibili via URL e i permessi veri restano quelli di LuCI (ACL/rpcd).
 */

const DEFAULT_BASIC = [
	'admin/status/overview',
	'admin/network/wireless',
	'admin/network/network',
	'admin/system/admin/password',
	'admin/system/flash',
	'admin/system/reboot',
	'admin/logout'
];

/* Sezioni della panoramica in modalità base: titolo della sezione -> righe da
 * tenere (le altre si nascondono; una lista vuota nasconde tutta la sezione).
 * Titoli ed etichette sono in inglese, come nel sorgente di LuCI: il confronto
 * si fa con il testo tradotto. Nelle righe tenute la barra mostra solo
 * percentuale e dimensione massima ("88% di 30.55 GiB"). */
const BASIC_STATUS = {
	'System': [ 'Hostname', 'Model', 'Firmware Version', 'Uptime' ],
	'Memory': [ 'Used' ],
	'Storage': [ 'Disk space' ]
};

/* Pulsanti nascosti in modalità base, per pagina e testo (in inglese, come
 * sopra): servono quando la classe CSS non basta a distinguerli. */
const BASIC_HIDE_BUTTONS = {
	'admin/network/wireless': [ 'Scan' ]
};

const ICONS = {
	overview: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5',
	wireless: 'M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.8 16a4.8 4.8 0 0 1 6.4 0M12 19.5h.01',
	network: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3.5 12h17M12 3c-3.2 3.5-3.2 14.5 0 18M12 3c3.2 3.5 3.2 14.5 0 18',
	password: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2',
	admin: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2',
	flash: 'M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14',
	reboot: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4.5H15',
	logout: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
	_: 'M5 5h14v14H5zM9 12h6'
};

function icon(path) {
	const key = path.split('/').filter(p => ICONS[p]).pop() || '_';
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');

	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('class', 'icon');
	p.setAttribute('d', ICONS[key]);
	svg.appendChild(p);

	return svg;
}

function cfg() {
	return window.ninux || { default_mode: 'basic', allow_advanced: true, basic: null, mode: 'basic' };
}

function currentPath() {
	return L.env.dispatchpath.join('/');
}

function isCurrent(path) {
	const cur = currentPath();
	return cur === path || cur.indexOf(path + '/') === 0;
}

return baseclass.extend({
	__init__() {
		document.documentElement.setAttribute('data-path', L.env.dispatchpath.join('-'));

		this.bindNavToggle();
		this.bindDropdowns();
		this.watchContent();

		ui.menu.load().then((tree) => this.render(tree)).catch(() => {});
	},

	/* --- struttura ------------------------------------------------------ */

	lookup(path) {
		let node = this.tree;

		for (const name of path.split('/')) {
			node = (node && L.isObject(node.children)) ? node.children[name] : null;

			if (!node || !node.satisfied)
				return null;
		}

		return node.title ? node : null;
	},

	resolveBasic() {
		const list = cfg().basic || DEFAULT_BASIC;

		return list.map(path => {
			path = String(path).replace(/^\/+|\/+$/g, '');
			const node = this.lookup(path);
			return node ? { path: path, title: node.title } : null;
		}).filter(Boolean);
	},

	findRoot() {
		const children = ui.menu.getChildren(this.tree);
		let root = null;

		children.forEach((child, i) => {
			if (L.env.requestpath.length ? child.name === L.env.requestpath[0] : i === 0)
				root = child;
		});

		return root || children[0] || null;
	},

	render(tree) {
		this.tree = tree;
		this.root = this.findRoot();

		if (!this.root)
			return;

		this.basic = this.resolveBasic();
		this.renderSwitch();
		this.renderAll();
	},

	renderAll() {
		const mode = cfg().mode;

		document.querySelectorAll('.ninux-notice, .ninux-tiles').forEach(el => el.remove());

		if (mode === 'basic')
			this.renderBasicMenu();
		else
			this.renderFullMenu();

		this.renderTabs(mode);

		if (mode === 'basic') {
			this.renderNotice();
			this.renderTiles();
		}
	},

	setMode(mode) {
		const c = cfg();

		if (!c.allow_advanced)
			mode = 'basic';

		c.mode = mode;
		document.documentElement.setAttribute('data-mode', mode);

		try { localStorage.setItem('ninux-mode', mode); } catch (e) {}

		this.renderSwitch();
		this.renderAll();

		if (mode === 'basic')
			this.simplifyPage();
	},

	/* --- interruttore Base / Avanzato ----------------------------------- */

	renderSwitch() {
		const box = document.querySelector('#modeswitch');
		const c = cfg();

		if (!box || !c.allow_advanced)
			return;

		const button = (mode, label) => E('button', {
			'type': 'button',
			'data-mode': mode,
			'aria-pressed': String(c.mode === mode),
			'click': () => this.setMode(mode)
		}, [ label ]);

		box.replaceChildren(E('div', {
			'class': 'segmented',
			'role': 'group',
			'aria-label': _('Interface mode')
		}, [
			button('basic', _('Basic')),
			button('advanced', _('Advanced'))
		]));
	},

	/* --- menu ----------------------------------------------------------- */

	renderBasicMenu() {
		const ul = document.querySelector('#mainmenu');

		ul.replaceChildren();
		ul.className = 'basic';

		this.basic.forEach(item => {
			ul.appendChild(E('li', { 'class': isCurrent(item.path) ? 'active' : '' }, [
				E('a', { 'href': L.url(item.path) }, [ icon(item.path), E('span', [ _(item.title) ]) ])
			]));
		});
	},

	renderFullMenu() {
		const ul = document.querySelector('#mainmenu');
		const root = this.root;
		const dp = L.env.dispatchpath;

		ul.replaceChildren();
		ul.className = 'full';

		ui.menu.getChildren(root).forEach(cat => {
			const pages = ui.menu.getChildren(cat);
			const catActive = (dp[0] === root.name && dp[1] === cat.name);

			if (!pages.length) {
				ul.appendChild(E('li', { 'class': 'single' + (catActive ? ' active' : '') }, [
					E('a', { 'href': L.url(root.name, cat.name) }, [ icon(cat.name), E('span', [ _(cat.title) ]) ])
				]));
				return;
			}

			ul.appendChild(E('li', { 'class': 'group' + (catActive ? ' active' : '') }, [
				E('button', { 'type': 'button', 'aria-expanded': 'false' }, [ E('span', [ _(cat.title) ]) ]),
				E('ul', { 'class': 'dropdown' }, pages.map(page => E('li', {
					'class': (catActive && dp[2] === page.name) ? 'active' : ''
				}, [
					E('a', { 'href': L.url(root.name, cat.name, page.name) }, [ _(page.title) ])
				])))
			]));
		});
	},

	/* Tendine del menu avanzato: si aprono al clic (e al passaggio del mouse,
	 * via CSS), se ne apre una alla volta, Esc o un clic fuori le chiudono. */
	setGroup(li, open) {
		document.querySelectorAll('#mainmenu li.group.open').forEach(other => {
			if (other !== li) {
				other.classList.remove('open');
				other.firstElementChild.setAttribute('aria-expanded', 'false');
			}
		});

		if (li) {
			li.classList.toggle('open', open);
			li.firstElementChild.setAttribute('aria-expanded', String(open));
		}
	},

	bindDropdowns() {
		const menu = document.querySelector('#mainmenu');

		if (!menu)
			return;

		menu.addEventListener('click', (ev) => {
			const btn = ev.target.closest('li.group > button');

			if (btn)
				this.setGroup(btn.parentNode, !btn.parentNode.classList.contains('open'));
		});

		menu.addEventListener('mouseleave', (ev) => {
			if (!document.body.classList.contains('nav-open'))
				this.setGroup(null);
		});

		document.addEventListener('click', (ev) => {
			if (!ev.target.closest('#mainmenu, #nav-toggle'))
				this.setGroup(null);
		});
	},

	/* --- schede della pagina -------------------------------------------- */

	renderTabs(mode) {
		const container = document.querySelector('#tabmenu');
		const dp = L.env.dispatchpath;
		let node = this.tree;
		let url = '';

		container.replaceChildren();
		container.style.display = 'none';

		if (dp.length < 3)
			return;

		for (let i = 0; i < 3 && node; i++) {
			node = L.isObject(node.children) ? node.children[dp[i]] : null;
			url += (url ? '/' : '') + dp[i];
		}

		if (node)
			this.renderTabLevel(container, node, url, 0, mode);
	},

	renderTabLevel(container, tree, url, level, mode) {
		let children = ui.menu.getChildren(tree);

		/* In modalità base: se la lista cita delle schede di questa pagina,
		 * mostra solo quelle; una scheda sola non serve. */
		if (mode === 'basic' && level === 0) {
			const allowed = this.basic
				.map(b => b.path)
				.filter(p => p.indexOf(url + '/') === 0)
				.map(p => p.substring(url.length + 1).split('/')[0]);

			if (allowed.length)
				children = children.filter(c => allowed.indexOf(c.name) !== -1);

			if (children.length < 2)
				return;
		}

		if (!children.length)
			return;

		const ul = E('ul', { 'class': 'tabs' });
		let activeNode = null;

		children.forEach(child => {
			const active = (L.env.dispatchpath[3 + level] === child.name);

			ul.appendChild(E('li', { 'class': 'tabmenu-item-%s%s'.format(child.name, active ? ' active' : '') }, [
				E('a', { 'href': L.url(url, child.name) }, [ _(child.title) ])
			]));

			if (active)
				activeNode = child;
		});

		container.appendChild(ul);
		container.style.display = '';

		if (activeNode)
			this.renderTabLevel(container, activeNode, url + '/' + activeNode.name, level + 1, mode);
	},

	/* --- extra della modalità base -------------------------------------- */

	renderNotice() {
		const cur = currentPath();

		if (L.env.dispatchpath.length < 3 || !cfg().allow_advanced)
			return;

		const covered = this.basic.some(b => isCurrent(b.path) || b.path.indexOf(cur + '/') === 0);

		if (covered)
			return;

		const notice = E('div', { 'class': 'alert-message notice ninux-notice' }, [
			E('span', [ _('This page is part of the advanced settings.') ]),
			E('button', {
				'type': 'button',
				'class': 'btn cbi-button',
				'click': () => this.setMode('advanced')
			}, [ _('Show advanced menu') ])
		]);

		document.querySelector('#tabmenu').before(notice);
	},

	renderTiles() {
		const first = this.basic[0];

		if (!first || currentPath() !== first.path)
			return;

		const tiles = this.basic.filter(b => b !== first && !/\/logout$/.test(b.path));

		if (!tiles.length)
			return;

		document.querySelector('#tabmenu').after(E('nav', {
			'class': 'ninux-tiles',
			'aria-label': _('Quick links')
		}, tiles.map(b => E('a', { 'href': L.url(b.path) }, [ icon(b.path), E('span', [ _(b.title) ]) ]))));
	},

	/* --- pagine semplificate in modalità base --------------------------- */

	/* Le pagine si ridisegnano da sole (polling, schede, finestre modali): si
	 * ricontrolla a ogni modifica, il lavoro è poco. */
	watchContent() {
		if (!document.querySelector('#maincontent'))
			return;

		this.statusRules = {};

		for (const title in BASIC_STATUS)
			this.statusRules[_(title)] = BASIC_STATUS[title].map(label => _(label));

		this.hideButtons = (BASIC_HIDE_BUTTONS[currentPath()] || []).map(t => _(t));

		const check = () => {
			if (cfg().mode === 'basic')
				this.simplifyPage();
		};

		new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
		check();
	},

	simplifyPage() {
		/* sezioni della panoramica, riconosciute dal titolo; il polling le
		 * ridisegna, quindi si ripassa a ogni aggiornamento */
		document.querySelectorAll('#maincontent .cbi-section > .cbi-title > h3').forEach(h3 => {
			const title = h3.firstChild ? h3.firstChild.textContent.trim() : '';
			const keep = this.statusRules[title];
			const section = h3.closest('.cbi-section');

			if (!keep)
				return;

			if (!keep.length) {
				section.setAttribute('data-ninux-basic-hide', '');
				return;
			}

			section.querySelectorAll('.tr').forEach(tr => {
				const label = tr.firstElementChild ? tr.firstElementChild.textContent.trim() : '';
				const bar = tr.querySelector('.cbi-progressbar[title]');

				if (keep.indexOf(label) === -1) {
					tr.setAttribute('data-ninux-basic-hide', '');
					return;
				}

				/* titolo della barra di LuCI: "usato / totale (NN%)" */
				const m = bar ? bar.getAttribute('title').match(/^.+ \/ (.+) \((\d+)%\)$/) : null;

				if (m)
					bar.setAttribute('data-ninux-label', _('%d%% of %s').format(+m[2], m[1]));
			});
		});

		/* pulsanti riconosciuti dal testo */
		if (this.hideButtons.length)
			document.querySelectorAll('#maincontent .cbi-button').forEach(btn => {
				if (this.hideButtons.indexOf(btn.textContent.trim()) !== -1)
					btn.setAttribute('data-ninux-basic-hide', '');
			});

		/* se la scheda attiva è nascosta dal CSS (ricordata da una visita in
		 * modalità avanzata), si passa alla prima visibile */
		document.querySelectorAll('#maincontent .cbi-tabmenu, .modal .cbi-tabmenu').forEach(menu => {
			const active = menu.querySelector(':scope > li.cbi-tab');

			if (!active || active.offsetParent !== null || menu.offsetParent === null)
				return;

			const first = [...menu.children].find(li => li.offsetParent !== null);

			if (first && first.firstElementChild)
				first.firstElementChild.click();
		});
	},

	/* --- menu su mobile ------------------------------------------------- */

	bindNavToggle() {
		const btn = document.querySelector('#nav-toggle');
		const backdrop = document.querySelector('#nav-backdrop');
		const set = (open) => {
			document.body.classList.toggle('nav-open', open);
			if (btn) btn.setAttribute('aria-expanded', String(open));
		};

		if (btn)
			btn.addEventListener('click', () => {
				const open = !document.body.classList.contains('nav-open');

				set(open);

				/* nel menu a scomparsa la categoria della pagina corrente è aperta */
				if (open)
					this.setGroup(document.querySelector('#mainmenu li.group.active'), true);
			});

		if (backdrop)
			backdrop.addEventListener('click', () => set(false));

		document.addEventListener('keydown', (ev) => {
			if (ev.key === 'Escape') {
				set(false);
				this.setGroup(null);
			}
		});
	}
});
