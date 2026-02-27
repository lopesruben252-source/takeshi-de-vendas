console.log("🚀 Iniciando MegaBot...\n");

// 🚨 Tratamento de erros globais
process.on("uncaughtException", (err) => {
  console.log("\n==============================");
  console.log("🚨 ERRO CRÍTICO");
  console.log("💥 Mensagem:", err.message);
  console.log("📚 Stack:", err.stack);
  console.log("==============================\n");
});

process.on("unhandledRejection", (reason) => {
  console.log("\n==============================");
  console.log("🚨 PROMISE NÃO TRATADA");
  console.log("💥 Motivo:", reason);
  console.log("==============================\n");
});

// 📦 Imports principais
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

// 📁 Seus handlers
const setupMessageHandler = require("./utils/messageHandler");
const setupAutoHandler = require("./utils/onMessage");
const commandValidator = require("./handler/commandValidator");

commandValidator();

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["MegaBot", "Chrome", "1.0.0"]
  });

  // ================================
  // 📡 EVENTOS DO SOCKET
  // ================================

  // 🔄 Conexão
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📱 Escaneie o QR Code abaixo:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Conexão fechada.");
      console.log("🔁 Reconectar?", shouldReconnect);

      if (shouldReconnect) {
        startBot();
      } else {
        console.log("🚫 Sessão encerrada. Escaneie novamente.");
      }
    } 
    else if (connection === "open") {
      console.log("✅ Bot conectado com sucesso!");
    }
  });

  // 💾 Salvar sessão automaticamente
  sock.ev.on("creds.update", saveCreds);

  // 📩 Novas mensagens
  sock.ev.on("messages.upsert", async (m) => {
    try {
      if (!m.messages || !m.messages[0]) return;

      const msg = m.messages[0];

      if (!msg.message) return;
      if (msg.key && msg.key.remoteJid === "status@broadcast") return;

      console.log("📨 Nova mensagem de:", msg.key.remoteJid);

      // Se quiser processar aqui diretamente:
      // await sock.sendMessage(msg.key.remoteJid, { text: "Mensagem recebida!" });

    } catch (err) {
      console.log("❌ Erro ao processar mensagem:", err);
    }
  });

  // 👥 Atualização de participantes
  sock.ev.on("group-participants.update", (data) => {
    console.log("👥 Mudança em grupo:", data);
  });

  // 📢 Atualização de grupos
  sock.ev.on("groups.update", (updates) => {
    console.log("📢 Grupo atualizado:", updates);
  });

  // 📨 Atualização de mensagens (ex: apagadas)
  sock.ev.on("messages.update", (updates) => {
    console.log("✏️ Mensagem atualizada:", updates);
  });

  // 📦 Atualização de chats
  sock.ev.on("chats.update", (updates) => {
    console.log("💬 Chat atualizado:", updates);
  });

  // 🔔 Presença (digitando, online, etc)
  sock.ev.on("presence.update", (update) => {
    console.log("👀 Presença atualizada:", update);
  });

  // ================================
  // 📁 Seus handlers externos
  // ================================

  setupMessageHandler(sock);
  setupAutoHandler(sock);
}

startBot();
