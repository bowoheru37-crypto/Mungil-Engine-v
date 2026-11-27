export const BytecodeOpcodes = {
  NOP: 0x0,
  SET: 0x1,
  ADD: 0x2,
  SUB: 0x3,
  SAY: 0x4,
  SPAWN: 0x5,
  MUL: 0x6,
  CMP: 0x7,
  JMP: 0x8,
  JZ: 0x9,
  LOAD: 0xa,
  STORE: 0xb,
  EMIT: 0xc,
  END: 0xf
} as const;

const OPCODE_NAMES: Record<number, string> = {
  [BytecodeOpcodes.NOP]: 'NOP',
  [BytecodeOpcodes.SET]: 'SET',
  [BytecodeOpcodes.ADD]: 'ADD',
  [BytecodeOpcodes.SUB]: 'SUB',
  [BytecodeOpcodes.SAY]: 'SAY',
  [BytecodeOpcodes.SPAWN]: 'SPAWN',
  [BytecodeOpcodes.MUL]: 'MUL',
  [BytecodeOpcodes.CMP]: 'CMP',
  [BytecodeOpcodes.JMP]: 'JMP',
  [BytecodeOpcodes.JZ]: 'JZ',
  [BytecodeOpcodes.LOAD]: 'LOAD',
  [BytecodeOpcodes.STORE]: 'STORE',
  [BytecodeOpcodes.EMIT]: 'EMIT',
  [BytecodeOpcodes.END]: 'END'
};

export interface CompiledBytecode {
  instructions: number[];
  errors: string[];
}

export interface BytecodeVmResult {
  halted: boolean;
  steps: number;
  zeroFlag: boolean;
  registers: number[];
  memory: number[];
  log: string[];
}

export interface SeedWorldTile {
  x: number;
  y: number;
  kind: string;
}

export interface SeedWorldResult {
  seed: number;
  biome: string;
  difficulty: number;
  tiles: SeedWorldTile[];
}

export interface RlePackResult {
  header: string;
  originalBytes: number;
  packedBytes: number;
  ratioPct: number;
  bytes: Uint8Array;
}

