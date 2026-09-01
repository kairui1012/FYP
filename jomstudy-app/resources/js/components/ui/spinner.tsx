import { reactLang } from "@erag/lang-sync-inertia"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/common-helpers"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { trans } = reactLang()
  return (
    <Loader2Icon
      role="status"
      aria-label={trans("navigation.loading")}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
