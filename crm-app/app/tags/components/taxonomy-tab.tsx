"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, ArrowRight, InfoIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function TaxonomyTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAlias, setNewAlias] = useState("");
  const [newCanonical, setNewCanonical] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: aliases = [], isLoading } = useQuery({
    queryKey: ["tag-aliases"],
    queryFn: () => api.getTagAliases(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.createTagAlias(newAlias.trim(), newCanonical.trim(), newCategory.trim() || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tag-aliases"] });
      toast({
        title: "Alias skapad",
        description: `${newAlias} → ${newCanonical}`,
      });
      setIsAddOpen(false);
      setNewAlias("");
      setNewCanonical("");
      setNewCategory("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Fel vid skapande",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.deleteTagAlias(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tag-aliases"] });
      toast({
        title: "Alias borttagen",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Fel vid borttagning",
        description: error.message,
      });
    },
  });

  const handleCreate = () => {
    if (!newAlias.trim() || !newCanonical.trim()) {
      toast({
        variant: "destructive",
        title: "Validering misslyckades",
        description: "Alias och kanonisk form krävs",
      });
      return;
    }
    createMutation.mutate();
  };

  const handleDelete = (id: string, alias: string) => {
    if (confirm(`Vill du ta bort alias "${alias}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredAliases = aliases.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.alias.toLowerCase().includes(q) ||
      item.canonical.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Taxonomi-aliases används för att normalisera stavningsvarianter. T.ex. "matcher" → "match", "fotbolls-match" → "match".
          Alla aliases konverteras till gemener automatiskt.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Sök aliases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Lägg till alias
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till alias</DialogTitle>
              <DialogDescription>
                Skapa en mappning från stavningsvariant till kanonisk form
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="alias">Alias (stavningsvariant)</Label>
                <Input
                  id="alias"
                  placeholder="t.ex. matcher"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonical">Kanonisk form</Label>
                <Input
                  id="canonical"
                  placeholder="t.ex. match"
                  value={newCanonical}
                  onChange={(e) => setNewCanonical(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori (valfritt)</Label>
                <Input
                  id="category"
                  placeholder="t.ex. sport"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                Skapa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-500">Laddar...</div>
      ) : filteredAliases.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          {searchQuery ? "Inga aliases matchade sökningen" : "Inga aliases ännu"}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias</TableHead>
                <TableHead />
                <TableHead>Kanonisk form</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAliases.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.alias}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </TableCell>
                  <TableCell>{item.canonical}</TableCell>
                  <TableCell>
                    {item.category ? (
                      <Badge variant="secondary">{item.category}</Badge>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id, item.alias)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-sm text-slate-500">
        Totalt: {filteredAliases.length} {searchQuery && `av ${aliases.length}`} alias
      </div>
    </div>
  );
}
