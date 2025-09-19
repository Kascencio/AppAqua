import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function MonitoreoLoading() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array(7)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
