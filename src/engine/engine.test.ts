import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AttackTokenPool,
  CategoryMemoryBudgeter,
  FixedPointQ16,
  FramePacingProbe,
  LAYER_54_SYSTEMS_MANIFEST,
  SectorOriginRebaser,
  TaskGraphScheduler,
  VirtualTileCache,
  evaluateDiurnalClimate,
  getPredictedStreamingChunks500m,
  scanPixelBufferToSprite,
  simplifyMeshAutoLod,
  solveTwoBoneIK,
  validateMeshAndAsset
} from './architecture12Layers';
import { AiMcpAgent } from './aiMcpAgent';
import { BytecodeVm } from './bytecodeVm';
import { Generators } from './generators';
import { isValidMove, validateMoveBounds } from './qolbuCore';
import { QolbuSpace3DMath } from './qolbuSpace3D';
import { SceneHierarchy } from './sceneHierarchy';
import { StorageRepository } from './storageRepository';

test('BytecodeVm compiles extended opcodes, runs loops with CMP/JZ/JMP/STORE/LOAD, and disassembles hex', () => {
  const src = [
    '# Counter loop using CMP + JZ + JMP + STORE/LOAD',
    'SET 3',
    'MUL 2',
    'STORE 4',
    'LOAD 4',
    'CMP 6',
    'JZ 7',
    'ADD 99',
    'EMIT 12',
    'SAY 77',
    'END'
  ].join('\n');

  const compiled = BytecodeVm.compileBytecode(src);
  assert.equal(compiled.errors.length, 0);
  assert.equal(compiled.instructions.length, 10);

  const disasm = BytecodeVm.disassembleBytecode(compiled.instructions);
  assert.equal(disasm.length, 10);
  assert.match(disasm[0], /^00: 0x[0-9A-F]{4}\s+SET 3$/);
  assert.match(disasm[4], /CMP 6$/);

  const res = BytecodeVm.runBytecodeVm(compiled.instructions);
  assert.equal(res.halted, true);
  assert.equal(res.registers[0], 6); // jumped over ADD 99 because CMP 6 set zeroFlag
  assert.equal(res.memory[4], 6);
  assert.equal(res.registers[4], 12);
  assert.equal(res.registers[1], 77);
  assert.equal(res.log.length, 2);
});

test('BytecodeVm MPAK7 RLE packing roundtrips cleanly across Unicode & JSON', () => {
  const sample = JSON.stringify({
    title: 'Bowo: Penjaga Cahaya',
    palette: ['#0b1221', '#38bdf8', '#38bdf8', '#38bdf8'],
    notes: 'AAAAAAAAAAAABBBBBBBB'
  });
  const packed = BytecodeVm.packRleBytes(sample);
  assert.equal(packed.header, 'MPAK7');
  assert.ok(packed.packedBytes > 5);
  assert.equal(BytecodeVm.unpackRleBytes(packed.bytes), sample);
  assert.equal(BytecodeVm.unpackRleBytes(new Uint8Array([1, 2, 3])), '');
});

test('StorageRepository computes FNV-1a checksums, detects tampering, and clamps migrated v6 saves', () => {
  const payload = StorageRepository.buildSavePayload({
    slotId: '1',
    gameTitle: 'Bowo Test',
    level: 2,
    hp: 88,
    energy: 75,
    coins: 120,
    shards: 3,
    score: 1450,
    kills: 5,
    potions: 1,
    styleId: 'cyberpunk'
  });
  const validParsed = StorageRepository.parseAndMigrateSave(JSON.stringify(payload), '1');
  assert.equal(validParsed.checksumValid, true);
  assert.equal(validParsed.migrated, false);

  const tampered = { ...payload, coins: 9999 };
  const tamperedParsed = StorageRepository.parseAndMigrateSave(JSON.stringify(tampered), '1');
  assert.equal(tamperedParsed.checksumValid, false);

  const legacyV6 = JSON.stringify({ version: '6.1.0', chapter: 9, hp: 999, coins: -5, score: 500 });
  const migrated = StorageRepository.parseAndMigrateSave(legacyV6, '2');
  assert.equal(migrated.migrated, true);
  assert.equal(migrated.data.level, 3);
  assert.equal(migrated.data.hp, 100);
  assert.equal(migrated.data.coins, 0);
});

