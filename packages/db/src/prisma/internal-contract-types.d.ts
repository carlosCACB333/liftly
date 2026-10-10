import type { Contract as BaseContract, StorageBase } from "@prisma/orm-framework/contract/types"

export type Contract<TStorage = StorageBase> = BaseContract<
  [TStorage] extends [StorageBase] ? TStorage : StorageBase
>
export type {
  ExecutionHashBase,
  NamespaceId,
  ProfileHashBase,
  StorageHashBase,
} from "@prisma/orm-framework/contract/types"
