<div align="center">

# 📊 Essor

### Un CRM avec de **vraies analytics de MRR** — 100 % vanilla, zéro dépendance.

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Dépendances](https://img.shields.io/badge/d%C3%A9pendances-0-2ea44f?style=flat-square)
![Graphiques](https://img.shields.io/badge/graphiques-SVG_fait_main-8957e5?style=flat-square)
![Thèmes](https://img.shields.io/badge/th%C3%A8mes-clair_%2F_sombre-0f7d63?style=flat-square)
![Licence](https://img.shields.io/badge/licence-ISC-2f81f7?style=flat-square)

[![▶ Ouvrir la démo](https://img.shields.io/badge/%E2%96%B6_Ouvrir_la_d%C3%A9mo-0f7d63?style=for-the-badge)](https://matgordfr.github.io/site-tableau-de-bord/)
&nbsp;
[![Voir le code](https://img.shields.io/badge/Voir_le_code-161b22?style=for-the-badge&logo=github)](https://github.com/MatgordFR/site-tableau-de-bord)

<br>

![Aperçu du tableau de bord](preview.jpg)

</div>

> [!NOTE]
> **Projet démo.** Toutes les données (clients, deals, revenus) sont **fictives** — c'est une vitrine de savoir-faire, pas un produit en production. Tout tourne dans le navigateur, sans backend.

---

## ✨ Ce que ça montre

| Vue | En bref |
|---|---|
| 🗂️ **Tableau de bord** | KPIs (MRR, ARR, clients actifs, churn), **courbe de MRR avec tooltip au survol**, top clients, activité récente |
| 👥 **Clients** | Table **triable** + **recherche instantanée**, et une **fiche client** qui glisse au clic (sparkline, note, deals liés) |
| 🧲 **Deals** | Pipeline en **kanban** : lead → en discussion → gagné / perdu |
| 💸 **Revenus** | MRR décomposé en 4 flux + **waterfall / bridge du MRR** + les **métriques SaaS** ci-dessous |
| 🔮 **Prévisions** | Projection du MRR sur 6 mois selon la tendance, avec les hypothèses et le détail mois par mois |

## 📈 Les métriques que regarde un investisseur

Pas juste un total de revenus — les indicateurs qui disent si la machine tient :

| Métrique | Ce que c'est |
|---|---|
| **ARPU** | Revenu moyen par client actif |
| **LTV** | Valeur vie client (ARPU ÷ churn mensuel) |
| **Quick Ratio** | Vitesse de croissance : (nouveau + expansion) ÷ (contraction + churn) |
| **NRR** | Rétention nette du revenu sur la base existante |

Et le **waterfall du MRR** décompose visuellement : `MRR début → + new → + expansion → − contraction → − churn → MRR fin`.

## 🎨 Le craft

- **Thème clair & sombre** (bouton, mémorisé, respecte les préférences système)
- **Graphiques dessinés à la main en SVG** — aire, barres groupées, waterfall, sparkline
- **Animations** : la courbe se dessine, les barres poussent, les compteurs montent
- **Responsive**, accessible au clavier, `prefers-reduced-motion` respecté
- Données **cohérentes et dérivées** d'une source unique (les offres somment au MRR, la courbe se déduit des mouvements)

## 🛠️ Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![SVG](https://img.shields.io/badge/SVG-FFB13B?style=flat-square&logo=svg&logoColor=black)

Aucun framework, aucune librairie de graphiques, aucun CDN. **~20 Ko** de code (gzippé) + 2 polices auto-hébergées.

## 📁 Structure

```
index.html              → page de présentation (landing animée)
app.html                → l'application CRM (la démo interactive)
assets/
  css/styles.css        → design system + thèmes clair/sombre
  css/landing.css       → styles de la présentation
  js/data.js            → jeu de données fictif (source unique)
  js/charts.js          → graphiques SVG (aire, barres, waterfall, sparkline)
  js/app.js             → vues, interactivité, métriques, thème
  js/landing.js         → reveals au scroll + compteurs
  fonts/                → Fraunces + Space Grotesk (auto-hébergées)
```

## 🚀 Lancer en local

Ouvre `index.html` dans ton navigateur — ou sers le dossier :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## 👤 Auteur

Réalisé par **[MatgordFR](https://github.com/MatgordFR)** — dev indépendant (bots Discord, sites, IA).
🌐 [matgord.com](https://matgord.com) · 🐦 [@matgordfr](https://x.com/matgordfr)

## 📄 Licence

[ISC](LICENSE) — libre d'usage.
