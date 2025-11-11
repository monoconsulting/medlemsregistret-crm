"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export function AllTagsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (error) {
      console.error("Error loading tags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Sök taggar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-500">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          {searchQuery ? "Inga taggar matchade sökningen" : "Inga taggar finns"}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tagg</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge variant="secondary">{tag.name}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {tag.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-slate-500">
            Visar {filteredTags.length} {searchQuery && `av ${tags.length}`} taggar
          </div>
        </>
      )}
    </div>
  );
}
