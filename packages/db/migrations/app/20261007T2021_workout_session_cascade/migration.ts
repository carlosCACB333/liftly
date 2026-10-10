#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8b074b4b0b06b12f77490afa7797acb8be1628b2e66fa4cf73caf69732097438/contract';
import endContract from '../../snapshots/8b074b4b0b06b12f77490afa7797acb8be1628b2e66fa4cf73caf69732097438/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/aab2521ef15a782cf7ab5fb1a33830a3240a4d14909facef5f49ff32fe6b5fc2/contract';
import startContract from '../../snapshots/aab2521ef15a782cf7ab5fb1a33830a3240a4d14909facef5f49ff32fe6b5fc2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      rawSql({
        id: 'data_migration.delete_orphan_workout_sessions',
        label: 'Delete workout sessions with a missing plan or plan session',
        operationClass: 'data',
        target: { id: 'postgres' },
        precheck: [
          {
            description: 'ensure table "workout_session" exists',
            sql: 'SELECT (to_regclass($1)) IS NOT NULL AS "result"',
            params: ['"public"."workout_session"'],
          },
        ],
        execute: [
          {
            description: 'delete workout sessions whose plan or plan session was removed',
            sql: 'DELETE FROM "public"."workout_session" WHERE "planId" IS NULL OR "planSessionId" IS NULL',
            params: [],
          },
        ],
        postcheck: [
          {
            description: 'verify no orphan workout sessions remain',
            sql: 'SELECT NOT EXISTS (SELECT 1 FROM "public"."workout_session" WHERE "planId" IS NULL OR "planSessionId" IS NULL) AS "result"',
            params: [],
          },
        ],
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'workout_session',
        constraint: 'workout_session_planId_fkey',
        kind: 'foreignKey',
      }),
      this.setNotNull({
        schema: 'public',
        table: 'workout_session',
        column: 'planId',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'workout_session',
        constraint: 'workout_session_planSessionId_fkey',
        kind: 'foreignKey',
      }),
      this.setNotNull({
        schema: 'public',
        table: 'workout_session',
        column: 'planSessionId',
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workout_session',
        foreignKey: {
          name: 'workout_session_planId_fkey',
          columns: ['planId'],
          references: {
            schema: 'public',
            table: 'training_plan',
            columns: ['id'],
          },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'workout_session',
        foreignKey: {
          name: 'workout_session_planSessionId_fkey',
          columns: ['planSessionId'],
          references: {
            schema: 'public',
            table: 'plan_session',
            columns: ['id'],
          },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
