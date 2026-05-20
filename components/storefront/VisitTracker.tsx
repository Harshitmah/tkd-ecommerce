"use client"

import * as React from "react"
import { recordVisit } from "@/app/actions/analytics"
import { nanoid } from "nanoid"

export function VisitTracker() {
  React.useEffect(() => {
    // 1. Ensure this only runs on the client
    if (typeof window === "undefined") return
    
    // 2. Check if we already recorded a visit in this session
    const isVisitLogged = sessionStorage.getItem("visit_logged")
    if (isVisitLogged === "true") return

    const trackImmediateVisit = async () => {
      try {
        // Generate or retrieve a persistent session ID for the session
        let sessionId = sessionStorage.getItem("visit_session_id")
        if (!sessionId) {
          sessionId = nanoid(10)
          sessionStorage.setItem("visit_session_id", sessionId)
        }

        // Record visit in database via Server Action
        const result = await recordVisit(sessionId)
        if (result.success) {
          sessionStorage.setItem("visit_logged", "true")
          console.log("Storefront visit tracked successfully!")
        } else {
          console.error("Failed to track visit:", result.error)
        }
      } catch (err) {
        console.error("Error in visit tracking:", err)
      }
    }

    trackImmediateVisit()
  }, [])

  return null // Invisible helper component
}

