#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3ed440c891376b51eb22046d54244900158bcf440b200985c1fea4744cdd6ad8/contract';
import endContract from '../../snapshots/3ed440c891376b51eb22046d54244900158bcf440b200985c1fea4744cdd6ad8/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/7f10e6d087f2bde1959884757010587cfad8093cf8a1841875716c15bece841c/contract';
import startContract from '../../snapshots/7f10e6d087f2bde1959884757010587cfad8093cf8a1841875716c15bece841c/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@internal/postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'plan_exercise',
        column: col('demoUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
