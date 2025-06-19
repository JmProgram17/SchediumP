import { Card } from '@/design-system/components'

export function LevelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Niveles</h1>
        <p className="text-muted-foreground">Gestión de niveles académicos</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Niveles está en desarrollo
        </p>
      </Card>
    </div>
  )
}