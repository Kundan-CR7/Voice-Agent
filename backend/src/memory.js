import fs from "fs"

const FILE = "./conversation_memory.json"

export function loadMemory() {
    if(!fs.existsSync(FILE)) return {}
    return JSON.parse(fs.readFileSync(FILE, "utf8"))
}

export function saveMemory(memory) {
    fs.writeFileSync(FILE, JSON.stringify(memory, null, 2))
}
