import { Card } from '@/design-system/components'

export function CampusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sedes</h1>
        <p className="text-muted-foreground">Gestión de sedes institucionales</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Sedes está en desarrollo
        </p>
      </Card>
    </div>
  )
}