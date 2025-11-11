"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

export function ReportsTab() {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [data, setData] = useState<{
    items: Array<{
      id: string;
      status: string;
      mode: string;
      source: string;
      startedAt: string;
      completedAt: string | null;
      associationsProcessed: number;
      tagsCreated: number;
      linksCreated: number;
      linksSkipped: number;
      triggeredByName: string;
      reportUrl: string | null;
    }>;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRuns();
  }, [page]);

  const loadRuns = async () => {
    setIsLoading(true);
    try {
      const result = await api.listTagGenerationRuns(pageSize, page * pageSize);
      setData(result);
    } catch (error) {
      console.error("Error loading runs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runs = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Klar
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="mr-1 h-3 w-3" />
            Kör
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="mr-1 h-3 w-3" />
            Misslyckad
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "db:baseline":
        return "Baseline";
      case "db:types":
        return "Typer";
      case "db:activities":
        return "Aktiviteter";
      case "db:categories":
        return "Kategorier";
      default:
        return source;
    }
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="py-8 text-center text-sm text-slate-500">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : runs.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          Inga körningar ännu. Starta en generering från fliken &quot;Generera&quot;.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startad</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Läge</TableHead>
                  <TableHead>Källa</TableHead>
                  <TableHead>Föreningar</TableHead>
                  <TableHead>Taggar</TableHead>
                  <TableHead>Länkar</TableHead>
                  <TableHead>Av</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(run.startedAt), {
                        addSuffix: true,
                        locale: sv,
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell>
                      <Badge variant={run.mode === "execute" ? "default" : "outline"}>
                        {run.mode === "execute" ? "Execute" : "Dry-run"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getSourceLabel(run.source)}</TableCell>
                    <TableCell className="text-sm">{run.associationsProcessed}</TableCell>
                    <TableCell className="text-sm">{run.tagsCreated}</TableCell>
                    <TableCell className="text-sm">
                      {run.linksCreated}
                      {run.linksSkipped > 0 && (
                        <span className="ml-1 text-xs text-slate-400">
                          (+{run.linksSkipped} skip)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {run.triggeredByName}
                    </TableCell>
                    <TableCell>
                      {run.reportUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={run.reportUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                Visar {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} av {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Föregående
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  Nästa
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
