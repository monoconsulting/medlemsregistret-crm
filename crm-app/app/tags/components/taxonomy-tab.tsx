"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, ArrowRight, InfoIcon, Loader2, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function TaxonomyTab() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAlias, setNewAlias] = useState("");
  const [newCanonical, setNewCanonical] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [aliases, setAliases] = useState<Array<{
    id: string;
    alias: string;
    canonical: string;
    category: string | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadAliases = useCallback(async () => {
    try {
      const data = await api.getTagAliases();
      setAliases(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fel vid laddning",
        description: error instanceof Error ? error.message : "Kunde inte ladda aliases",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAliases();
  }, [loadAliases]);

  const handleCreate = async () => {
    if (!newAlias.trim() || !newCanonical.trim()) {
      toast({
        variant: "destructive",
        title: "Validering misslyckades",
        description: "Alias och kanonisk form krävs",
      });
      return;
    }

    setIsCreating(true);
    try {
      await api.createTagAlias(newAlias.trim(), newCanonical.trim(), newCategory.trim() || undefined);
      toast({
        title: "Alias skapad",
        description: `${newAlias} → ${newCanonical}`,
      });
      setIsAddOpen(false);
      setNewAlias("");
      setNewCanonical("");
      setNewCategory("");
      await loadAliases();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fel vid skapande",
        description: error instanceof Error ? error.message : "Kunde inte skapa alias",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (item: { id: string; alias: string; canonical: string; category: string | null }) => {
    setEditingId(item.id);
    setNewAlias(item.alias);
    setNewCanonical(item.canonical);
    setNewCategory(item.category || "");
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !newAlias.trim() || !newCanonical.trim()) {
      toast({
        variant: "destructive",
        title: "Validering misslyckades",
        description: "Alias och kanonisk form krävs",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await api.updateTagAlias(editingId, newAlias.trim(), newCanonical.trim(), newCategory.trim() || undefined);
      toast({
        title: "Alias uppdaterad",
        description: `${newAlias} → ${newCanonical}`,
      });
      setIsEditOpen(false);
      setEditingId(null);
      setNewAlias("");
      setNewCanonical("");
      setNewCategory("");
      await loadAliases();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fel vid uppdatering",
        description: error instanceof Error ? error.message : "Kunde inte uppdatera alias",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string, alias: string) => {
    if (!confirm(`Vill du ta bort alias "${alias}"?`)) return;

    setIsDeleting(id);
    try {
      await api.deleteTagAlias(id);
      toast({
        title: "Alias borttagen",
      });
      await loadAliases();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fel vid borttagning",
        description: error instanceof Error ? error.message : "Kunde inte ta bort alias",
      });
    } finally {
      setIsDeleting(null);
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
          Taxonomi-aliases används för att normalisera stavningsvarianter. T.ex. &quot;matcher&quot; → &quot;match&quot;, &quot;fotbolls-match&quot; → &quot;match&quot;.
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
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Skapar...
                  </>
                ) : (
                  "Skapa"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redigera alias</DialogTitle>
              <DialogDescription>
                Uppdatera mappning från stavningsvariant till kanonisk form
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-alias">Alias (stavningsvariant)</Label>
                <Input
                  id="edit-alias"
                  placeholder="t.ex. matcher"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-canonical">Kanonisk form</Label>
                <Input
                  id="edit-canonical"
                  placeholder="t.ex. match"
                  value={newCanonical}
                  onChange={(e) => setNewCanonical(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategori (valfritt)</Label>
                <Input
                  id="edit-category"
                  placeholder="t.ex. sport"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Avbryt
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uppdaterar...
                  </>
                ) : (
                  "Uppdatera"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-500">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        title="Redigera"
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.alias)}
                        disabled={isDeleting === item.id}
                        title="Ta bort"
                      >
                        {isDeleting === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
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