export const BytecodeVm = {
  compileBytecode(source: string): CompiledBytecode {
    const lines = source
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));
    const words: number[] = [];
    const errors: string[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(/\s+/);
      const opName = parts[0].toUpperCase();
      const rawArg = parts[1];
      const arg = rawArg !== undefined && /^-?\d+$/.test(rawArg) ? parseInt(rawArg, 10) : 0;
      if (arg < 0 || arg > 0x0fff) {
        errors.push(`Line ${idx + 1}: operand ${arg} out of 12-bit range (0..4095)`);
        return;
      }
      let opCode: number;
      switch (opName) {
        case 'NOP':
          opCode = BytecodeOpcodes.NOP;
          break;
        case 'SET':
          opCode = BytecodeOpcodes.SET;
          break;
        case 'ADD':
          opCode = BytecodeOpcodes.ADD;
          break;
        case 'SUB':
          opCode = BytecodeOpcodes.SUB;
          break;
        case 'SAY':
          opCode = BytecodeOpcodes.SAY;
          break;
        case 'SPAWN':
          opCode = BytecodeOpcodes.SPAWN;
          break;
        case 'MUL':
          opCode = BytecodeOpcodes.MUL;
          break;
        case 'CMP':
          opCode = BytecodeOpcodes.CMP;
          break;
        case 'JMP':
          opCode = BytecodeOpcodes.JMP;
          break;
        case 'JZ':
          opCode = BytecodeOpcodes.JZ;
          break;
        case 'LOAD':
          opCode = BytecodeOpcodes.LOAD;
          break;
        case 'STORE':
          opCode = BytecodeOpcodes.STORE;
          break;
        case 'EMIT':
          opCode = BytecodeOpcodes.EMIT;
          break;
        case 'END':
        case 'HALT':
          opCode = BytecodeOpcodes.END;
          break;
        default:
          errors.push(`Line ${idx + 1}: unknown opcode ${opName}`);
          return;
      }
      words.push(((opCode & 0xf) << 12) | (arg & 0x0fff));
    });

    return { instructions: words, errors };
  },

  disassembleBytecode(instructions: number[]): string[] {
    return instructions.map((word, idx) => {
      const op = (word >>> 12) & 0xf;
      const arg = word & 0x0fff;
      const name = OPCODE_NAMES[op] ?? `OP_${op}`;
      const hex = word.toString(16).toUpperCase().padStart(4, '0');
      return `${idx.toString().padStart(2, '0')}: 0x${hex}  ${name} ${arg}`;
    });
  },

  runBytecodeVm(instructions: number[], maxSteps = 256): BytecodeVmResult {
    const regs = new Array<number>(16).fill(0);
    const memory = new Array<number>(64).fill(0);
    const log: string[] = [];
    let pc = 0;
    let steps = 0;
    let halted = false;
    let zeroFlag = false;

    while (pc < instructions.length && steps < maxSteps) {
      const word = instructions[pc++];
      const op = (word >>> 12) & 0xf;
      const arg = word & 0x0fff;
      steps++;
      switch (op) {
        case BytecodeOpcodes.NOP:
          break;
        case BytecodeOpcodes.SET:
          regs[0] = arg;
          zeroFlag = regs[0] === 0;
          break;
        case BytecodeOpcodes.ADD:
          regs[0] += arg;
          zeroFlag = regs[0] === 0;
          break;
        case BytecodeOpcodes.SUB:
          regs[0] -= arg;
          zeroFlag = regs[0] === 0;
          break;
        case BytecodeOpcodes.MUL:
          regs[0] *= arg;
          zeroFlag = regs[0] === 0;
          break;
        case BytecodeOpcodes.CMP:
          zeroFlag = regs[0] === arg;
          regs[3] = regs[0] - arg;
          break;
        case BytecodeOpcodes.JMP:
          pc = Math.min(instructions.length, Math.max(0, arg));
          break;
        case BytecodeOpcodes.JZ:
          if (zeroFlag) pc = Math.min(instructions.length, Math.max(0, arg));
          break;
        case BytecodeOpcodes.LOAD:
          regs[0] = memory[arg % memory.length] ?? 0;
          zeroFlag = regs[0] === 0;
          break;
        case BytecodeOpcodes.STORE:
          memory[arg % memory.length] = regs[0];
          break;
        case BytecodeOpcodes.SAY:
          regs[1] = arg;
          log.push(`SAY #${arg} (R0=${regs[0]})`);
          break;
        case BytecodeOpcodes.SPAWN:
          regs[2] += arg;
          log.push(`SPAWN entity x${arg} (total R2=${regs[2]})`);
          break;
        case BytecodeOpcodes.EMIT:
          regs[4] = arg;
          log.push(`EMIT event #${arg} (R0=${regs[0]})`);
          break;
        case BytecodeOpcodes.END:
          halted = true;
          pc = instructions.length;
          break;
      }
    }
    return { halted, steps, zeroFlag, registers: regs, memory, log };
  },

  createSeedRng(seed: number): () => number {
    let state = (seed | 0) === 0 ? 0x6d2b79f5 : seed | 0;
    return () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    };
  },

  generateSeedWorld(seed: number): SeedWorldResult {
    const rng = this.createSeedRng(seed);
    const biomes = ['Desa Fajar', 'Jembatan Badai', 'Menara Kala'];
    const biome = biomes[Math.min(2, Math.max(0, Math.floor(rng() * biomes.length)))];
    const difficulty = 1 + Math.floor(rng() * 5);
    const tiles: SeedWorldTile[] = [];
    for (let i = 0; i < 12; i++) {
      let kind = 'platform';
      if (i === 0) kind = 'spawn';
      else if (i === 11) kind = 'gate';
      else if (rng() < 0.28) kind = 'shard';
      else if (rng() < 0.55) kind = 'enemy';
      tiles.push({ x: i * 64, y: 180 + Math.floor(rng() * 90), kind });
    }
    return { seed, biome, difficulty, tiles };
  },

  computeChecksum(text: string): string {
    let hash = 0x811c9dc5;
    const bytes = new TextEncoder().encode(text);
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i] & 0xff;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  },

  packRleBytes(input: string): RlePackResult {
    const raw = new TextEncoder().encode(input);
    const out: number[] = [];
    const header = new TextEncoder().encode('MPAK7');
    header.forEach((b) => out.push(b));
    let i = 0;
    while (i < raw.length) {
      const b = raw[i];
      let run = 1;
      while (i + run < raw.length && raw[i + run] === b && run < 255) {
        run++;
      }
      out.push(run);
      out.push(b);
      i += run;
    }
    const packed = new Uint8Array(out);
    const ratioPct = raw.length === 0 ? 100 : Math.floor((packed.length * 100) / raw.length);
    return {
      header: 'MPAK7',
      originalBytes: raw.length,
      packedBytes: packed.length,
      ratioPct,
      bytes: packed
    };
  },

  unpackRleBytes(packed: Uint8Array): string {
    if (packed.length < 5) return '';
    const magic = new TextDecoder().decode(packed.slice(0, 5));
    if (magic !== 'MPAK7') return '';
    const out: number[] = [];
    let i = 5;
    while (i + 1 < packed.length) {
      const count = packed[i] & 0xff;
      const value = packed[i + 1];
      for (let c = 0; c < count; c++) {
        out.push(value);
      }
      i += 2;
    }
    return new TextDecoder().decode(new Uint8Array(out));
  }
};

export const MungilEngineApi = {
  runCommandSummary(command: string): string {
    const trimmed = command.trim();
    if (trimmed.startsWith('E.create')) return `Spawned entity via ${trimmed}`;
    if (trimmed.startsWith('E.move')) return `Displaced actor via ${trimmed}`;
    if (trimmed.startsWith('E.on')) return `Bound No-Code event rule via ${trimmed}`;
    if (trimmed.startsWith('E.playSound')) return `Triggered Web Audio SFX via ${trimmed}`;
    if (trimmed.startsWith('E.setMode')) return `Switched render pipeline via ${trimmed}`;
    if (trimmed.startsWith('E.setPhysics')) return `Applied physics profile via ${trimmed}`;
    if (trimmed.startsWith('E.cameraShake')) return `Queued camera impulse via ${trimmed}`;
    return `Executed MungilE command: ${trimmed}`;
  }
};
