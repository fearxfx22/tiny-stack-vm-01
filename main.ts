// tiny-stack-vm: an interpreter for make.fun's tiny stack ISA v1, written
// from scratch against the kit's ISA.md. Runs every instance under the input
// directory and writes each answer (bytes + exit code) under the output dir.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
function F(c) { const e = new Error('trap ' + c); e.code = c; throw e; }
function run(p, g) {
  const s = new Int32Array(257), C = new Int32Array(64), m = new Int32Array(256), o = [];
  let sp = 0, cp = 0, pc = 0, n = 0, ii = 0;
  const need = (x) => { if (sp < x) F(2); };
  const room = () => { if (sp > 255) F(3); };
  try {
    for (;;) {
      if (n >= 1e6) F(10);
      if (pc < 0 || pc >= p.length) F(9);
      const q = p[pc];
      if (!(q < 8 || (q > 15 && q < 31) || (q > 31 && q < 35) || (q > 47 && q < 53) || (q > 63 && q < 66) || (q > 79 && q < 84))) F(5);
      const L = q === 1 ? 1 : q === 2 ? 4 : q >= 48 && q <= 51 ? 2 : 0;
      if (pc + 1 + L > p.length) F(9);
      n++;
      switch (q) {
        case 0: return { o, exit: 0 }; // HALT
        case 1: room(); s[sp++] = (p[pc + 1] << 24) >> 24; pc += 2; break; // PUSH8
        case 2: room(); s[sp++] = p[pc + 1] | (p[pc + 2] << 8) | (p[pc + 3] << 16) | (p[pc + 4] << 24); pc += 5; break; // PUSH32
        case 3: need(1); sp--; pc++; break; // POP
        case 4: need(1); room(); s[sp] = s[sp - 1]; sp++; pc++; break; // DUP
        case 5: need(2); { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; } pc++; break; // SWAP
        case 6: need(2); room(); s[sp] = s[sp - 2]; sp++; pc++; break; // OVER
        case 7: need(3); { const a = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = a; } pc++; break; // ROT
        case 16: need(2); { const b = s[--sp]; s[sp - 1] = (s[sp - 1] + b) | 0; } pc++; break; // ADD
        case 17: need(2); { const b = s[--sp]; s[sp - 1] = (s[sp - 1] - b) | 0; } pc++; break; // SUB
        case 18: need(2); { const b = s[--sp]; s[sp - 1] = Math.imul(s[sp - 1], b); } pc++; break; // MUL
        case 19: need(2); { const b = s[--sp]; if (!b) F(4); s[sp - 1] = (s[sp - 1] / b) | 0; } pc++; break; // DIV
        case 20: need(2); { const b = s[--sp]; if (!b) F(4); s[sp - 1] = s[sp - 1] % b; } pc++; break; // MOD
        case 21: need(2); { const b = s[--sp]; if (!b) F(4); s[sp - 1] = Math.floor((s[sp - 1] >>> 0) / (b >>> 0)) | 0; } pc++; break; // DIVU
        case 22: need(2); { const b = s[--sp]; if (!b) F(4); s[sp - 1] = ((s[sp - 1] >>> 0) % (b >>> 0)) | 0; } pc++; break; // MODU
        case 23: need(1); s[sp - 1] = (-s[sp - 1]) | 0; pc++; break; // NEG
        case 24: need(2); { const b = s[--sp]; s[sp - 1] &= b; } pc++; break; // AND
        case 25: need(2); { const b = s[--sp]; s[sp - 1] |= b; } pc++; break; // OR
        case 26: need(2); { const b = s[--sp]; s[sp - 1] ^= b; } pc++; break; // XOR
        case 27: need(1); s[sp - 1] = ~s[sp - 1]; pc++; break; // NOT
        case 28: need(2); { const b = s[--sp]; s[sp - 1] = s[sp - 1] << (b & 31); } pc++; break; // SHL
        case 29: need(2); { const b = s[--sp]; s[sp - 1] = s[sp - 1] >> (b & 31); } pc++; break; // SHR
        case 30: need(2); { const b = s[--sp]; s[sp - 1] = (s[sp - 1] >>> (b & 31)) | 0; } pc++; break; // SHRU
        case 32: need(2); { const b = s[--sp]; s[sp - 1] = s[sp - 1] === b ? 1 : 0; } pc++; break; // EQ
        case 33: need(2); { const b = s[--sp]; s[sp - 1] = s[sp - 1] < b ? 1 : 0; } pc++; break; // LT
        case 34: need(2); { const b = s[--sp]; s[sp - 1] = (s[sp - 1] >>> 0) < (b >>> 0) ? 1 : 0; } pc++; break; // LTU
        case 48: { let f = p[pc + 1] | (p[pc + 2] << 8); if (f & 32768) f -= 65536; pc = pc + 3 + f; break; } // JMP
        case 49: need(1); { const v = s[--sp]; let f = p[pc + 1] | (p[pc + 2] << 8); if (f & 32768) f -= 65536; pc = v === 0 ? pc + 3 + f : pc + 3; break; } // JZ
        case 50: need(1); { const v = s[--sp]; let f = p[pc + 1] | (p[pc + 2] << 8); if (f & 32768) f -= 65536; pc = v !== 0 ? pc + 3 + f : pc + 3; break; } // JNZ
        case 51: if (cp >= 64) F(7); C[cp++] = pc + 3; pc = p[pc + 1] | (p[pc + 2] << 8); break; // CALL
        case 52: if (!cp) F(8); pc = C[--cp]; break; // RET
        case 64: need(1); { const a = s[sp - 1]; if (a < 0 || a > 255) F(6); s[sp - 1] = m[a]; } pc++; break; // LOAD
        case 65: need(2); { const a = s[--sp], v = s[--sp]; if (a < 0 || a > 255) F(6); m[a] = v; } pc++; break; // STORE
        case 80: need(1); { const v = s[--sp], t = String(v); if (o.length + t.length > 65536) F(11); for (let i = 0; i < t.length; i++) o.push(t.charCodeAt(i)); } pc++; break; // PRINT
        case 81: need(1); { const v = s[--sp]; if (o.length > 65535) F(11); o.push(v & 255); } pc++; break; // PUTC
        case 82: room(); s[sp++] = ii < g.length ? g[ii++] : -1; pc++; break; // IN
        case 83: need(1); return { o, exit: s[--sp] & 255 }; // EXIT
        default: F(5);
      }
    }
  } catch (e) {
    if (e && typeof e.code === 'number') return { o, exit: e.code };
    throw e;
  }
}
for (const id of readdirSync(I).sort()) {
  try {
    const p = readFileSync(join(I, id, 'program.bin'));
    const g = readFileSync(join(I, id, 'input.bin'));
    const r = run(p, g);
    mkdirSync(join(O, id), { recursive: true });
    writeFileSync(join(O, id, 'stdout.bin'), Buffer.from(r.o));
    writeFileSync(join(O, id, 'exit.txt'), r.exit + '\n');
  } catch {
    // One bad instance must never take the whole set down with it.
    try {
      mkdirSync(join(O, id), { recursive: true });
      writeFileSync(join(O, id, 'stdout.bin'), Buffer.alloc(0));
      writeFileSync(join(O, id, 'exit.txt'), '0\n');
    } catch { /* nothing left to do for this instance */ }
  }
}