test('QolbuCore isValidMove and validateMoveBounds reject NaN/Infinity and clamp teleportation', () => {
  assert.equal(isValidMove(100, 100, Number.NaN, 100), false);
  assert.equal(isValidMove(100, 100, Number.POSITIVE_INFINITY, 100), false);
  assert.equal(isValidMove(100, 100, 180, 120), true);
  assert.equal(isValidMove(100, 100, 900, 100), false);

  const [nx, ny, ok] = validateMoveBounds(100, 100, Number.NaN, 200);
  assert.equal(ok, false);
  assert.equal(nx, 100);
  assert.equal(ny, 100);

  const [cx, cy, okTel] = validateMoveBounds(100, 100, 600, 100);
  assert.equal(okTel, false);
  assert.ok(cx <= 340.01 && cx >= 339.99);
  assert.equal(cy, 100);
});

test('FramePacingProbe tracks avg/p95/worst/longFrames50Ms and resets properly on markPaused', () => {
  const probe = new FramePacingProbe(32);
  let t = 1000;
  probe.record(t);
  for (let i = 0; i < 10; i++) {
    t += i === 5 ? 64 : 16;
    probe.record(t);
  }
  // Pause skips big wall-clock gap
  probe.markPaused();
  t += 5000;
  probe.record(t);
  t += 16;
  probe.record(t);

  const report = probe.getReport();
  assert.equal(report.samples, 11);
  assert.equal(report.longFrames50Ms, 1);
  assert.equal(report.worstMs, 64);
  assert.ok(report.estimatedFps > 30 && report.estimatedFps <= 65);
});

test('QolbuSpace3DMath handles Fake3D clip/NaN guards, Isometric roundtrip, and deterministic depth sorting', () => {
  const cam = { x: 0, y: 1.5, z: -5, yawRad: 0, focal: 280, near: 0.25 };
  const ahead = QolbuSpace3DMath.projectFake3D(2, 1.5, 5, cam, 320, 240);
  assert.equal(ahead.visible, true);
  assert.ok(ahead.sx > 160);

  const behind = QolbuSpace3DMath.projectFake3D(0, 1.5, -10, cam, 320, 240);
  assert.equal(behind.visible, false);

  const invalid = QolbuSpace3DMath.projectFake3D(Number.NaN, 0, 5, cam, 320, 240);
  assert.equal(invalid.visible, false);

  const iso = QolbuSpace3DMath.projectIsometric(4, 0, 2, 48, 24, 200, 100);
  const back = QolbuSpace3DMath.unprojectIsometric(iso.sx, iso.sy, 48, 24, 200, 100);
  assert.ok(Math.abs(back.wx - 4) < 1e-6);
  assert.ok(Math.abs(back.wz - 2) < 1e-6);

  const items = [
    { x: 5, y: 0, z: 5, id: 2 },
    { x: 5, y: 0, z: 5, id: 1 },
    { x: 1, y: 0, z: 2, id: 3 }
  ];
  const sorted = [...items].sort(QolbuSpace3DMath.compareDepth);
  assert.deepEqual(sorted.map((s) => s.id), [3, 1, 2]);
});

test('Layer 0 FixedPointQ16 replay is deterministic & SectorOriginRebaser preserves offsets across 1km boundaries', () => {
  const inputs = [
    { mx: 1, jump: false },
    { mx: 1, jump: true },
    { mx: 0.5, jump: false },
    { mx: -0.25, jump: false }
  ];
  const runA = FixedPointQ16.stepDeterministicTrajectory(707, inputs);
  const runB = FixedPointQ16.stepDeterministicTrajectory(707, inputs);
  const runDiffSeed = FixedPointQ16.stepDeterministicTrajectory(909, inputs);
  assert.deepEqual(runA, runB);
  assert.notEqual(runA.checksum, runDiffSeed.checksum);

  const rebaser = new SectorOriginRebaser(1000);
  const a = rebaser.normalize({ sectorX: 0, sectorZ: 0, localX: 1520, localY: 2, localZ: -640 });
  assert.equal(a.sectorX, 2);
  assert.equal(a.sectorZ, -1);
  assert.equal(a.localX, -480);
  assert.equal(a.localZ, 360);

  const b = { sectorX: 2, sectorZ: -1, localX: -470, localY: 5, localZ: 365 };
  const rel = rebaser.relativeOffset(a, b);
  assert.equal(rel.dx, 10);
  assert.equal(rel.dy, 3);
  assert.equal(rel.dz, 5);
});

