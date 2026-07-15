/* Essor — logique & vues. Vanilla, aucune dépendance.
   Sécurité : tout le HTML injecté vient de data.js (données fictives maîtrisées).
   La saisie de recherche n'est JAMAIS interpolée dans du HTML — elle filtre
   seulement des lignes déjà rendues (voir applyQuery). */
(function () {
  "use strict";
  var D = CRM.data, C = CRM.charts;
  var byId = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Dérivations ---------- */
  var active = D.clients.filter(function (c) { return c.status === "actif"; });
  var MRR = active.reduce(function (s, c) { return s + c.mrr; }, 0);
  var ARR = MRR * 12;

  var series = [];
  (function () { var run = D.baseMrr; D.movements.forEach(function (m) { run += m.new + m.exp - m.contr - m.churn; series.push(run); }); })();
  var prevMRR = series[series.length - 2] || D.baseMrr;
  var thisMonth = D.movements[D.movements.length - 1];
  var netMonth = thisMonth.new + thisMonth.exp - thisMonth.contr - thisMonth.churn;
  var lostMonth = thisMonth.contr + thisMonth.churn;
  var growthPct = prevMRR ? (netMonth / prevMRR) * 100 : 0;
  var churnPct = prevMRR ? (thisMonth.churn / prevMRR) * 100 : 0;

  var byOffer = D.offers.map(function (o) {
    return { offer: o, mrr: active.filter(function (c) { return c.offer === o; }).reduce(function (s, c) { return s + c.mrr; }, 0) };
  }).sort(function (a, b) { return b.mrr - a.mrr; });

  var newClients90 = active.filter(function (c) { return c.sinceMonths <= 3; }).length;
  var churned90 = D.clients.filter(function (c) { return c.status === "résilié"; }).length;
  var netClients = newClients90 - churned90;

  // Métriques SaaS
  var arpu = MRR / active.length;
  var churnRateM = prevMRR ? thisMonth.churn / prevMRR : 0;
  var ltv = churnRateM > 0 ? arpu / churnRateM : 0;
  var last3 = D.movements.slice(-3);
  var qNew = last3.reduce(function (a, m) { return a + m.new + m.exp; }, 0);
  var qLost = last3.reduce(function (a, m) { return a + m.contr + m.churn; }, 0);
  var quickRatio = qLost > 0 ? qNew / qLost : qNew;
  var nrrM = prevMRR ? (prevMRR + thisMonth.exp - thisMonth.contr - thisMonth.churn) / prevMRR : 1;

  D.clients.forEach(function (c) { c.history = histFor(c); });
  function histFor(c) {
    var pts = 12, cur = c.mrr || 0, out = [], months = Math.min(c.sinceMonths || pts, pts);
    var start = Math.max(15, Math.round((cur || 120) * 0.45));
    for (var i = 0; i < pts; i++) {
      if (i < pts - months) out.push(0);
      else { var t = (i - (pts - months)) / Math.max(1, months - 1); out.push(Math.round(start + (cur - start) * t)); }
    }
    if (c.status === "résilié") out[pts - 1] = 0;
    return out;
  }

  /* ---------- Formatage ---------- */
  function eur(n) { return Math.round(n).toLocaleString("fr-FR") + " €"; }
  function pct(n) { return n.toFixed(1).replace(".", ",") + " %"; }
  function dec(n) { return n.toFixed(1).replace(".", ","); }
  function anciennete(m) { return m >= 12 ? (Math.floor(m / 12) + " an" + (m >= 24 ? "s" : "")) : (m + " mois"); }

  function countUp(el, to, fmt) {
    if (!el) return;
    if (reduceMotion) { el.textContent = fmt(to); return; }
    var dur = 650, t0 = null;
    function step(ts) { if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / dur); var e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  function animateBars(root) {
    if (!root) return;
    requestAnimationFrame(function () {
      root.querySelectorAll(".bar-fill").forEach(function (el) { el.style.width = el.getAttribute("data-w") + "%"; });
    });
  }
  function attachAreaTip(wrap, values, labels, fmt) {
    if (!wrap) return;
    var tip = document.createElement("div"); tip.className = "tip";
    var guide = document.createElement("div"); guide.className = "guide";
    wrap.appendChild(guide); wrap.appendChild(tip);
    wrap.addEventListener("mousemove", function (e) {
      var r = wrap.getBoundingClientRect(); if (!r.width) return;
      var n = values.length, idx = Math.round((e.clientX - r.left) / r.width * (n - 1));
      idx = Math.max(0, Math.min(n - 1, idx));
      var fx = C.pointXFrac(idx, n) * r.width;
      guide.style.left = fx + "px"; guide.classList.add("show");
      tip.style.left = fx + "px"; tip.classList.add("show");
      tip.innerHTML = '<span class="muted">' + labels[idx] + '</span> &nbsp;<b>' + fmt(values[idx]) + '</b>';
    });
    wrap.addEventListener("mouseleave", function () { guide.classList.remove("show"); tip.classList.remove("show"); });
  }

  /* ---------- État ---------- */
  var period = 12, sort = { key: "mrr", dir: "desc" }, query = "";

  /* ================= VUES ================= */

  function renderDash() {
    var win = Math.max(period, 2), s = series.slice(-win), lbl = D.meta.months.slice(-win);
    var mv = D.movements.slice(-period);
    var netP = mv.reduce(function (a, m) { return a + m.new + m.exp - m.contr - m.churn; }, 0);
    var top = active.slice().sort(function (a, b) { return b.mrr - a.mrr; }).slice(0, 5);
    var maxOffer = byOffer[0].mrr || 1;

    byId("view-dash").innerHTML =
      '<div class="grid-kpi">' +
        kpi("MRR (revenu mensuel)", "k-mrr", "kpi accent", "delta-up", pct(growthPct)) +
        kpi("ARR (annualisé)", "k-arr", "kpi", "delta-up", pct(growthPct)) +
        kpi("Clients actifs", "k-act", "kpi", "delta-up", netClients + " ce trimestre") +
        kpi("Taux de churn", "k-chn", "kpi", "delta-down", eur(thisMonth.churn) + " ce mois") +
      '</div>' +
      '<div class="grid-2">' +
        card("Évolution du MRR", periodLabel() + " · net " + (netP >= 0 ? "+" : "") + eur(netP),
          '<div class="chart-wrap" id="dashChart">' + C.area(s, {}) + '</div>' + axis(lbl) +
          '<div class="hint" style="margin-top:6px">Survole la courbe pour le détail mois par mois.</div>') +
        card("Top clients", "par MRR", '<div class="list" id="topList">' + top.map(clientRow).join("") + '</div>') +
      '</div>' +
      '<div class="grid-2" style="margin-top:16px">' +
        card("MRR par offre", "d'où vient le revenu récurrent", '<div class="bars" id="dashBars">' + offerBars(byOffer, maxOffer, "eur") + '</div>') +
        card("Activité récente", "derniers mouvements",
          '<div class="feed">' + D.activity.map(function (e) {
            return '<div class="ev"><span class="kind ' + e.kind + '"></span><div><b>' + e.title + '</b><small>' + e.detail + " · " + e.when + '</small></div></div>';
          }).join("") + '</div>') +
      '</div>';

    countUp(byId("k-mrr"), MRR, eur); countUp(byId("k-arr"), ARR, eur);
    countUp(byId("k-act"), active.length, function (n) { return String(Math.round(n)); });
    countUp(byId("k-chn"), churnPct, pct);
    wireClientRows(byId("topList"));
    animateBars(byId("dashBars"));
    attachAreaTip(byId("dashChart"), s, lbl, eur);
  }

  function renderClients() {
    var rows = sortRows(active.concat(D.clients.filter(function (c) { return c.status === "résilié"; })));
    var head = [th("Client", "name"), th("Offre", "offer"), th("MRR", "mrr", true), th("Ancienneté", "sinceMonths"), th("Statut", "status")].join("");
    byId("view-clients").innerHTML = card("Tous les clients", active.length + " actifs · " + churned90 + " résilié",
      '<div class="table-wrap"><table class="data"><thead><tr>' + head + '</tr></thead><tbody id="cbody">' + rows.map(clientTr).join("") + '</tbody></table></div>' +
      '<div class="hint" style="margin-top:12px">Clique une ligne pour la fiche · clique un en-tête pour trier · recherche en haut à droite.</div>');
    wireSort(); wireClientRows(byId("cbody")); applyQuery();
  }

  function renderDeals() {
    var cols = [["lead", "Nouveau lead"], ["discussion", "En discussion"], ["won", "Gagné"], ["lost", "Perdu"]];
    var pipe = D.deals.lead.concat(D.deals.discussion).reduce(function (s, d) { return s + d.value; }, 0);
    byId("view-deals").innerHTML = card("Pipeline commercial", "valeur en cours (lead + discussion) : " + eur(pipe),
      '<div class="kanban">' + cols.map(function (col) {
        var list = D.deals[col[0]];
        return '<div class="col"><div class="col-head"><b>' + col[1] + '</b><span class="count">' + list.length + '</span></div>' +
          list.map(function (d) {
            return '<div class="deal"><div class="dh"><span class="chip" style="background:' + d.color + '">' + d.initials + '</span><b>' + d.client + '</b></div>' +
              '<div class="dv num">' + eur(d.value) + '</div><small>' + d.note + '</small></div>';
          }).join("") + '</div>';
      }).join("") + '</div>');
  }

  function renderRevenue() {
    var mv = D.movements.slice(-period);
    var nw = mv.reduce(function (a, m) { return a + m.new + m.exp; }, 0);
    var lost = mv.reduce(function (a, m) { return a + m.contr + m.churn; }, 0);
    var maxOffer = byOffer[0].mrr || 1;
    var wf = [
      { short: "Début", type: "base", value: prevMRR },
      { short: "+ new", dir: 1, value: thisMonth.new },
      { short: "+ exp.", dir: 1, value: thisMonth.exp },
      { short: "− contr.", dir: -1, value: thisMonth.contr },
      { short: "− churn", dir: -1, value: thisMonth.churn },
      { short: "Fin", type: "total", value: MRR },
    ];

    byId("view-revenue").innerHTML =
      '<div class="grid-kpi" style="grid-template-columns:repeat(3,1fr)">' +
        kpiStatic("Entrées de MRR", "+" + eur(nw), "delta-up", "new + expansion") +
        kpiStatic("Sorties de MRR", "−" + eur(lost), "delta-down", "contraction + churn") +
        kpiStatic("MRR net", (nw - lost >= 0 ? "+" : "") + eur(nw - lost), "delta-up", pct(growthPct)) +
      '</div>' +

      card("Métriques SaaS", "les chiffres que regarde un investisseur",
        '<div class="metrics">' +
          metric("ARPU", eur(arpu), "revenu moyen par client actif", false) +
          metric("LTV", eur(ltv), "valeur vie = ARPU ÷ churn mensuel", false) +
          metric("Quick Ratio", dec(quickRatio), "(new+exp) ÷ (contraction+churn) · 3 mois", quickRatio >= 4) +
          metric("NRR", pct(nrrM * 100), "rétention nette du revenu (mensuel)", nrrM >= 1) +
        '</div>') +

      '<div class="grid-2" style="margin:16px 0">' +
        card("Waterfall du MRR", "du mois dernier à aujourd'hui",
          '<div class="chart-wrap" style="height:250px">' + C.waterfall(wf, {}) + '</div>' +
          '<div class="wf-legend"><span><i class="dot acc"></i> entrée</span><span><i class="dot dn"></i> sortie</span><span class="muted">gris = solde</span></div>') +
        card("MRR par offre", "répartition du revenu récurrent", '<div class="bars" id="revBars">' + offerBars(byOffer, maxOffer, "eur") + '</div>' +
          '<div style="height:14px"></div><div class="bars" id="revBars2">' + offerBars(byOffer, MRR, "pct") + '</div>') +
      '</div>' +

      card("Mouvements de MRR (" + periodLabel() + ")", "entrées (new+exp) vs sorties (contraction+churn)",
        '<div class="legend"><span><i class="dot acc"></i> entrées</span><span><i class="dot dn"></i> sorties</span></div>' +
        '<div class="chart-wrap">' + C.groupedBars(mv.map(function (m) { return { up: m.new + m.exp, down: m.contr + m.churn }; }), {}) + '</div>' +
        axis(D.meta.months.slice(-period)));

    animateBars(byId("revBars")); animateBars(byId("revBars2"));
  }

  function renderForecast() {
    var avgNew = Math.round(last3.reduce(function (a, m) { return a + m.new + m.exp; }, 0) / 3);
    var rate = last3.reduce(function (a, m, i) { var pm = series[series.length - 3 + i - 1] || prevMRR; return a + (m.contr + m.churn) / pm; }, 0) / 3;
    var proj = [], cur = MRR;
    for (var i = 0; i < 6; i++) { var ch = Math.round(cur * rate); var end = cur + avgNew - ch; proj.push({ m: i + 1, start: cur, add: avgNew, churn: ch, end: end }); cur = end; }
    var projSeries = [MRR].concat(proj.map(function (p) { return p.end; }));
    var projLbl = ["ajd"].concat(proj.map(function (p) { return "+" + p.m; }));
    var proj6 = proj[proj.length - 1].end;

    byId("view-forecast").innerHTML =
      '<div class="grid-kpi" style="grid-template-columns:repeat(3,1fr)">' +
        kpiStatic("MRR aujourd'hui", eur(MRR), "delta-up", "point de départ") +
        kpiStatic("MRR projeté (6 mois)", eur(proj6), "delta-up", "+" + eur(proj6 - MRR) + " potentiels") +
        kpiStatic("Entrées / mois", eur(avgNew), "delta-up", "moyenne new+exp sur 3 mois") +
      '</div>' +
      '<div class="grid-2" style="margin-bottom:16px">' +
        card("Projection du MRR", "aujourd'hui → +6 mois",
          '<div class="chart-wrap" id="fcChart">' + C.area(projSeries, {}) + '</div>' +
          '<div class="axis">' + projLbl.map(function (l) { return "<span>" + l + "</span>"; }).join("") + '</div>' +
          '<div class="hint" style="margin-top:6px">Survole pour voir chaque mois projeté.</div>') +
        card("Hypothèses", "sur quoi repose la projection",
          '<div class="px-note" style="line-height:1.7">• Entrées : <b>' + eur(avgNew) + '/mois</b> (moyenne new+expansion, 3 mois).<br>' +
          '• Sorties : <b>' + pct(rate * 100) + '/mois</b> (contraction+churn) sur le MRR courant.<br>' +
          '• Aucun événement exceptionnel (gros deal, vague de départs).<br>' +
          '<span class="muted">Modèle simple, à but de démonstration — pas une garantie.</span></div>') +
      '</div>' +
      card("Détail mois par mois", "revenu récurrent projeté",
        '<div class="table-wrap"><table class="data"><thead><tr><th>Mois</th><th class="right">MRR début</th><th class="right">+ entrées</th><th class="right">− sorties</th><th class="right">MRR fin</th></tr></thead><tbody>' +
        proj.map(function (p) {
          return '<tr><td>+' + p.m + ' mois</td><td class="right num">' + eur(p.start) + '</td><td class="right num" style="color:var(--up)">+' + eur(p.add) + '</td><td class="right num" style="color:var(--down)">−' + eur(p.churn) + '</td><td class="right num"><b>' + eur(p.end) + '</b></td></tr>';
        }).join("") + '</tbody></table></div>');

    attachAreaTip(byId("fcChart"), projSeries, projLbl, eur);
  }

  /* ---------- Fragments ---------- */
  function kpi(label, valId, cls, dCls, dTxt) { return '<div class="' + cls + '"><div class="kpi-label">' + label + '</div><div class="kpi-val num" id="' + valId + '">—</div><div class="kpi-delta ' + dCls + '">' + dTxt + '</div></div>'; }
  function kpiStatic(label, val, dCls, dTxt) { return '<div class="kpi"><div class="kpi-label">' + label + '</div><div class="kpi-val num">' + val + '</div><div class="kpi-delta ' + dCls + '">' + dTxt + '</div></div>'; }
  function metric(label, val, hint, good) { return '<div class="metric"><div class="m-label">' + label + (good ? ' <span class="badge-good">sain</span>' : '') + '</div><div class="m-val num">' + val + '</div><div class="m-hint">' + hint + '</div></div>'; }
  function card(title, sub, body) { return '<div class="card card-pad"><div class="card-head"><h2>' + title + '</h2><span class="sub">' + sub + '</span></div>' + body + '</div>'; }
  function axis(labels) { return '<div class="axis">' + labels.map(function (l) { return "<span>" + l + "</span>"; }).join("") + '</div>'; }
  function periodLabel() { return period === 1 ? "30 jours" : period === 3 ? "90 jours" : "12 mois"; }
  function offerBars(rows, denom, mode) {
    return rows.map(function (o) {
      var w = Math.round(o.mrr / denom * 100);
      var val = mode === "pct" ? Math.round(o.mrr / denom * 100) + " %" : eur(o.mrr);
      return '<div class="bar-line"><span class="muted">' + o.offer + '</span><span class="bar-track"><span class="bar-fill" data-w="' + w + '"></span></span><span class="val num">' + val + '</span></div>';
    }).join("");
  }
  function clientRow(c) { return '<div class="row" role="button" tabindex="0" data-id="' + c.id + '"><span class="chip" style="background:' + c.color + '">' + c.initials + '</span><span class="who"><b>' + c.name + '</b><small>' + c.offer + '</small></span><span class="amt num">' + eur(c.mrr) + '</span></div>'; }
  function clientTr(c) {
    return '<tr role="button" tabindex="0" data-id="' + c.id + '" data-name="' + c.name.toLowerCase() + '" data-offer="' + c.offer.toLowerCase() + '">' +
      '<td><span class="chip" style="display:inline-grid;vertical-align:middle;background:' + c.color + '">' + c.initials + '</span> ' + c.name + '</td>' +
      '<td><span class="tag-offer">' + c.offer + '</span></td><td class="right num">' + eur(c.mrr) + '</td>' +
      '<td>' + (c.status === "résilié" ? "—" : anciennete(c.sinceMonths)) + '</td>' +
      '<td><span class="status ' + c.status + '">' + c.status + '</span></td></tr>';
  }
  function th(label, key, right) {
    var on = sort.key === key;
    return '<th class="sortable' + (right ? " right" : "") + (on ? " sorted" : "") + '" role="button" tabindex="0" data-key="' + key + '">' + label + ' <span class="arrow">' + (on ? (sort.dir === "asc" ? "▲" : "▼") : "▲") + '</span></th>';
  }
  function sortRows(rows) {
    var k = sort.key, dir = sort.dir === "asc" ? 1 : -1;
    return rows.slice().sort(function (a, b) { var va = a[k], vb = b[k]; return typeof va === "string" ? va.localeCompare(vb) * dir : (va - vb) * dir; });
  }

  /* ---------- Interactions ---------- */
  function onActivate(el, fn) {
    el.addEventListener("click", fn);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") { e.preventDefault(); fn(); }
    });
  }
  function wireClientRows(root) { if (root) root.querySelectorAll("[data-id]").forEach(function (el) { onActivate(el, function () { openClient(el.getAttribute("data-id")); }); }); }
  function wireSort() {
    byId("view-clients").querySelectorAll("th.sortable").forEach(function (h) {
      onActivate(h, function () {
        var k = h.getAttribute("data-key");
        if (sort.key === k) sort.dir = sort.dir === "asc" ? "desc" : "asc";
        else { sort.key = k; sort.dir = (k === "mrr" || k === "sinceMonths") ? "desc" : "asc"; }
        renderClients();
      });
    });
  }
  function applyQuery() {
    var body = byId("cbody"); if (!body) return;
    var q = query.trim().toLowerCase();
    body.querySelectorAll("tr").forEach(function (tr) {
      var hit = !q || tr.getAttribute("data-name").indexOf(q) > -1 || tr.getAttribute("data-offer").indexOf(q) > -1;
      tr.style.display = hit ? "" : "none";
    });
  }

  function openClient(id) {
    var c = D.clients.find(function (x) { return x.id === id; }); if (!c) return;
    var dealCount = Object.keys(D.deals).reduce(function (n, k) { return n + D.deals[k].filter(function (d) { return d.client === c.name; }).length; }, 0);
    byId("panel").innerHTML =
      '<button class="px-close" id="pxClose" aria-label="Fermer">×</button>' +
      '<div class="px-head"><span class="chip" style="background:' + c.color + '">' + c.initials + '</span><div><h3>' + c.name + '</h3><span class="muted">' + c.offer + " · " + c.email + '</span></div></div>' +
      '<div class="px-label">MRR actuel</div><div class="px-mrr num">' + eur(c.mrr) + '</div>' + C.sparkline(c.history, { w: 320, h: 46 }) +
      '<div class="px-grid">' +
        '<div class="px-cell"><small>Statut</small><b class="status ' + c.status + '">' + c.status + '</b></div>' +
        '<div class="px-cell"><small>Ancienneté</small><b>' + (c.status === "résilié" ? "—" : anciennete(c.sinceMonths)) + '</b></div>' +
        '<div class="px-cell"><small>Offre</small><b>' + c.offer + '</b></div>' +
        '<div class="px-cell"><small>Deals liés</small><b>' + dealCount + '</b></div>' +
      '</div><div class="px-label">Note</div><div class="px-note">' + c.note + '</div>';
    byId("panel").classList.add("open"); byId("panel").setAttribute("aria-hidden", "false"); byId("backdrop").classList.add("open");
    byId("pxClose").addEventListener("click", closeClient);
    try { byId("pxClose").focus(); } catch (e) {}
  }
  function closeClient() { byId("panel").classList.remove("open"); byId("panel").setAttribute("aria-hidden", "true"); byId("backdrop").classList.remove("open"); }

  /* ---------- Thème ---------- */
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = byId("themeBtn"); if (b) { b.textContent = t === "dark" ? "☀" : "☾"; }
    try { localStorage.setItem("crm-theme", t); } catch (e) {}
  }
  function initTheme() {
    var saved = null; try { saved = localStorage.getItem("crm-theme"); } catch (e) {}
    var dark = saved ? saved === "dark" : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(dark ? "dark" : "light");
  }

  /* ---------- Vues ---------- */
  var VIEWS = {
    dash: { title: "Tableau de bord", eyebrow: "vue d'ensemble", sub: "Tes revenus récurrents, en un coup d'œil.", render: renderDash },
    clients: { title: "Clients", eyebrow: "portefeuille", sub: "Qui paie quoi, et depuis quand.", render: renderClients },
    deals: { title: "Deals", eyebrow: "pipeline", sub: "Les opportunités en cours.", render: renderDeals },
    revenue: { title: "Revenus", eyebrow: "flux & métriques", sub: "MRR décomposé, métriques SaaS, projection.", render: renderRevenue },
    forecast: { title: "Prévisions", eyebrow: "projection", sub: "Où va le MRR si la tendance tient.", render: renderForecast },
  };
  function setView(name) {
    var v = VIEWS[name]; if (!v) return;
    byId("nav").querySelectorAll(".nav-item").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-v") === name); });
    document.querySelectorAll(".view").forEach(function (s) { s.classList.toggle("is-active", s.getAttribute("data-view") === name); });
    byId("pageTitle").textContent = v.title; byId("pageEyebrow").textContent = v.eyebrow; byId("pageSub").textContent = v.sub;
    v.render();
    byId("sidebar").classList.remove("open"); byId("backdrop").classList.remove("open"); window.scrollTo(0, 0);
  }

  /* ---------- Boot ---------- */
  function boot() {
    initTheme();
    byId("acctName").textContent = D.account.name; byId("acctRole").textContent = D.account.role; byId("acctAv").textContent = D.account.initials;
    byId("nav").addEventListener("click", function (e) { var b = e.target.closest(".nav-item"); if (b) setView(b.getAttribute("data-v")); });
    byId("themeBtn").addEventListener("click", function () { setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"); });
    byId("period").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      period = parseInt(b.getAttribute("data-p"), 10);
      byId("period").querySelectorAll("button").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      var cur = document.querySelector(".view.is-active").getAttribute("data-view");
      if (cur === "dash") renderDash(); else if (cur === "revenue") renderRevenue(); else if (cur === "forecast") renderForecast();
    });
    byId("search").addEventListener("input", function (e) {
      query = e.target.value;
      if (!document.querySelector('.view[data-view="clients"]').classList.contains("is-active")) setView("clients"); else applyQuery();
    });
    byId("backdrop").addEventListener("click", function () { closeClient(); byId("sidebar").classList.remove("open"); });
    byId("menuBtn").addEventListener("click", function () { byId("sidebar").classList.toggle("open"); byId("backdrop").classList.toggle("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeClient(); });
    setView("dash");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
