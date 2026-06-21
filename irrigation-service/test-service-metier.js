require('dotenv').config();
const IrrigationService = require('./src/services/irrigation.service');
const { initializeDatabase } = require('./src/config/db');
async function testServiceMetier() {
  try {
    console.log("🚀 Initialisation DB...");
    await initializeDatabase();

    const parcelId = 31;

    console.log("\n🧠 Lancement calcul irrigation...");

    const result = await IrrigationService.calculateIrrigation(parcelId);

    console.log("\n✅ Résultat du calcul:");
    console.log(JSON.stringify(result, null, 2));

    console.log("\n🔍 Vérification sauvegarde DB...");

    const history = await IrrigationService.getRecommendationHistory(parcelId, 30);

    console.log(`📊 ${history.length} recommandations trouvées`);

    if (history.length > 0) {
      console.log("\n📌 Dernière recommandation:");
      console.log(JSON.stringify(history[0], null, 2));
    }

    console.log("\n🎉 TEST SERVICE MÉTIER RÉUSSI");

    process.exit(0);

  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

testServiceMetier();