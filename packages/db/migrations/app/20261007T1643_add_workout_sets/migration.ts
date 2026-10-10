#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/3420fe3815b9b760fbc1314138927078aaf0b8ad97b6ee7c0719cbf427c349b0/contract';
import startContract from '../../snapshots/3420fe3815b9b760fbc1314138927078aaf0b8ad97b6ee7c0719cbf427c349b0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/aab2521ef15a782cf7ab5fb1a33830a3240a4d14909facef5f49ff32fe6b5fc2/contract';
import endContract from '../../snapshots/aab2521ef15a782cf7ab5fb1a33830a3240a4d14909facef5f49ff32fe6b5fc2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@internal/postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'workout_set',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('durationSec', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('exerciseNameSnapshot', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('exercisePosition', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('muscleGroupSnapshot', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reps', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('setNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('skipped', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('weightUnit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('weightValue', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
          col('workoutSessionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'workout_session',
        column: col('planId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'workout_set',
        constraint: 'workout_set_workoutSessionId_exercisePosition_setNumber_key',
        columns: ['workoutSessionId', 'exercisePosition', 'setNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workout_session',
        index: 'workout_session_planId_idx_5b32079a',
        columns: ['planId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workout_session',
        index: 'workout_session_userId_planId_idx_092164f4',
        columns: ['userId', 'planId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workout_set',
        index: 'workout_set_workoutSessionId_idx_2f96e1dd',
        columns: ['workoutSessionId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workout_session',
        foreignKey: {
          name: 'workout_session_planId_fkey',
          columns: ['planId'],
          references: { schema: 'public', table: 'training_plan', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workout_set',
        foreignKey: {
          name: 'workout_set_workoutSessionId_fkey',
          columns: ['workoutSessionId'],
          references: { schema: 'public', table: 'workout_session', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
