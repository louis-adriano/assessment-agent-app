import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: "healthy", message: "Database connection successful" }
  } catch (error) {
    return { status: "error", message: "Database connection failed" }
  }
}

async function getSystemInfo() {
  try {
    const userCount = await prisma.user.count()
    const courseCount = await prisma.course.count()
    const questionCount = await prisma.question.count()
    
    return {
      userCount,
      courseCount,
      questionCount,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return null
  }
}

export default async function HealthPage() {
  const dbStatus = await checkDatabaseConnection()
  const systemInfo = await getSystemInfo()

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Assessment Agent Health Check</h1>
          <p className="text-muted-foreground mt-2">System status and diagnostics</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
            <CardDescription>PostgreSQL database connectivity status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={dbStatus.status === "healthy" ? "default" : "destructive"}>
                {dbStatus.status === "healthy" ? "Healthy" : "Error"}
              </Badge>
              <span className="text-sm text-muted-foreground">{dbStatus.message}</span>
            </div>
          </CardContent>
        </Card>

        {systemInfo && (
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>Current system data overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemInfo.userCount}</div>
                  <div className="text-sm text-muted-foreground">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemInfo.courseCount}</div>
                  <div className="text-sm text-muted-foreground">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{systemInfo.questionCount}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground text-center">
                Last updated: {new Date(systemInfo.timestamp).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>Current runtime environment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Node.js Version:</span>
                <span className="font-mono">{process.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <Badge variant="outline">{process.env.NODE_ENV}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Database:</span>
                <span>PostgreSQL (Neon)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}