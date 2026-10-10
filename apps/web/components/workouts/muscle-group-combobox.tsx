"use client"

import { useEffect, useState } from "react"
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
} from "@workspace/ui/components/combobox"
import { MUSCLE_GROUPS, muscleGroupLabel } from "@/lib/domain/exercise"

const MUSCLE_GROUP_VALUES = MUSCLE_GROUPS.map((group) => group.value)

type MuscleGroupComboboxProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
}

export function MuscleGroupCombobox({
  id,
  value,
  onValueChange,
  disabled,
  invalid = false,
}: MuscleGroupComboboxProps) {
  const [text, setText] = useState(() => (value ? muscleGroupLabel(value) : ""))

  useEffect(() => {
    setText(value ? muscleGroupLabel(value) : "")
  }, [value])

  return (
    <Combobox
      items={MUSCLE_GROUP_VALUES}
      value={value || null}
      inputValue={text}
      onInputValueChange={(next) => setText(next)}
      onValueChange={(next) =>
        onValueChange(typeof next === "string" ? next : "")
      }
      itemToStringLabel={(item) =>
        typeof item === "string" ? muscleGroupLabel(item) : ""
      }
      openOnInputClick
      disabled={disabled}
    >
      <ComboboxInputGroup>
        <ComboboxInput
          id={id}
          placeholder="Busca un grupo…"
          aria-invalid={invalid || undefined}
          onBlur={() => {
            if (value !== "" && text !== muscleGroupLabel(value)) {
              onValueChange("")
            }
          }}
        />
        <ComboboxClear />
      </ComboboxInputGroup>
      <ComboboxContent className="max-h-72">
        {(item: string) => (
          <ComboboxItem value={item}>{muscleGroupLabel(item)}</ComboboxItem>
        )}
      </ComboboxContent>
    </Combobox>
  )
}
