#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/6b2dc0d099534d644d306e5fff12094c92aba9bc9d1acd7dd010750cc81d2875/contract';
import startContract from '../../snapshots/6b2dc0d099534d644d306e5fff12094c92aba9bc9d1acd7dd010750cc81d2875/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/7f10e6d087f2bde1959884757010587cfad8093cf8a1841875716c15bece841c/contract';
import endContract from '../../snapshots/7f10e6d087f2bde1959884757010587cfad8093cf8a1841875716c15bece841c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@internal/postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'plan_exercise',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('durationMin', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('muscleGroup', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('repsMax', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('repsMin', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('restMin', 'int4', {
            notNull: true,
            default: lit(4),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('sessionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sets', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('weightUnit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('weightValue', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'plan_like',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('planId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'plan_session',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('planId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'training_plan',
        columns: [
          col('copiedFromAuthorName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('copiedFromName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('copiedFromPlanId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('likeCount', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('draft'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('visibility', 'text', {
            notNull: true,
            default: lit('private'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'workout_session',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('planAuthorNameSnapshot', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('planNameSnapshot', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('planSessionId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sessionNameSnapshot', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('startedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'plan_exercise',
        constraint: 'plan_exercise_sessionId_position_key',
        columns: ['sessionId', 'position'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'plan_like',
        constraint: 'plan_like_planId_userId_key',
        columns: ['planId', 'userId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'plan_session',
        constraint: 'plan_session_planId_position_key',
        columns: ['planId', 'position'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'plan_exercise',
        index: 'plan_exercise_muscleGroup_idx_6d1a61bc',
        columns: ['muscleGroup'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'plan_exercise',
        index: 'plan_exercise_sessionId_idx_29f415d4',
        columns: ['sessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'plan_like',
        index: 'plan_like_planId_idx_5b32079a',
        columns: ['planId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'plan_like',
        index: 'plan_like_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'plan_session',
        index: 'plan_session_planId_idx_5b32079a',
        columns: ['planId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'training_plan',
        index: 'training_plan_copiedFromPlanId_idx_63db67fa',
        columns: ['copiedFromPlanId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'training_plan',
        index: 'training_plan_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'training_plan',
        index: 'training_plan_visibility_idx_01c0466b',
        columns: ['visibility'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workout_session',
        index: 'workout_session_planSessionId_idx_b3863d24',
        columns: ['planSessionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'workout_session',
        index: 'workout_session_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'plan_exercise',
        foreignKey: {
          name: 'plan_exercise_sessionId_fkey',
          columns: ['sessionId'],
          references: { schema: 'public', table: 'plan_session', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'plan_like',
        foreignKey: {
          name: 'plan_like_planId_fkey',
          columns: ['planId'],
          references: { schema: 'public', table: 'training_plan', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'plan_like',
        foreignKey: {
          name: 'plan_like_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'plan_session',
        foreignKey: {
          name: 'plan_session_planId_fkey',
          columns: ['planId'],
          references: { schema: 'public', table: 'training_plan', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'training_plan',
        foreignKey: {
          name: 'training_plan_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'training_plan',
        foreignKey: {
          name: 'training_plan_copiedFromPlanId_fkey',
          columns: ['copiedFromPlanId'],
          references: { schema: 'public', table: 'training_plan', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workout_session',
        foreignKey: {
          name: 'workout_session_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workout_session',
        foreignKey: {
          name: 'workout_session_planSessionId_fkey',
          columns: ['planSessionId'],
          references: { schema: 'public', table: 'plan_session', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
