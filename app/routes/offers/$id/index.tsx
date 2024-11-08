import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/offers/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  return 'Hello /offers/$id/!'
}
