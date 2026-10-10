#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3420fe3815b9b760fbc1314138927078aaf0b8ad97b6ee7c0719cbf427c349b0/contract';
import endContract from '../../snapshots/3420fe3815b9b760fbc1314138927078aaf0b8ad97b6ee7c0719cbf427c349b0/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/3ed440c891376b51eb22046d54244900158bcf440b200985c1fea4744cdd6ad8/contract';
import startContract from '../../snapshots/3ed440c891376b51eb22046d54244900158bcf440b200985c1fea4744cdd6ad8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@internal/postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'plan_exercise', column: 'demoUrl' }),
      this.addColumn({
        schema: 'public',
        table: 'plan_exercise',
        column: col('demoUrls', 'text[]', {
          notNull: true,
          default: lit([]),
          codecRef: { codecId: 'pg/text@1', many: true },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'plan_exercise',
        constraint: 'plan_exercise_demoUrls_elem_not_null_86d48260',
        expression: 'array_position("demoUrls", NULL) IS NULL',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
