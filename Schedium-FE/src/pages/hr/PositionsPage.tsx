import { Card } from '@/design-system/components'

export function PositionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cargos</h1>
        <p className="text-muted-foreground">Gestión de cargos y roles</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Cargos está en desarrollo
        </p>
      </Card>
    </div>
  )
}