"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Play, Database, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ExecutionMode = "dry-run" | "execute";
type DataSource = "db:baseline" | "db:types" | "db:activities" | "db:categories";

interface JobStatus {
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
  reportUrl: string | null;
  reportPath?: string | null;
  summary: {
    totalAssociations?: number | null;
    processedAssociations?: number | null;
    progressPercent?: number | null;
    updatedAt?: string;
  } | null;
  totalAssociations: number | null;
  progressPercent: number | null;
  errors: string[];
  triggeredBy?: string;
  triggeredByName?: string;
}

export function TagGenerationTab() {
  const { toast } = useToast();
  const [mode, setMode] = useState<ExecutionMode>("dry-run");
  const [source, setSource] = useState<DataSource>("db:baseline");
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const startPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await api.getTagGenerationStatus(jobId);
        setJobStatus(status);
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
          if (status.status === "completed") {
            toast({
              title: "Generering klar",
              description: `Skapade ${status.tagsCreated} taggar, ${status.linksCreated} nya länkar`,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Generering misslyckades",
              description: status.errors.join(", ") || "Okänt fel",
            });
          }
        }
      } catch (error) {
        clearInterval(interval);
        console.error("Polling error:", error);
      }
    }, 2000);
  };

  const handleTrigger = async () => {
    if (mode === "execute") {
      const confirmed = confirm(
        "Detta kommer att ändra databasen! Säker på att du vill köra i execute-läge?"
      );
      if (!confirmed) return;
    }

    setIsTriggering(true);
    try {
      const data = await api.triggerTagGeneration(mode, source);
      toast({
        title: "Taggenerering startad",
        description: `Jobb ${data.jobId} startad i ${mode === "dry-run" ? "dry-run" : "execute"} läge`,
      });
      setJobStatus({
        id: data.jobId,
        status: "running",
        mode: data.mode,
        source: data.source,
        startedAt: new Date().toISOString(),
        completedAt: null,
        associationsProcessed: 0,
        tagsCreated: 0,
        linksCreated: 0,
        linksSkipped: 0,
        reportUrl: null,
        summary: null,
        totalAssociations: null,
        progressPercent: null,
        errors: [],
      });
      startPolling(data.jobId);
    } catch (error) {
      let errorMessage = "Okänt fel";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Special handling for common auth errors
        if (errorMessage.toLowerCase().includes("not authenticated")) {
          errorMessage = "Du är inte inloggad. Vänligen logga in igen.";
        } else if (errorMessage.toLowerCase().includes("admin role required") || errorMessage.toLowerCase().includes("forbidden")) {
          errorMessage = "Du saknar behörighet. Endast administratörer kan starta taggenerering.";
        }
      }
      toast({
        variant: "destructive",
        title: "Fel vid start",
        description: errorMessage,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const isRunning = jobStatus?.status === "running" || isTriggering;
  const totalAssociations =
    jobStatus?.totalAssociations ??
    jobStatus?.summary?.totalAssociations ??
    null;
  const processedAssociations = jobStatus?.associationsProcessed ?? 0;
  const calculatedPercent =
    totalAssociations && totalAssociations > 0
      ? (processedAssociations / totalAssociations) * 100
      : null;
  const progressPercent =
    jobStatus?.progressPercent ?? (calculatedPercent !== null ? Math.min(100, Math.max(0, Number(calculatedPercent.toFixed(1)))) : null);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Körläge</Label>
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as ExecutionMode)} disabled={isRunning}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dry-run" id="mode-dry-run" />
              <Label htmlFor="mode-dry-run" className="font-normal">
                Dry-run (förhandsgranskning, inga ändringar)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="execute" id="mode-execute" />
              <Label htmlFor="mode-execute" className="font-normal">
                Execute (genomför ändringar i databasen)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="source-select">Datakälla</Label>
          <Select value={source} onValueChange={(v) => setSource(v as DataSource)} disabled={isRunning}>
            <SelectTrigger id="source-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="db:baseline">Baseline (alla fält)</SelectItem>
              <SelectItem value="db:types">Endast typer</SelectItem>
              <SelectItem value="db:activities">Endast aktiviteter</SelectItem>
              <SelectItem value="db:categories">Endast kategorier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "execute" && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>OBS:</strong> Execute-läge skapar en fullständig databas-backup innan körning.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleTrigger}
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kör...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Starta generering
            </>
          )}
        </Button>
      </div>

      {jobStatus && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Status</h3>
            {jobStatus.status === "running" && (
              <span className="flex items-center gap-2 text-sm text-blue-600">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                Kör...
              </span>
            )}
            {jobStatus.status === "completed" && (
              <span className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Klar
              </span>
            )}
            {jobStatus.status === "failed" && (
              <span className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                Misslyckades
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Totalt antal föreningar</span>
              <span className="font-semibold">
                {totalAssociations !== null ? totalAssociations : "–"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Föreningar bearbetade</span>
              <span className="font-semibold">{jobStatus.associationsProcessed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Taggar skapade</span>
              <span className="font-semibold">{jobStatus.tagsCreated}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Nya länkar</span>
              <span className="font-semibold">{jobStatus.linksCreated}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Hoppade över (redan länkade)</span>
              <span className="font-semibold">{jobStatus.linksSkipped}</span>
            </div>
          </div>

          {jobStatus.status === "running" && (
            <div className="space-y-1">
              <Progress value={progressPercent ?? undefined} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {progressPercent !== null && totalAssociations !== null
                  ? `Bearbetat ${processedAssociations} av ${totalAssociations} föreningar (${progressPercent}%)`
                  : "Beräkning pågår..."}
              </p>
            </div>
          )}

          {jobStatus.reportUrl && (
            <Button variant="outline" className="w-full" asChild>
              <a href={jobStatus.reportUrl} download target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                Ladda ner rapport (CSV)
              </a>
            </Button>
          )}

          {jobStatus.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Fel:</strong>
                <ul className="mt-2 list-disc pl-4">
                  {jobStatus.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
