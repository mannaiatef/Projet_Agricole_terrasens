/**
 * CROP KNOWLEDGE BASE (MIGRATED FROM PYTHON)
 * 
 * Autoritative source for all crop-related agronomic data (FAO-56 + field expertise)
 * Supports: Blé, Orge, Maïs, Tomate, Piment, Pomme de terre, Olivier, Vigne
 * 
 * Structure:
 * - crop_name: stages array with actions, alerts, fertilization
 * - Each stage has: duration_days, kc_value, actions, alerts, fertilization
 * - Fertilization includes: type, dose_kg_ha, product, day_from_start
 */

const CROP_KNOWLEDGE_BASE = {
  // =================== BLÉGRAIN (WHEAT) ===================
  'Blé': {
    name_en: 'Wheat',
    total_duration_days: 150,
    stages: [
      {
        number: 1,
        name: 'Germination / Levée',
        duration_days: 15,
        kc_value: 0.30,
        actions: [
          'Surveiller la levée (objectif : >85% de plantes levées)',
          'Irrigation légère si T° > 28°C ou pluie < 10mm la semaine',
          'Ne pas irriguer en excès (risque de fonte du semis)',
          'Contrôle des adventices à la levée'
        ],
        alerts: [
          '⚠️ Si T° < 4°C : risque de gel – couvrir si possible',
          '⚠️ Si pas de pluie en 10 jours : irrigation de démarrage (20 mm)'
        ],
        fertilization: null
      },
      {
        number: 2,
        name: 'Tallage',
        duration_days: 30,
        kc_value: 0.70,
        actions: [
          'Apport d\'azote (N) : 30-40 kg N/ha (urée 46%)',
          'Désherbage chimique ou mécanique',
          'Irrigation si déficit hydrique détecté (stade sensible)'
        ],
        alerts: [
          '⚠️ Surveillance des pucerons et cicadelles',
          '⚠️ Contrôle rouille jaune (Puccinia striiformis)'
        ],
        fertilization: {
          type: 'Azote (N)',
          dose_kg_ha: 35,
          product: 'Urée 46% ou ammonitrate 33%',
          day_from_start: 5
        }
      },
      {
        number: 3,
        name: 'Montaison / Épi 1cm',
        duration_days: 25,
        kc_value: 0.95,
        actions: [
          'Apport d\'azote (N) : 40-50 kg N/ha (2ème fractionnement)',
          'Traitement fongicide préventif si humidité élevée',
          'Irrigation régulière : besoin en eau maximum',
          'Apport de soufre (S) si carence observée'
        ],
        alerts: [
          '⚠️ Stade critique pour la fécondation – éviter le stress hydrique',
          '⚠️ Surveillance fusariose si T° > 20°C avec pluie'
        ],
        fertilization: {
          type: 'Azote + Soufre',
          dose_kg_ha: 45,
          product: 'Ammonitrate soufré ou solution azotée',
          day_from_start: 5
        }
      },
      {
        number: 4,
        name: 'Épiaison / Floraison',
        duration_days: 20,
        kc_value: 1.15,
        actions: [
          'Irrigation critique : + 40-50 mm si pas de pluie',
          'Traitement anti-fusariose si conditions humides (T > 15°C)',
          'Apport potassium si feuilles jaunissantes',
          'Surveillance aphides de l\'épi'
        ],
        alerts: [
          '🚨 Stress hydrique ici = perte de rendement majeure',
          '⚠️ Éviter traitement insecticide pendant la floraison (abeilles)'
        ],
        fertilization: {
          type: 'Potassium (K)',
          dose_kg_ha: 50,
          product: 'Chlorure de potassium ou sulfate de potassium',
          day_from_start: 3
        }
      },
      {
        number: 5,
        name: 'Remplissage du grain',
        duration_days: 30,
        kc_value: 1.00,
        actions: [
          'Réduire progressivement l\'irrigation',
          'Surveillance rouille brune en fin de cycle',
          'Contrôle verse si tige fragilisée'
        ],
        alerts: [
          '⚠️ Si T° > 35°C : échaudage du grain – irriguer la nuit si possible'
        ],
        fertilization: null
      },
      {
        number: 6,
        name: 'Maturation / Récolte',
        duration_days: 20,
        kc_value: 0.40,
        actions: [
          'Arrêt total de l\'irrigation',
          'Préparer le matériel de récolte',
          'Récolter à humidité grain 12-14%',
          'Stocker correctement (ventilation, anti-rongeurs)'
        ],
        alerts: [
          '⚠️ Pluie à maturité = risque de germination sur pied'
        ],
        fertilization: null
      }
    ]
  },

  // =================== ORGE (BARLEY) ===================
  'Orge': {
    name_en: 'Barley',
    total_duration_days: 120,
    stages: [
      {
        number: 1,
        name: 'Germination / Levée',
        duration_days: 12,
        kc_value: 0.30,
        actions: [
          'Surveiller la levée',
          'Irrigation légère si T° > 26°C'
        ],
        alerts: ['⚠️ L\'orge est plus sensible au froid que le blé'],
        fertilization: null
      },
      {
        number: 2,
        name: 'Tallage',
        duration_days: 25,
        kc_value: 0.60,
        actions: [
          'Apport azote : 25-30 kg N/ha',
          'Désherbage',
          'Irrigation légère (30 mm)'
        ],
        alerts: [],
        fertilization: {
          type: 'Azote (N)',
          dose_kg_ha: 28,
          product: 'Urée 46%',
          day_from_start: 5
        }
      },
      {
        number: 3,
        name: 'Montaison / Floraison',
        duration_days: 35,
        kc_value: 1.10,
        actions: [
          'Azote : 30-35 kg/ha (2ème fractionnement)',
          'Irrigation : 40 mm en 2 fois',
          'Traitement fongicide préventif'
        ],
        alerts: ['⚠️ Stade critique – ne pas laisser à sec'],
        fertilization: {
          type: 'Azote',
          dose_kg_ha: 32,
          product: 'Ammonitrate 33%',
          day_from_start: 5
        }
      },
      {
        number: 4,
        name: 'Maturation',
        duration_days: 25,
        kc_value: 0.35,
        actions: [
          'Arrêt irrigation',
          'Récolte à 12% humidité grain'
        ],
        alerts: [],
        fertilization: null
      }
    ]
  },

  // =================== MAÏS (MAIZE) ===================
  'Maïs': {
    name_en: 'Maize',
    total_duration_days: 140,
    stages: [
      {
        number: 1,
        name: 'Semis / Germination',
        duration_days: 10,
        kc_value: 0.30,
        actions: [
          'Maintenir sol humide en surface',
          'Température sol recommandée : > 12°C',
          'Ne pas irriguer en excès (risque asphyxie)'
        ],
        alerts: ['⚠️ Si T° sol < 10°C : retarder le semis'],
        fertilization: null
      },
      {
        number: 2,
        name: '3-6 feuilles',
        duration_days: 20,
        kc_value: 0.50,
        actions: [
          'Apport phosphore starter : 40 kg P2O5/ha',
          'Apport azote de fond : 60 kg N/ha',
          'Désherbage mécanique ou chimique (pré-levée)'
        ],
        alerts: [],
        fertilization: {
          type: 'Phosphore + Azote',
          dose_kg_ha: 100,
          product: 'DAP (18-46-0) + Urée',
          day_from_start: 5
        }
      },
      {
        number: 3,
        name: '6-12 feuilles (croissance végétative)',
        duration_days: 25,
        kc_value: 0.85,
        actions: [
          'Apport azote couverture : 80 kg N/ha',
          'Irrigation progressive (60-70 mm)',
          'Buttage si sol argileux'
        ],
        alerts: ['⚠️ Carence zinc possible – observer jaunissement entre-nervures'],
        fertilization: {
          type: 'Azote couverture',
          dose_kg_ha: 80,
          product: 'Urée 46% ou solution azotée 30%',
          day_from_start: 5
        }
      },
      {
        number: 4,
        name: 'Floraison / Pollinisation',
        duration_days: 15,
        kc_value: 1.20,
        actions: [
          'Irrigation maximale : 60-80 mm',
          'Surveiller pyrales (Ostrinia nubilalis)',
          'Ne pas perturber la pollinisation (éviter traitements)'
        ],
        alerts: [
          '🚨 Le stress hydrique à floraison = perte de 50% rendement',
          '⚠️ T° > 35°C nuit = fertilité du pollen réduite'
        ],
        fertilization: null
      },
      {
        number: 5,
        name: 'Remplissage grain',
        duration_days: 35,
        kc_value: 1.05,
        actions: [
          'Apport potassium : 60 kg K2O/ha',
          'Irrigation régulière (50-60 mm)',
          'Surveillance mycotoxines si temps humide'
        ],
        alerts: [],
        fertilization: {
          type: 'Potassium',
          dose_kg_ha: 60,
          product: 'KCl ou K2SO4',
          day_from_start: 3
        }
      },
      {
        number: 6,
        name: 'Séchage / Récolte',
        duration_days: 30,
        kc_value: 0.60,
        actions: [
          'Arrêt irrigation à 50% lignes de lait visible',
          'Récolter à humidité < 25%',
          'Prévoir séchage artificiel si humide'
        ],
        alerts: [],
        fertilization: null
      }
    ]
  },

  // =================== TOMATE (TOMATO) ===================
  'Tomate': {
    name_en: 'Tomato',
    total_duration_days: 140,
    stages: [
      {
        number: 1,
        name: 'Plantation / Reprise',
        duration_days: 14,
        kc_value: 0.60,
        actions: [
          'Irrigation d\'installation : 25-30 mm',
          'Paillage pour maintenir fraîcheur du sol',
          'Tuteurage des plants si nécessaire',
          'Protection contre chaleur excessive (ombrière)'
        ],
        alerts: ['⚠️ Si T° > 35°C : stress thermique – irriguer en soirée'],
        fertilization: null
      },
      {
        number: 2,
        name: 'Croissance végétative',
        duration_days: 30,
        kc_value: 0.80,
        actions: [
          'Apport phosphore : 50 kg P2O5/ha (enracinement)',
          'Apport azote : 40 kg N/ha',
          'Taille et palissage hebdomadaire',
          'Irrigation goutte-à-goutte : 30-40 mm/semaine'
        ],
        alerts: ['⚠️ Surveiller mildiou si humidité > 70%'],
        fertilization: {
          type: 'Phosphore + Azote',
          dose_kg_ha: 90,
          product: 'DAP + Nitrate d\'ammonium',
          day_from_start: 10
        }
      },
      {
        number: 3,
        name: 'Floraison',
        duration_days: 25,
        kc_value: 1.00,
        actions: [
          'Apport potassium : 60-80 kg K2O/ha (nouaison)',
          'Apport calcium foliaire (prévention BER)',
          'Vibration florale pour aider la pollinisation',
          'Irrigation régulière : éviter alternance sec/humide (éclatement)'
        ],
        alerts: [
          '⚠️ T° nuit < 10°C = mauvaise nouaison',
          '⚠️ T° jour > 38°C = avortement floral',
          '🚨 Surveiller Botrytis et Oïdium'
        ],
        fertilization: {
          type: 'Potassium + Calcium',
          dose_kg_ha: 70,
          product: 'Nitrate de potassium + Nitrate de calcium',
          day_from_start: 5
        }
      },
      {
        number: 4,
        name: 'Grossissement des fruits',
        duration_days: 35,
        kc_value: 1.15,
        actions: [
          'Maintenir irrigation régulière (40-50 mm/semaine)',
          'Apport potassium continu',
          'Effeuillage progressif pour aérer',
          'Traitement contre Tetranyque si T° élevée'
        ],
        alerts: ['⚠️ Stress hydrique = fruits creux, BER'],
        fertilization: null
      },
      {
        number: 5,
        name: 'Maturation / Récolte',
        duration_days: 30,
        kc_value: 0.80,
        actions: [
          'Réduire légèrement l\'irrigation (améliore la qualité gustative)',
          'Récolter tous les 2-3 jours',
          'Contrôler conserva (Botrytis sur tiges coupées)'
        ],
        alerts: [],
        fertilization: null
      }
    ]
  },

  // =================== PIMENT (PEPPER) ===================
  'Piment': {
    name_en: 'Pepper',
    total_duration_days: 154,
    stages: [
      {
        number: 1,
        name: 'Semis 1–2 (Levée)',
        duration_days: 14,
        kc_value: 0.50,
        actions: [
          'Surveiller la levée (T° sol optimale : 22-28°C)',
          'Irrigation légère et fréquente : maintenir sol humide',
          'Si T° > 28°C : irrigation légère quotidienne matin',
          'Protection contre fontes de semis (fongicide préventif)'
        ],
        alerts: [
          '⚠️ T° < 15°C = germination lente',
          '⚠️ T° > 32°C = stress thermique, ombrière conseillée'
        ],
        fertilization: null
      },
      {
        number: 2,
        name: 'Croissance précoce (J15 – Apport phosphore)',
        duration_days: 15,
        kc_value: 0.65,
        actions: [
          'Apport de phosphore (engrais starter) : DAP 18-46-0',
          'Dose : 30-40 kg P2O5/ha appliqué au sol',
          'Irrigation régulière : 20-25 mm/semaine',
          'Installation palissage si variété haute'
        ],
        alerts: [],
        fertilization: {
          type: 'Phosphore (P) – Starter',
          dose_kg_ha: 35,
          product: 'DAP 18-46-0',
          day_from_start: 0
        }
      },
      {
        number: 3,
        name: 'Croissance végétative (J25 – Apport azote)',
        duration_days: 20,
        kc_value: 0.80,
        actions: [
          'Apport d\'azote : 40-50 kg N/ha',
          'Produit recommandé : Urée 46% ou Nitrate d\'ammonium 33%',
          'Irrigation : 30-35 mm/semaine',
          'Binage et désherbage',
          'Pincement de la tige principale si besoin'
        ],
        alerts: ['⚠️ Surveiller pucerons (Aphis gossypii) – vecteurs de virus'],
        fertilization: {
          type: 'Azote (N)',
          dose_kg_ha: 45,
          product: 'Urée 46% ou ammonitrate',
          day_from_start: 0
        }
      },
      {
        number: 4,
        name: 'Floraison – Apport potassium + Surveillance stress',
        duration_days: 25,
        kc_value: 1.00,
        actions: [
          'Apport potassium : 40-60 kg K2O/ha (nouaison et qualité fruit)',
          'Apport calcium foliaire pour prévenir BER des piments',
          'Maintenir irrigation régulière – éviter alternance sec/humide',
          'Surveiller stress hydrique (feuilles légèrement flétries le matin = alarme)'
        ],
        alerts: [
          '🚨 T° nuit < 12°C = mauvaise nouaison / chute de fleurs',
          '⚠️ T° jour > 35°C = avortement floral'
        ],
        fertilization: {
          type: 'Potassium + Calcium',
          dose_kg_ha: 50,
          product: 'Nitrate de potassium + Nitrate de calcium foliaire',
          day_from_start: 5
        }
      },
      {
        number: 5,
        name: 'Grossissement & Coloration des fruits',
        duration_days: 30,
        kc_value: 1.10,
        actions: [
          'Irrigation : 35-45 mm/semaine (besoin maximal)',
          'Apport d\'azote léger : 15-20 kg N/ha si besoin',
          'Contrôle Tetranyques (araignées rouges) si T° > 30°C sec',
          'Effeuillage partiel pour coloration'
        ],
        alerts: ['⚠️ Stress hydrique = fruits déformés, avortement'],
        fertilization: null
      },
      {
        number: 6,
        name: 'Récolte',
        duration_days: 30,
        kc_value: 0.75,
        actions: [
          'Récolter régulièrement (tous les 5-7 jours)',
          'Réduire légèrement l\'irrigation avant récolte (maturité aromatique)',
          'Conserver à 8-12°C pour exportation'
        ],
        alerts: [],
        fertilization: null
      }
    ]
  },

  // =================== POMME DE TERRE (POTATO) ===================
  'Pomme de terre': {
    name_en: 'Potato',
    total_duration_days: 120,
    stages: [
      {
        number: 1,
        name: 'Plantation / Germination',
        duration_days: 20,
        kc_value: 0.50,
        actions: [
          'Plantation de tubercules pré-germés',
          'Sol ameubli et drainé',
          'Irrigation légère si sol sec (20 mm)'
        ],
        alerts: ['⚠️ T° sol < 7°C = germination bloquée'],
        fertilization: {
          type: 'Fumure de fond (P + K)',
          dose_kg_ha: 120,
          product: 'Superphosphate + Chlorure de potassium',
          day_from_start: 0
        }
      },
      {
        number: 2,
        name: 'Levée et début végétation',
        duration_days: 25,
        kc_value: 0.70,
        actions: [
          'Buttage précoce',
          'Apport azote : 60-80 kg N/ha',
          'Irrigation : 30-40 mm/semaine',
          'Traitement préventif mildiou si humide'
        ],
        alerts: ['⚠️ Le mildiou (Phytophthora) est la menace principale'],
        fertilization: {
          type: 'Azote',
          dose_kg_ha: 70,
          product: 'Urée + Ammonitrate',
          day_from_start: 10
        }
      },
      {
        number: 3,
        name: 'Tubérisation',
        duration_days: 30,
        kc_value: 1.10,
        actions: [
          'Irrigation critique : 50-60 mm/semaine',
          'Apport potassium : 80 kg K2O/ha',
          '2ème buttage',
          'Traitements mildiou hebdomadaires'
        ],
        alerts: ['🚨 Stade le plus sensible au stress hydrique'],
        fertilization: {
          type: 'Potassium',
          dose_kg_ha: 80,
          product: 'KCl 60% ou K2SO4',
          day_from_start: 5
        }
      },
      {
        number: 4,
        name: 'Grossissement des tubercules',
        duration_days: 30,
        kc_value: 1.15,
        actions: [
          'Maintenir irrigation régulière',
          'Contrôle des doryphores',
          'Pas d\'azote en cette phase (qualité conservation)'
        ],
        alerts: [],
        fertilization: null
      },
      {
        number: 5,
        name: 'Maturation / Récolte',
        duration_days: 20,
        kc_value: 0.75,
        actions: [
          'Défanage (destruction des fanes) 2-3 semaines avant récolte',
          'Arrêt irrigation 2 semaines avant',
          'Récolter quand peau du tubercule est résistante au frottement'
        ],
        alerts: [],
        fertilization: null
      }
    ]
  },

  // =================== OLIVIER (OLIVE) ===================
  'Olivier': {
    name_en: 'Olive',
    total_duration_days: 240,
    stages: [
      {
        number: 1,
        name: 'Reprise végétative (Printemps)',
        duration_days: 60,
        kc_value: 0.60,
        actions: [
          'Taille de formation ou d\'entretien (mars-avril)',
          'Apport azote : 0.5 kg N/arbre ou 30 kg/ha',
          'Travail du sol (désherbage)',
          'Irrigation de démarrage si hiver sec'
        ],
        alerts: [],
        fertilization: {
          type: 'Azote',
          dose_kg_ha: 30,
          product: 'Ammonitrate ou Urée',
          day_from_start: 15
        }
      },
      {
        number: 2,
        name: 'Floraison',
        duration_days: 30,
        kc_value: 0.65,
        actions: [
          'Pas d\'irrigation excessive (risque chute de fleurs)',
          'Traitement contre Acléris (si observé)',
          'Apport bore foliaire (améliore pollinisation)'
        ],
        alerts: ['⚠️ Pluie et froid pendant floraison = mauvaise nouaison'],
        fertilization: {
          type: 'Bore (B) foliaire',
          dose_kg_ha: 2,
          product: 'Borax ou Borate de sodium',
          day_from_start: 5
        }
      },
      {
        number: 3,
        name: 'Grossissement des olives',
        duration_days: 90,
        kc_value: 0.70,
        actions: [
          'Irrigation localisée : 40-60 mm/mois en été',
          'Traitement contre Mouche de l\'olive (Bactrocera oleae)',
          'Apport phosphore et potassium'
        ],
        alerts: ['⚠️ Surveiller Mouche de l\'olive dès juillet'],
        fertilization: {
          type: 'Phosphore + Potassium',
          dose_kg_ha: 60,
          product: 'KNO3 + P2O5',
          day_from_start: 30
        }
      },
      {
        number: 4,
        name: 'Véraison / Récolte',
        duration_days: 90,
        kc_value: 0.55,
        actions: [
          'Réduire irrigation pendant véraison',
          'Récolte à maturité optimale (selon usage : huile ou table)',
          'Traitement post-récolte du sol'
        ],
        alerts: [],
        fertilization: null
      }
    ]
  },

  // =================== VIGNE (VINE) ===================
  'Vigne': {
    name_en: 'Vine',
    total_duration_days: 185,
    stages: [
      {
        number: 1,
        name: 'Débourrement',
        duration_days: 20,
        kc_value: 0.30,
        actions: [
          'Taille de printemps terminée',
          '1er traitement contre mildiou et oïdium',
          'Travail du sol superficiel'
        ],
        alerts: ['⚠️ Risque gel de printemps jusqu\'à mi-mai'],
        fertilization: {
          type: 'Fumure de fond',
          dose_kg_ha: 40,
          product: 'NPK 10-10-20',
          day_from_start: 5
        }
      },
      {
        number: 2,
        name: 'Croissance végétative',
        duration_days: 40,
        kc_value: 0.60,
        actions: [
          'Palissage des rameaux',
          'Traitements fongiques toutes les 10-12 jours',
          'Apport azote foliaire si carence'
        ],
        alerts: [],
        fertilization: null
      },
      {
        number: 3,
        name: 'Floraison',
        duration_days: 20,
        kc_value: 0.70,
        actions: [
          'Traitement anti-mildiou et oïdium renforcé',
          'Ébourgeonnage et palissage',
          'Pas d\'excès d\'azote (vigueur excessive)'
        ],
        alerts: ['⚠️ Pas de traitements à base de cuivre en pleine floraison'],
        fertilization: null
      },
      {
        number: 4,
        name: 'Grossissement des baies',
        duration_days: 60,
        kc_value: 0.85,
        actions: [
          'Irrigation raisonnée (contrainte modérée = qualité)',
          'Traitement contre Botrytis',
          'Apport potassium'
        ],
        alerts: [],
        fertilization: {
          type: 'Potassium',
          dose_kg_ha: 40,
          product: 'Sulfate de potassium',
          day_from_start: 10
        }
      },
      {
        number: 5,
        name: 'Véraison / Maturation',
        duration_days: 45,
        kc_value: 0.75,
        actions: [
          'Effeuillage pour aérer les grappes',
          'Contrôle de la date de vendange (analyse de maturité)',
          'Dernier traitement anti-Botrytis 21 jours avant récolte'
        ],
        alerts: ['⚠️ Pluie à véraison = risque éclatement des baies'],
        fertilization: null
      },
      {
        number: 6,
        name: 'Vendanges',
        duration_days: 20,
        kc_value: 0.50,
        actions: [
          'Vendanger selon degré Brix optimal (12-14° Brix min pour vin)',
          'Apport amendement post-récolte au sol'
        ],
        alerts: [],
        fertilization: null
      }
    ]
  }
};

// =================== CROP ALIASES ===================
const CROP_ALIASES = {
  // French
  'Blé': 'Blé',
  'Wheat': 'Blé',
  'wheat': 'Blé',
  'Orge': 'Orge',
  'Barley': 'Orge',
  'Maïs': 'Maïs',
  'Maize': 'Maïs',
  'Mais': 'Maïs',
  'Corn': 'Maïs',
  'Tomate': 'Tomate',
  'Tomato': 'Tomate',
  'Piment': 'Piment',
  'Pepper': 'Piment',
  'Pomme de terre': 'Pomme de terre',
  'Potato': 'Pomme de terre',
  'Olivier': 'Olivier',
  'Olive': 'Olivier',
  'Vigne': 'Vigne',
  'Vine': 'Vigne',
  'Grape': 'Vigne',
};

module.exports = { CROP_KNOWLEDGE_BASE, CROP_ALIASES };
