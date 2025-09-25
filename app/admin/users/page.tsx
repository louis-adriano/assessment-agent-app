// app/admin/users/page.tsx
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCheck,
  Shield,
  GraduationCap,
  Calendar,
  Mail,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'

async function getUsers() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          createdCourses: true,
          submissions: true,
          enrollments: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const stats = {
    total: users.length,
    superAdmins: users.filter(u => u.role === 'SUPER_ADMIN').length,
    courseAdmins: users.filter(u => u.role === 'COURSE_ADMIN').length,
    students: users.filter(u => u.role === 'STUDENT').length
  }

  return { users, stats }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return <Shield className="h-4 w-4 text-red-600" />
    case 'COURSE_ADMIN':
      return <UserCheck className="h-4 w-4 text-blue-600" />
    case 'STUDENT':
      return <GraduationCap className="h-4 w-4 text-green-600" />
    default:
      return <Users className="h-4 w-4 text-gray-600" />
  }
}

function getRoleColor(role: string) {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'destructive'
    case 'COURSE_ADMIN':
      return 'default'
    case 'STUDENT':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default async function UsersPage() {
  await requireSuperAdmin() // Only super admins can access this page
  
  const { users, stats } = await getUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-gray-600">
            Manage system users and their roles
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.superAdmins}</div>
            <p className="text-xs text-muted-foreground">Full system access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Admins</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.courseAdmins}</div>
            <p className="text-xs text-muted-foreground">Course creators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.students}</div>
            <p className="text-xs text-muted-foreground">Learners</p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            All registered users and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
              <p className="text-gray-600">Add users to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user: any) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getRoleIcon(user.role)}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium">{user.name || 'No Name'}</h4>
                          <Badge variant={getRoleColor(user.role) as any} className="text-xs">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {user._count.createdCourses > 0 && (
                            <span>{user._count.createdCourses} courses created</span>
                          )}
                          
                          {user._count.submissions > 0 && (
                            <span>{user._count.submissions} submissions</span>
                          )}
                          
                          {user._count.enrollments > 0 && (
                            <span>{user._count.enrollments} enrollments</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      {user.role !== 'SUPER_ADMIN' && (
                        <Button variant="outline" size="sm">
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Role Distribution</CardTitle>
          <CardDescription>
            Overview of user roles in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="font-medium">Super Administrators</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{stats.superAdmins} users</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${(stats.superAdmins / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Course Administrators</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{stats.courseAdmins} users</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(stats.courseAdmins / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-green-600" />
                <span className="font-medium">Students</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{stats.students} users</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(stats.students / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}