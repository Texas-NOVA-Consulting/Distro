import CryptoUtil from "./crypto.js";

class EncryptedDB {
    constructor(dbName = "BeatSweepDB", storeName = "store") {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.dbName, 1);

            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            req.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };

            req.onerror = (e) => reject(e);
        });
    }

    async set(key, value, encryptionKey) {
        const encrypted = CryptoUtil.encrypt(JSON.stringify(value), encryptionKey);

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readwrite");
            tx.objectStore(this.storeName).put(encrypted, key);
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }

    async get(key, encryptionKey) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readonly");
            const req = tx.objectStore(this.storeName).get(key);

            req.onsuccess = () => {
                if (!req.result) return resolve(null);
                const decrypted = CryptoUtil.decrypt(req.result, encryptionKey);
                resolve(JSON.parse(decrypted));
            };

            req.onerror = reject;
        });
    }

    async delete(key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readwrite");
            tx.objectStore(this.storeName).delete(key);
            tx.oncomplete = resolve;
            tx.onerror = reject;
        });
    }

    async listKeys() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);
            const req = store.getAllKeys();

            req.onsuccess = () => resolve(req.result);
            req.onerror = reject;
        });
    }
}

export default EncryptedDB;
