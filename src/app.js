import Memory from "./memory.js";
import Telegram from "./telegram.js";

// set encryption key (could be user-provided)
Memory.setEncryptionKey("my super duper very strong password/key"); // fill in password

// save some memory
Memory.saveMemory("settings", {
    telegramToken: "xxxx",
    defaultChat: -1001234567890
});

// load memory
Memory.loadMemory("settings").then(data => {
    console.log("Loaded memory:", data);
});

// Example telegram usage
Telegram.setToken("token"); // fill in bot token
Telegram.sendMessage("@channel", "Hello wolrd from distro!"); // fill in channel
