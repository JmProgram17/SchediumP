import { Card } from '@/design-system/components'

export function CalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-muted-foreground">Calendario académico</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Calendario está en desarrollo
        </p>
      </Card>
    </div>
  )
}