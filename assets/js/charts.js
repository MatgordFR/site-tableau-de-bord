/* Essor — graphiques dessinés à la main en SVG (aucune librairie).
   Chaque fonction renvoie une chaîne SVG ; les couleurs viennent du CSS
   (classes .chart-*) → s'adaptent au thème clair/sombre tout seul. */
window.CRM = window.CRM || {};
CRM.charts = (function () {
  var AW = 640, AP = 8;   // repère user-units de l'aire (pour aligner les tooltips)

  // Fraction horizontale [0..1] du point i (n points) — sert à placer les tooltips.
  function pointXFrac(i, n) { return n <= 1 ? 0.5 : (AP + (i / (n - 1)) * (AW - AP * 2)) / AW; }

  // Courbe d'aire (line + remplissage) — courbe de MRR.
  function area(values, opts) {
    var o = opts || {}, w = AW, h = o.h || 220, p = AP;
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = (max - min) || 1, iw = w - p * 2, ih = h - p * 2;
    var pts = values.map(function (v, i) {
      var x = p + (values.length === 1 ? iw / 2 : (i / (values.length - 1)) * iw);
      var y = p + ih - ((v - min) / span) * ih; return [x, y];
    });
    var line = pts.map(function (pt, i) { return (i ? "L" : "M") + pt[0].toFixed(1) + " " + pt[1].toFixed(1); }).join(" ");
    var fill = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (h - p) + " L" + pts[0][0].toFixed(1) + " " + (h - p) + " Z";
    var last = pts[pts.length - 1], grid = "";
    for (var g = 1; g <= 3; g++) { var gy = (p + (ih / 4) * g).toFixed(1); grid += '<line class="chart-grid" x1="' + p + '" y1="' + gy + '" x2="' + (w - p) + '" y2="' + gy + '"/>'; }
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="Courbe du MRR">' +
      grid + '<path class="chart-area-fill" d="' + fill + '"/><path class="chart-area-line" d="' + line + '"/>' +
      '<circle class="chart-dot" cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.5"/></svg>';
  }

  // Barres groupées (nouveau vs churn) — mouvements de MRR.
  function groupedBars(rows, opts) {
    var o = opts || {}, w = AW, h = o.h || 220, p = 6;
    var max = 1; rows.forEach(function (r) { max = Math.max(max, r.up, r.down); });
    var iw = w - p * 2, ih = h - p * 2, base = h - p, slot = iw / rows.length, bw = Math.min(slot * 0.28, 16), gap = 3;
    var out = '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Entrées contre sorties de MRR">';
    rows.forEach(function (r, i) {
      var cx = p + slot * i + slot / 2, hn = (r.up / max) * ih, hc = (r.down / max) * ih;
      out += '<rect class="bar-new" x="' + (cx - bw - gap / 2).toFixed(1) + '" y="' + (base - hn).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hn.toFixed(1) + '" rx="2"/>';
      out += '<rect class="bar-churn" x="' + (cx + gap / 2).toFixed(1) + '" y="' + (base - hc).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hc.toFixed(1) + '" rx="2"/>';
    });
    return out + '</svg>';
  }

  // Waterfall / bridge de MRR : début → +new +expansion −contraction −churn → fin.
  function waterfall(steps, opts) {
    var o = opts || {}, w = AW, h = o.h || 240, p = 10, labelH = 22;
    var run = 0, tops = [];               // top cumulé pour placer chaque barre flottante
    var maxV = 0;
    steps.forEach(function (s) {
      if (s.type === "base" || s.type === "total") { tops.push({ from: 0, to: s.value }); run = s.value; }
      else { var from = run, to = run + s.value * (s.dir || 1); tops.push({ from: from, to: to }); run = to; }
      maxV = Math.max(maxV, tops[tops.length - 1].from, tops[tops.length - 1].to);
    });
    var iw = w - p * 2, ih = h - p * 2 - labelH, base = h - p - labelH, slot = iw / steps.length, bw = Math.min(slot * 0.6, 64);
    function y(v) { return base - (v / maxV) * ih; }
    var out = '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Waterfall de MRR">';
    steps.forEach(function (s, i) {
      var cx = p + slot * i + slot / 2, t = tops[i];
      var y0 = y(Math.max(t.from, t.to)), y1 = y(Math.min(t.from, t.to)), bh = Math.max(2, y1 - y0);
      var cls = s.type === "base" || s.type === "total" ? "wf-total" : (s.dir > 0 ? "wf-up" : "wf-down");
      out += '<rect class="' + cls + '" x="' + (cx - bw / 2).toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="3"/>';
      // connecteur pointillé vers l'étape suivante
      if (i < steps.length - 1) { var yc = y(tops[i].to); out += '<line class="wf-conn" x1="' + (cx + bw / 2).toFixed(1) + '" y1="' + yc.toFixed(1) + '" x2="' + (cx + slot - bw / 2).toFixed(1) + '" y2="' + yc.toFixed(1) + '"/>'; }
      out += '<text class="wf-cap" x="' + cx.toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle">' + s.short + '</text>';
    });
    return out + '</svg>';
  }

  // Mini-courbe (sparkline) — fiche client.
  function sparkline(values, opts) {
    var o = opts || {}, w = o.w || 160, h = o.h || 40, p = 3;
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = (max - min) || 1, iw = w - p * 2, ih = h - p * 2;
    var d = values.map(function (v, i) {
      var x = p + (values.length === 1 ? iw / 2 : (i / (values.length - 1)) * iw);
      var y = p + ih - ((v - min) / span) * ih; return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ");
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><path class="spark-line" d="' + d + '"/></svg>';
  }

  return { area: area, groupedBars: groupedBars, waterfall: waterfall, sparkline: sparkline, pointXFrac: pointXFrac };
})();
