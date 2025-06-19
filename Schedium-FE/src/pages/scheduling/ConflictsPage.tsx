import { Card } from '@/design-system/components'

export function ConflictsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conflictos</h1>
        <p className="text-muted-foreground">Resolución de conflictos de horarios</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Conflictos está en desarrollo
        </p>
      </Card>
    </div>
  )
}