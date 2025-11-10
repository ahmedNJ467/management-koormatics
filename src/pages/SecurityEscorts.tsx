import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { safeArrayResult } from "@/lib/utils/type-guards";

interface Guard {
  id: string;
  name: string;
  phone?: string | null;
  id_number?: string | null;
  rank?: string | null;
  notes?: string | null;
  status?: "active" | "inactive" | "leave" | string | null;
  created_at?: string;
}

interface EscortTeam {
  id: string;
  team_name: string;
  guard_ids: string[];
  vehicle_id?: string | null;
  created_at?: string;
}

interface VehicleRow {
  id: string;
  make?: string | null;
  model?: string | null;
  registration?: string | null;
}

export default function SecurityEscorts() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Data
  const guardsQuery = useQuery({
    queryKey: ["security_guards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_guards")
        .select("id, name, phone, id_number, rank, status, notes, created_at, updated_at")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching security guards:", error);
        throw error;
      }
      return safeArrayResult<Guard>(data);
    },
  });

  const teamsQuery = useQuery({
    queryKey: ["escort_teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escort_teams" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return safeArrayResult<EscortTeam>(data);
    },
  });

  const vehiclesQuery = useQuery({
    queryKey: ["vehicles-basic"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, registration")
        .order("registration", { ascending: true });
      if (error) throw error;
      return safeArrayResult<VehicleRow>(data);
    },
  });

  // Guards add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
  const [editingGuardId, setEditingGuardId] = useState<string | null>(null);
  const [gName, setGName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [gIdNo, setGIdNo] = useState("");
  const [gRank, setGRank] = useState("");
  const [gStatus, setGStatus] = useState("active");
  const [gNotes, setGNotes] = useState("");

  const addGuard = useMutation({
    mutationFn: async () => {
      const payload = {
        name: gName,
        phone: gPhone,
        id_number: gIdNo,
        rank: gRank,
        status: gStatus,
        notes: gNotes,
      };
      if (editingGuardId) {
        const { error } = await supabase
          .from("security_guards" as any)
          .update(payload as any)
          .eq("id", editingGuardId as any);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("security_guards" as any)
        .insert([payload] as any);
      if (error) throw error;
    },
    onSuccess: async () => {
      setAddOpen(false);
      setEditingGuardId(null);
      setGName("");
      setGPhone("");
      setGIdNo("");
      setGRank("");
      setGStatus("active");
      setGNotes("");
      await qc.invalidateQueries({ queryKey: ["security_guards"] });
      toast({ title: "Guard saved" });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to onboard",
        description:
          err?.message || "Table 'security_guards' might be missing.",
        variant: "destructive",
      });
    },
  });

  // Team add dialog state
  const [teamOpen, setTeamOpen] = useState(false);
  const [teamDetailsOpen, setTeamDetailsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<EscortTeam | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamVehicleId, setTeamVehicleId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const usedVehicleIds = useMemo(
    () =>
      new Set(
        (teamsQuery.data || [])
          .map((t) => t.vehicle_id)
          .filter(Boolean) as string[]
      ),
    [teamsQuery.data]
  );

  const availableVehicles = useMemo(() => {
    const all = vehiclesQuery.data || [];
    return all.filter((v) => !usedVehicleIds.has(v.id));
  }, [vehiclesQuery.data, usedVehicleIds]);

  const toggleGuard = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const createTeam = useMutation({
    mutationFn: async () => {
      if (!teamName.trim()) throw new Error("Team requires a name.");
      if (!teamVehicleId) throw new Error("Select a team vehicle.");
      const payload: any = {
        team_name: teamName.trim(),
        guard_ids: selectedIds,
        vehicle_id: teamVehicleId,
      };
      if (editingTeamId) {
        const { error } = await supabase
          .from("escort_teams" as any)
          .update(payload)
          .eq("id", editingTeamId as any);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("escort_teams" as any)
        .insert([payload] as any);
      if (error) throw error;
    },
    onSuccess: async () => {
      setTeamOpen(false);
      setEditingTeamId(null);
      setTeamName("");
      setSelectedIds([]);
      setTeamVehicleId("");
      await qc.invalidateQueries({ queryKey: ["escort_teams"] });
      toast({
        title: "Team saved",
        description: "Team details have been saved.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create team",
        description:
          err?.message ||
          "Table 'escort_teams' might be missing required columns.",
        variant: "destructive",
      });
    },
  });

  // Search & filters
  const [guardQuery, setGuardQuery] = useState("");
  const [guardStatus, setGuardStatus] = useState("all");

  const filteredGuards = useMemo(() => {
    const list = guardsQuery.data || [];
    return list.filter((g) => {
      const matchesQ = [g.name, g.phone, g.rank, g.id_number]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(guardQuery.toLowerCase());
      const matchesS = guardStatus === "all" || g.status === guardStatus;
      return matchesQ && matchesS;
    });
  }, [guardsQuery.data, guardQuery, guardStatus]);

  const [teamQuery, setTeamQuery] = useState("");

  const filteredTeams = useMemo(() => {
    const list = teamsQuery.data || [];
    return list.filter((t) =>
      `${t.team_name}`.toLowerCase().includes(teamQuery.toLowerCase())
    );
  }, [teamsQuery.data, teamQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 px-6 space-y-6">
        {/* Header */}
        <div className="border-b border-border pb-4 pt-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Security Escorts
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage guards and escort teams. One vehicle per team.
            </p>
          </div>
        </div>

        <Tabs defaultValue="guards">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="guards">Guards</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          {/* Guards Tab */}
          <TabsContent value="guards" className="mt-3 space-y-3">
            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="Search guards..."
                  value={guardQuery}
                  onChange={(e) => setGuardQuery(e.target.value)}
                  className="flex-1"
                />
                <Select value={guardStatus} onValueChange={setGuardStatus}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setAddOpen(true)} size="sm">
                Add Guard
              </Button>
            </div>

            {/* Table */}
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filteredGuards || []).map((g) => (
                    <TableRow
                      key={g.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedGuard(g);
                        setDetailsOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell>{g.rank || "-"}</TableCell>
                      <TableCell>{g.phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {g.status || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {g.created_at
                          ? new Date(g.created_at).toLocaleString()
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredGuards.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        {guardsQuery.isError
                          ? "Failed to load guards. Ensure table `security_guards` exists."
                          : "No guards found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-3 space-y-3">
            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="Search teams..."
                  value={teamQuery}
                  onChange={(e) => setTeamQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              <Button onClick={() => setTeamOpen(true)} size="sm">
                Create Team
              </Button>
            </div>

            {/* Table */}
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filteredTeams || []).map((t) => {
                    const members = t.guard_ids
                      .map(
                        (id) =>
                          (guardsQuery.data || []).find((g) => g.id === id)
                            ?.name || id
                      )
                      .join(", ");
                    const vehicle = (vehiclesQuery.data || []).find(
                      (v) => v.id === t.vehicle_id
                    );
                    const vehicleLabel = vehicle
                      ? vehicle.registration ||
                        `${vehicle.make || ""} ${vehicle.model || ""}`
                      : "-";
                    return (
                      <TableRow
                        key={t.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedTeam(t);
                          setTeamDetailsOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          {t.team_name}
                        </TableCell>
                        <TableCell className="text-xs">{members}</TableCell>
                        <TableCell>{vehicleLabel}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t.created_at
                            ? new Date(t.created_at).toLocaleString()
                            : ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredTeams.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        {teamsQuery.isError
                          ? "Failed to load teams. Ensure table `escort_teams` exists."
                          : "No teams found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Guard Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Guard Details</DialogTitle>
              <DialogDescription>Profile overview</DialogDescription>
            </DialogHeader>
            {selectedGuard && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-medium">{selectedGuard.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Phone</div>
                    <div>{selectedGuard.phone || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ID Number</div>
                    <div>{selectedGuard.id_number || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Rank</div>
                    <div>{selectedGuard.rank || "-"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Status</div>
                    <Badge variant="outline">{selectedGuard.status || "-"}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Notes</div>
                  <div>{selectedGuard.notes || "-"}</div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDetailsOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setDetailsOpen(false);
                      setEditingGuardId(selectedGuard.id);
                      setGName(selectedGuard.name || "");
                      setGPhone(selectedGuard.phone || "");
                      setGIdNo(selectedGuard.id_number || "");
                      setGRank(selectedGuard.rank || "");
                      setGStatus((selectedGuard.status as string) || "active");
                      setGNotes(selectedGuard.notes || "");
                      setAddOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Team Details Dialog */}
        <Dialog open={teamDetailsOpen} onOpenChange={setTeamDetailsOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Team Details</DialogTitle>
              <DialogDescription>Team composition</DialogDescription>
            </DialogHeader>
            {selectedTeam && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-muted-foreground">Team Name</div>
                    <div className="font-medium">{selectedTeam.team_name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Vehicle</div>
                    <div>
                      {(vehiclesQuery.data || []).find(
                        (v) => v.id === selectedTeam.vehicle_id
                      )?.registration || "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Members</div>
                  <div>
                    {selectedTeam.guard_ids
                      .map(
                        (id) =>
                          (guardsQuery.data || []).find((g) => g.id === id)
                            ?.name || id
                      )
                      .join(", ") || "-"}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setTeamDetailsOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setTeamDetailsOpen(false);
                      setEditingTeamId(selectedTeam.id);
                      setTeamOpen(true);
                      setTeamName(selectedTeam.team_name);
                      setTeamVehicleId(selectedTeam.vehicle_id || "");
                      setSelectedIds(selectedTeam.guard_ids || []);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Guard Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editingGuardId ? "Edit Guard" : "Onboard Guard"}</DialogTitle>
              <DialogDescription>Enter basic details.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <Input
                placeholder="Full name"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                className="md:col-span-2"
              />
              <Input
                placeholder="Phone"
                value={gPhone}
                onChange={(e) => setGPhone(e.target.value)}
                className="md:col-span-1"
              />
              <Input
                placeholder="ID/Badge No."
                value={gIdNo}
                onChange={(e) => setGIdNo(e.target.value)}
                className="md:col-span-1"
              />
              <Input
                placeholder="Rank/Role"
                value={gRank}
                onChange={(e) => setGRank(e.target.value)}
                className="md:col-span-1"
              />
              <Select value={gStatus} onValueChange={setGStatus}>
                <SelectTrigger className="md:col-span-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Notes"
                value={gNotes}
                onChange={(e) => setGNotes(e.target.value)}
                className="md:col-span-6"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => addGuard.mutate()}
                disabled={!gName.trim() || addGuard.isPending}
              >
                {addGuard.isPending ? "Saving..." : editingGuardId ? "Save Changes" : "Add Guard"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Team Dialog */}
        <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{editingTeamId ? "Edit Team" : "Create Team"}</DialogTitle>
              <DialogDescription>
                Assign a vehicle and select guards.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <Input
                placeholder="Team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="md:col-span-3"
              />
              <Select value={teamVehicleId} onValueChange={setTeamVehicleId}>
                <SelectTrigger className="md:col-span-3">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {(availableVehicles || []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration || `${v.make || ""} ${v.model || ""}`}
                    </SelectItem>
                  ))}
                  {availableVehicles.length === 0 && (
                    <div className="px-2 py-1 text-xs text-muted-foreground">
                      No available vehicles
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Select guards
              </div>
              <div className="flex flex-wrap gap-2">
                {(guardsQuery.data || []).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggleGuard(g.id)}
                    className={`text-xs border rounded px-2 py-1 ${
                      selectedIds.includes(g.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background"
                    }`}
                  >
                    {g.name} {g.rank ? `(${g.rank})` : ""}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs">Selected: {selectedIds.length}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTeamOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createTeam.mutate()}
                disabled={
                  !teamName.trim() || !teamVehicleId || createTeam.isPending
                }
              >
                {createTeam.isPending
                  ? "Saving..."
                  : editingTeamId
                  ? "Save Changes"
                  : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
