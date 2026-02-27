function logError(commandName, error, msg) {
  console.log("\n==============================");
  console.log("❌ ERRO DETECTADO");
  console.log("📌 Comando:", commandName);
  console.log("💥 Mensagem:", error.message);
  console.log("📚 Stack:", error.stack);
  console.log("==============================\n");
}

module.exports = logError;
