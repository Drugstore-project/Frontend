import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteStaffMember } from "@/app/actions/staff-actions"
import { useRouter } from "next/navigation"

interface Staff {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

interface StaffActivityProps {
  staff: Staff[]
}

export function StaffActivity({ staff }: StaffActivityProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      await deleteStaffMember(id)
      router.refresh()
      // In a real app, we might want to update local state or trigger a refresh callback
      window.location.reload() 
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Members</CardTitle>
      </CardHeader>
      <CardContent>
        {staff.length > 0 ? (
          <div className="space-y-4">
            {staff.map((member) => {
              const initials =
                member.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={member.role === "admin" ? "default" : "secondary"} className="capitalize">
                      {member.role}
                    </Badge>
                    {member.role !== "admin" && member.role !== "owner" && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No staff members found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
