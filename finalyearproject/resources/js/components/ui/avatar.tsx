import * as React from "react"

import { cn } from "@/lib/utils"

type AvatarStatus = "idle" | "loaded" | "error"

type AvatarContextValue = {
  status: AvatarStatus
  setStatus: React.Dispatch<React.SetStateAction<AvatarStatus>>
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null)

function Avatar({
  children,
  className,
  ...props
}: React.ComponentProps<"span">) {
  const [status, setStatus] = React.useState<AvatarStatus>("idle")

  return (
    <AvatarContext.Provider value={{ status, setStatus }}>
      <span
        data-slot="avatar"
        className={cn(
          "relative flex size-8 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {children}
      </span>
    </AvatarContext.Provider>
  )
}

function AvatarImage({
  className,
  referrerPolicy,
  onLoad,
  onError,
  ...props
}: React.ComponentProps<"img">) {
  const context = React.useContext(AvatarContext)

  if (!context) {
    return null
  }

  return (
    <img
      data-slot="avatar-image"
      className={cn("absolute inset-0 aspect-square size-full", className)}
      referrerPolicy={referrerPolicy ?? "no-referrer"}
      onLoad={(event) => {
        context.setStatus("loaded")
        onLoad?.(event)
      }}
      onError={(event) => {
        context.setStatus("error")
        onError?.(event)
      }}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const context = React.useContext(AvatarContext)

  if (context?.status === "loaded") {
    return null
  }

  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
