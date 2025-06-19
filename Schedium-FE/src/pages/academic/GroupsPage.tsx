import { Card } from '@/design-system/components'

export function GroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grupos</h1>
        <p className="text-muted-foreground">Gestión de grupos académicos</p>
      </div>
      
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          El módulo de Grupos está en desarrollo
        </p>
      </Card>
    </div>
  )
}