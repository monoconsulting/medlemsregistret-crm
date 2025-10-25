"use client"

import { useMemo, useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { sv } from "date-fns/locale"
import { Plus, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

import { trpc } from "@/lib/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskSchema, type TaskFormValues } from "@/lib/validators/task"
import { toast } from "@/hooks/use-toast"

const statusBadgeVariant: Record<string, string> = {
  OPEN: "default",
  IN_PROGRESS: "secondary",
  BLOCKED: "destructive",
  COMPLETED: "outline",
  CANCELLED: "outline",
}

const priorityLabel: Record<string, string> = {
  LOW: "Låg",
  MEDIUM: "Normal",
  HIGH: "Hög",
  CRITICAL: "Kritisk",
}

function TaskDueDate({ dueDate }: { dueDate: string | Date | null }) {
  if (!dueDate) {
    return <span className="text-xs text-muted-foreground">Ingen deadline</span>
  }

  const date = new Date(dueDate)
  const isPast = date.getTime() < Date.now()

  return (
    <span className={cn("text-xs", isPast ? "text-destructive" : "text-muted-foreground")}
      title={format(date, "PPP", { locale: sv })}
    >
      {formatDistanceToNow(date, { addSuffix: true, locale: sv })}
    </span>
  )
}

function TaskForm({ onSubmit }: { onSubmit: (values: TaskFormValues) => Promise<void> }) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: null,
      priority: "MEDIUM",
      associationId: null,
      assignedToId: null,
    },
  })

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values)
          form.reset()
        })}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input placeholder="Boka uppföljningsmöte" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivning</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Detaljer eller syfte med uppgiften" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(event) =>
                      field.onChange(event.target.value ? new Date(event.target.value) : null)
                    }
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioritet</FormLabel>
              <FormControl>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...field}
                >
                  {Object.entries(priorityLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit">Skapa uppgift</Button>
        </div>
      </form>
    </Form>
  )
}

export function UpcomingTasks() {
  const utils = trpc.useUtils()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = trpc.tasks.list.useQuery({
    status: ["OPEN", "IN_PROGRESS", "BLOCKED"],
    limit: 8,
  })

  const createTask = trpc.tasks.create.useMutation({
    onSuccess: () => {
      toast({ title: "Uppgift skapad" })
      utils.tasks.list.invalidate()
      setDialogOpen(false)
    },
    onError: (error) => toast({ title: "Kunde inte skapa uppgift", description: error.message, variant: "destructive" }),
  })

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => utils.tasks.list.invalidate(),
  })

  const criticalTasks = useMemo(() => {
    return (data ?? []).filter((task) => task.priority === "CRITICAL")
  }, [data])

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Kommande uppgifter</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Ny uppgift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa uppgift</DialogTitle>
            </DialogHeader>
            <TaskForm
              onSubmit={async (values) => {
                await createTask.mutateAsync(values)
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalTasks.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {criticalTasks.length} kritiska uppgift{criticalTasks.length > 1 ? "er" : ""} kräver uppmärksamhet
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 rounded-lg border bg-muted/40 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Inga öppna uppgifter. Skapa en för att komma igång.
          </p>
        )}

        {data?.map((task) => (
          <div key={task.id} className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium leading-tight">{task.title}</p>
                {task.association && (
                  <p className="text-xs text-muted-foreground">{task.association.name}</p>
                )}
              </div>
              <Badge variant={statusBadgeVariant[task.status] as any}>{task.status.replace("_", " ")}</Badge>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <TaskDueDate dueDate={task.dueDate} />
              <span>{priorityLabel[task.priority]}</span>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="text-green-600 hover:text-green-700"
                onClick={() =>
                  updateStatus.mutate({ id: task.id, status: "COMPLETED" })
                }
                disabled={updateStatus.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Markera klar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
