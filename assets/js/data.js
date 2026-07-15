/* Essor — démo · données 100% FICTIVES (source unique).
   Rien ici n'est réel : clients, revenus et deals sont inventés pour la vitrine.
   Choix : on stocke des FAITS ATOMIQUES ; les KPIs (MRR, ARR, churn, courbe) sont
   DÉRIVÉS dans app.js → tout reste cohérent (les offres somment au MRR, la courbe
   se déduit des mouvements). Aucune dépendance, aucun réseau. */
window.CRM = window.CRM || {};

CRM.data = {
  meta: {
    product: "Essor",
    author: "MatgordFR",
    site: "matgord.com",
    currency: "€",
    // 12 étiquettes de mois, la dernière = mois courant
    months: ["août", "sept", "oct", "nov", "déc", "janv", "févr", "mars", "avr", "mai", "juin", "juil"],
  },

  account: { name: "Matéo", role: "MatgordFR · agence", initials: "M" },

  // Les 3 offres de l'agence (le libellé sert de regroupement des clients).
  offers: ["Studio", "Custom", "Site"],

  /* Clients. mrr = revenu mensuel récurrent. sinceMonths = ancienneté.
     history laissé vide → généré dans app.js (rampe déterministe vers mrr). */
  clients: [
    { id: "c-nova",   name: "Studio Nova",     initials: "SN", color: "#2E9E6B", offer: "Studio", mrr: 290, status: "actif",   sinceMonths: 14, email: "hello@studionova.fr",   note: "Client historique. Renouvellement annuel sans accroc." },
    { id: "c-verte",  name: "Maison Verte",    initials: "MV", color: "#8B5E34", offer: "Studio", mrr: 260, status: "actif",   sinceMonths: 2,  email: "contact@maisonverte.co", note: "A signé en Studio annuel il y a 2 mois. Très réactif." },
    { id: "c-pixel",  name: "Agence Pixel",    initials: "AP", color: "#C2410C", offer: "Studio", mrr: 240, status: "actif",   sinceMonths: 8,  email: "team@agencepixel.io",   note: "Upsell Custom → Studio le mois dernier (+120)." },
    { id: "c-tech",   name: "TechStart",       initials: "T",  color: "#B58900", offer: "Custom", mrr: 180, status: "actif",   sinceMonths: 6,  email: "ops@techstart.dev",     note: "Bot Discord sur-mesure. Renouvellement en discussion." },
    { id: "c-ddl",    name: "DDL Community",   initials: "DC", color: "#2563C9", offer: "Custom", mrr: 150, status: "actif",   sinceMonths: 5,  email: "admin@ddl.gg",          note: "Grosse commu gaming. Sensible au temps de réponse." },
    { id: "c-guilde", name: "GuildeMMO",       initials: "G",  color: "#3E8E3E", offer: "Custom", mrr: 130, status: "actif",   sinceMonths: 3,  email: "guilde@mmo.gg",         note: "Bot d'events. Potentiel d'upsell modération." },
    { id: "c-lumen",  name: "Café Lumen",      initials: "CL", color: "#9333EA", offer: "Site",   mrr: 90,  status: "actif",   sinceMonths: 4,  email: "bonjour@cafelumen.fr",  note: "Vitrine + réservation. Paiement mensuel régulier." },
    { id: "c-lea",    name: "Léa Photographe", initials: "LP", color: "#0E9AA7", offer: "Site",   mrr: 40,  status: "actif",   sinceMonths: 1,  email: "studio@lea-photo.fr",   note: "Nouveau (il y a 6 j). Portfolio + prise de contact." },
    { id: "c-old",    name: "OldServ",         initials: "O",  color: "#94A3B8", offer: "Custom", mrr: 0,   status: "résilié", sinceMonths: 9,  email: "—",                     note: "A résilié la semaine dernière (−120). N'a pas donné suite." },
  ],

  /* Mouvements de MRR par mois, décomposés en 4 flux (le vocabulaire SaaS) :
       new   = nouveau business (nouveaux clients)
       exp   = expansion (upsell d'un client existant)
       contr = contraction (downgrade)
       churn = résiliation
     MRR(fin) = MRR(début) + new + exp − contr − churn. La courbe, le waterfall
     et les métriques (ARPU, LTV, Quick Ratio, NRR) en sont TOUS déduits (app.js).
     baseMrr = MRR juste avant le mois 1. */
  baseMrr: 227,
  movements: [
    { new: 70,  exp: 20, contr: 0, churn: 10 }, { new: 65,  exp: 20, contr: 0, churn: 12 },
    { new: 75,  exp: 20, contr: 0, churn: 15 }, { new: 80,  exp: 25, contr: 5, churn: 18 },
    { new: 85,  exp: 30, contr: 5, churn: 15 }, { new: 95,  exp: 30, contr: 5, churn: 20 },
    { new: 80,  exp: 30, contr: 5, churn: 25 }, { new: 100, exp: 35, contr: 5, churn: 22 },
    { new: 95,  exp: 35, contr: 5, churn: 30 }, { new: 110, exp: 35, contr: 5, churn: 20 },
    { new: 70,  exp: 30, contr: 5, churn: 35 }, { new: 150, exp: 60, contr: 0, churn: 30 },
  ],

  /* Pipeline commercial (kanban). value = MRR mensuel potentiel du deal. */
  deals: {
    lead:       [ { client: "Resto Le Comptoir", initials: "RL", color: "#C2410C", value: 900, note: "Site + bot résa" },
                  { client: "Twitch — Korven",   initials: "TK", color: "#7C3AED", value: 150, note: "Bot custom /mois" } ],
    discussion: [ { client: "Agence Pixel",      initials: "AP", color: "#C2410C", value: 290, note: "Upsell Studio" },
                  { client: "GuildeMMO",         initials: "G",  color: "#3E8E3E", value: 130, note: "Modération /mois" } ],
    won:        [ { client: "Maison Verte",      initials: "MV", color: "#8B5E34", value: 260, note: "Studio annuel" },
                  { client: "TechStart",         initials: "T",  color: "#B58900", value: 180, note: "Renouvellement" } ],
    lost:       [ { client: "OldServ",           initials: "O",  color: "#94A3B8", value: 120, note: "Pas donné suite" } ],
  },

  /* Activité récente (fil des derniers mouvements). */
  activity: [
    { kind: "won",     title: "Maison Verte a signé",   detail: "Studio annuel · +260 €/mois",     when: "il y a 2 j" },
    { kind: "upsell",  title: "Agence Pixel — upsell",  detail: "passée en Studio · +120 €/mois",  when: "il y a 4 j" },
    { kind: "new",     title: "Léa Photographe",        detail: "nouveau client Site · +40 €/mois", when: "il y a 6 j" },
    { kind: "churn",   title: "OldServ a résilié",      detail: "Custom · −120 €/mois",             when: "la semaine dernière" },
  ],
};
