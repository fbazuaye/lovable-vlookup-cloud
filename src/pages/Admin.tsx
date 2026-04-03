import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BarChart3, Shield, ArrowLeft, Search } from "lucide-react";

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

interface UsageRow {
  id: string;
  user_id: string | null;
  action_type: string;
  lookup_count: number;
  files_processed: number;
  created_at: string;
}

const Admin = () => {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [analytics, setAnalytics] = useState<UsageRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/", { replace: true });
      toast.error("Access denied: Admin only");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingData(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const roleMap = new Map<string, string[]>();
    roles?.forEach((r: any) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role);
      roleMap.set(r.user_id, existing);
    });

    const merged: UserProfile[] = (profiles || []).map((p: any) => ({
      ...p,
      roles: roleMap.get(p.id) || ["user"],
    }));

    setUsers(merged);
    setLoadingData(false);
  };

  const fetchAnalytics = async () => {
    const { data } = await supabase
      .from("usage_analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setAnalytics((data as UsageRow[]) || []);
  };

  const toggleAdminRole = async (userId: string, currentRoles: string[]) => {
    const hasAdmin = currentRoles.includes("admin");

    if (hasAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Admin role removed");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" as any });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Admin role granted");
    }
    fetchUsers();
  };

  const filteredUsers = users.filter(
    (u) =>
      u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.includes(searchTerm)
  );

  const totalLookups = analytics.reduce((sum, a) => sum + a.lookup_count, 0);
  const totalFiles = analytics.reduce((sum, a) => sum + a.files_processed, 0);

  if (loading || (!isAdmin && !loading)) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage users and view analytics</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{totalLookups}</p>
                <p className="text-sm text-muted-foreground">Total Lookups</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{totalFiles}</p>
                <p className="text-sm text-muted-foreground">Files Processed</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Usage Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                              {(user.display_name || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">
                            {user.display_name || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === "admin" ? "default" : "secondary"}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={user.roles.includes("admin") ? "destructive" : "outline"}
                          onClick={() => toggleAdminRole(user.id, user.roles)}
                        >
                          {user.roles.includes("admin") ? "Remove Admin" : "Make Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {loadingData && <p className="text-center py-4 text-muted-foreground">Loading...</p>}
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Lookups</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No usage data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Badge variant="secondary">{row.action_type}</Badge>
                        </TableCell>
                        <TableCell>{row.lookup_count}</TableCell>
                        <TableCell>{row.files_processed}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(row.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
