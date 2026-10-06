import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export type ComingSoonProps = {
  title: string
  description: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <Card>
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", className: "w-full" })}
        >
          Volver a iniciar sesión
        </Link>
      </CardContent>
    </Card>
  )
}