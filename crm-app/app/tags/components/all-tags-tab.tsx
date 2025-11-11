"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { api } from "@/lib/api";

export function AllTagsTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => api.getTags(),
  });

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
        <div className="py-8 text-center text-sm text-slate-500">Laddar...</div>
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
