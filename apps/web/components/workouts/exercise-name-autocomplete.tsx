"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2Icon, SearchIcon } from "lucide-react"
import {
  Combobox,
  ComboboxClear,
  ComboboxContent,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
} from "@workspace/ui/components/combobox"
import { searchPublicExercisesAction } from "@/lib/actions/exercises"
import type { ExerciseSuggestion } from "@/lib/data/exercises"
import { muscleGroupLabel } from "@/lib/domain/exercise"

const MIN_TERM_LENGTH = 2
const DEBOUNCE_MS = 250

type ExerciseNameInputProps = {
  id: string
  value: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  onInputChange: (value: string) => void
  onApply: (suggestion: ExerciseSuggestion) => void
}

export function ExerciseNameInput({
  id,
  value,
  placeholder,
  disabled,
  invalid = false,
  onInputChange,
  onApply,
}: ExerciseNameInputProps) {
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const requestRef = useRef(0)

  useEffect(() => {
    return () => {
      if (debounceRef.current !== undefined) clearTimeout(debounceRef.current)
    }
  }, [])

  function runSearch(query: string) {
    if (debounceRef.current !== undefined) clearTimeout(debounceRef.current)
    const term = query.trim()
    if (term.length < MIN_TERM_LENGTH) {
      requestRef.current += 1
      setSuggestions([])
      setSearching(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestRef.current
      const results = await searchPublicExercisesAction(term)
      if (requestId === requestRef.current) {
        setSuggestions(results)
        setSearching(false)
      }
    }, DEBOUNCE_MS)
  }

  const termLength = value.trim().length

  return (
    <Combobox
      inputValue={value}
      onInputValueChange={(next, details) => {
        onInputChange(next)
        if (
          details.reason === "input-change" ||
          next.trim().length < MIN_TERM_LENGTH
        ) {
          runSearch(next)
        }
      }}
      onValueChange={(suggestion) => {
        if (suggestion) onApply(suggestion)
      }}
      itemToStringLabel={(suggestion: ExerciseSuggestion) => suggestion.name}
      openOnInputClick
      disabled={disabled}
    >
      <ComboboxInputGroup className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className="pl-8"
        />
        <ComboboxClear className="absolute top-1/2 right-1 -translate-y-1/2" />
      </ComboboxInputGroup>
      <ComboboxContent className="max-h-72">
        {suggestions.map((suggestion) => (
          <ComboboxItem key={suggestion.id} value={suggestion}>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate">{suggestion.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {muscleGroupLabel(suggestion.muscleGroup)}
                {suggestion.sets ? ` · ${suggestion.sets} series` : ""}
                {suggestion.weightValue != null
                  ? ` · ${suggestion.weightValue} ${suggestion.weightUnit ?? "kg"}`
                  : ""}
              </span>
            </span>
          </ComboboxItem>
        ))}
        {suggestions.length === 0 ? (
          <li
            role="status"
            className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground"
          >
            {searching ? (
              <>
                <Loader2Icon className="size-4 shrink-0 animate-spin" />
                Buscando ejercicios…
              </>
            ) : termLength >= MIN_TERM_LENGTH ? (
              "Sin resultados"
            ) : (
              "Escribe al menos 2 caracteres…"
            )}
          </li>
        ) : null}
      </ComboboxContent>
    </Combobox>
  )
}
