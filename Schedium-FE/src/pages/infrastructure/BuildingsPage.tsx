import { Card } from '@/design-system/components'

export function BuildingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edificios</h1>
        <p className="text-muted-foreground">Gestión de edificios</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Edificios está en desarrollo
        </p>
      </Card>
    </div>
  )
}