test('Layer 0 TaskGraphScheduler, CategoryMemoryBudgeter & Layer 1..5 kernels validate budgets cleanly', () => {
  const dag = TaskGraphScheduler.plan(TaskGraphScheduler.DEFAULT_FRAME_DAG, 8);
  assert.equal(dag.hasCycle, false);
  assert.equal(dag.workerCap, 4); // mobile capped at 4
  assert.equal(dag.order[0], 'input_sample');
  assert.equal(dag.order[dag.order.length - 1], 'render_culled_pass');

  const budget = new CategoryMemoryBudgeter('eco');
  assert.equal(budget.allocate('textures', 8000), true);
  assert.equal(budget.allocate('textures', 10000), false); // exceeds 16384KB eco cap
  budget.release('textures', 4000);
  assert.equal(budget.allocate('textures', 10000), true);

  const rgba = new Uint8ClampedArray(4 * 4 * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = 64;
    rgba[i + 1] = 192;
    rgba[i + 2] = 224;
    rgba[i + 3] = 255;
  }
  const sprite = scanPixelBufferToSprite(rgba, 4, 4, 16);
  assert.equal(sprite.grid.length, 16);
  assert.equal(sprite.heightmap.length, 16);
  assert.ok(sprite.palette.length >= 1 && sprite.palette.length <= 16);

  const tileCache = new VirtualTileCache(8);
  assert.equal(tileCache.requestTile(0, 0, 0), false);
  assert.equal(tileCache.requestTile(0, 0, 0), true);

  const ik = solveTwoBoneIK(0, 0, 18, 12, 12, 12, 1);
  assert.ok(Math.hypot(ik.endX - 18, ik.endY - 12) < 0.05);

  const pool = new AttackTokenPool(2);
  assert.equal(pool.tryAcquire(1), true);
  assert.equal(pool.tryAcquire(2), true);
  assert.equal(pool.tryAcquire(3), false);
  pool.release(1);
  assert.equal(pool.tryAcquire(3), true);

  const chunks = getPredictedStreamingChunks500m(0, 0, 0, 0);
  assert.equal(chunks.length, 9);
  const climate = evaluateDiurnalClimate(12, 'Hujan');
  assert.equal(climate.fogDensity, 0.35);
  assert.ok(LAYER_54_SYSTEMS_MANIFEST.length >= 30);

  const tris = Array.from({ length: 12 }, () => ({ a: 0, b: 1, c: 2, color: '#38bdf8' }));
  const verts = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }
  ];
  const lod = simplifyMeshAutoLod(tris);
  assert.equal(lod.lod0Count, 12);
  assert.equal(lod.lod1Count, 6);
  assert.equal(lod.lod2Count, 3);
  assert.equal(validateMeshAndAsset(verts, tris).valid, true);
  assert.equal(validateMeshAndAsset([{ x: Number.NaN, y: 0, z: 0 }, verts[1], verts[2]], tris).valid, false);
});

test('SceneHierarchy group/transform keep-world math & overlap detection stay accurate', () => {
  const initial = SceneHierarchy.createDefaultSceneEntities(1);
  const [grouped, grpId] = SceneHierarchy.groupEntitiesIntoContainer(
    initial,
    ['ent_bowo', 'ent_luma'],
    'Hero Duo'
  );
  assert.ok(grpId !== null);
  const moved = SceneHierarchy.updateEntityTransform(grouped, grpId!, { newX: 200, newY: 160 });
  const bowo = moved.find((e) => e.id === 'ent_bowo')!;
  const luma = moved.find((e) => e.id === 'ent_luma')!;
  // Both children preserve offset relative to container
  assert.ok(bowo.x > luma.x);
  assert.ok(bowo.y > luma.y);
  const overlaps = SceneHierarchy.detectEntityOverlaps(moved);
  assert.ok(Array.isArray(overlaps));
});

test('AiMcpAgent.runMultiAgentGameForge produces 6 passing agents and Itel A70 compliant bundle', () => {
  const bundle = AiMcpAgent.runMultiAgentGameForge('Neon cyberpunk cyberpunk mech runner', {
    renderMode: '3D-Stack',
    styleId: 'cyberpunk'
  });
  assert.equal(bundle.agentSteps.length, 6);
  assert.equal(bundle.blueprint.budgetReport.passesA70, true);
  assert.ok(bundle.blueprint.budgetReport.drawCallsEst <= 35);
  assert.ok(bundle.seoTags.includes('<meta property="og:title"'));
  const vmTest = BytecodeVm.runBytecodeVm(BytecodeVm.compileBytecode(bundle.bytecodeSrc).instructions);
  assert.equal(vmTest.halted, true);
});

test('Generators.buildStandalonePlayableHtml escapes XSS payloads cleanly', () => {
  const html = Generators.buildStandalonePlayableHtml({
    title: '</script><script>alert(1)</script>"Test',
    genreId: 'platformer',
    stylePalette: ['#0b1221', '#38bdf8', '#34d399'],
    level: 1,
    bytecodeSrc: 'SET 10\nEND'
  });
  assert.equal(html.includes('</script><script>alert(1)'), false);
  assert.ok(html.includes('\\u003c/script\\u003e'));
  assert.ok(html.includes('canvas'));
});
