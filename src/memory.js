import EncryptedDB from "./indexeddb.js";

class AgentMemory {
    constructor() {
        this.db = new EncryptedDB("BeatSweepMemory", "memory");
        this.ready = this.db.init();
        this.key = null;
    }

    setEncryptionKey(key) {
        this.key = key;
    }

    async saveMemory(namespace, id, data) {
        await this.ready;
        return this.db.set(`${namespace}:${id}`, data, this.key);
    }

    async loadMemory(namespace, id) {
        await this.ready;
        return this.db.get(`${namespace}:${id}`, this.key);
    }
}

export default new AgentMemory();
