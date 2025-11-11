"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Plus, Check, Tag as TagIcon } from "lucide-react"
import { api, type Tag } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface TagSelectorProps {
  selectedTags: Tag[]
  allTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  onTagCreated?: (tag: Tag) => void
}

export function TagSelector({ selectedTags, allTags, onTagsChange, onTagCreated }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isTagSelected = (tagId: string) => selectedTags.some((t) => t.id === tagId)
  const isPendingSelection = (tagId: string) => pendingSelection.has(tagId)

  const handleTogglePendingTag = (tag: Tag) => {
    setPendingSelection((prev) => {
      const next = new Set(prev)
      if (next.has(tag.id)) {
        next.delete(tag.id)
      } else {
        next.add(tag.id)
      }
      return next
    })
  }

  const handleRemoveTag = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onTagsChange(selectedTags.filter((t) => t.id !== tagId))
  }

  const handleApplySelection = () => {
    if (pendingSelection.size === 0) {
      setOpen(false)
      return
    }

    // Get tags to add
    const tagsToAdd = allTags.filter((t) => pendingSelection.has(t.id) && !isTagSelected(t.id))

    if (tagsToAdd.length > 0) {
      onTagsChange([...selectedTags, ...tagsToAdd])
    }

    setPendingSelection(new Set())
    setSearchQuery("")
    setOpen(false)
  }

  const handleCreateTag = async () => {
    const trimmedName = searchQuery.trim()
    if (!trimmedName) {
      toast({
        title: "Fel",
        description: "Taggen måste ha ett namn",
        variant: "destructive",
      })
      return
    }

    // Check if tag already exists
    const existingTag = allTags.find((t) => t.name.toLowerCase() === trimmedName.toLowerCase())
    if (existingTag) {
      // Just add to pending selection
      setPendingSelection((prev) => new Set(prev).add(existingTag.id))
      setSearchQuery("")
      toast({
        title: "Tagg vald",
        description: `Taggen "${trimmedName}" har lagts till i urvalet`,
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await api.createTag(trimmedName)
      const newTag: Tag = { id: result.id, name: trimmedName }

      // Notify parent about new tag
      if (onTagCreated) {
        onTagCreated(newTag)
      }

      // Add to pending selection
      setPendingSelection((prev) => new Set(prev).add(newTag.id))

      toast({
        title: "Tagg skapad",
        description: `Taggen "${trimmedName}" har skapats och lagts till i urvalet`,
      })

      setSearchQuery("")
    } catch (error) {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte skapa taggen",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    setPendingSelection(new Set())
    setSearchQuery("")
    setOpen(false)
  }

  const showCreateButton = searchQuery.trim() &&
    !allTags.some((t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase())

  const pendingCount = pendingSelection.size

  return (
    <div className="space-y-2">
      {/* Display selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs flex items-center gap-1 pr-1"
            >
              {tag.name}
              <button
                onClick={(e) => handleRemoveTag(tag.id, e)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <TagIcon className="mr-2 h-3 w-3" />
            Lägg till taggar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Sök taggar..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {filteredTags.length === 0 && !showCreateButton && (
                <CommandEmpty>Inga taggar hittades</CommandEmpty>
              )}
              {filteredTags.length > 0 && (
                <CommandGroup>
                  <ScrollArea className="max-h-[200px]">
                    {filteredTags.map((tag) => {
                      const selected = isTagSelected(tag.id)
                      const pending = isPendingSelection(tag.id)
                      const isActive = selected || pending

                      return (
                        <CommandItem
                          key={tag.id}
                          onSelect={() => !selected && handleTogglePendingTag(tag)}
                          className="cursor-pointer"
                          disabled={selected}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                isActive
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-muted-foreground/50"
                              }`}
                            >
                              {isActive && <Check className="h-3 w-3" />}
                            </div>
                            <span className={`flex-1 ${selected ? "text-muted-foreground" : ""}`}>
                              {tag.name}
                              {selected && " (redan vald)"}
                            </span>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </ScrollArea>
                </CommandGroup>
              )}
              {showCreateButton && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateTag}
                    disabled={isCreating}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>
                      {isCreating ? "Skapar..." : `Skapa "${searchQuery.trim()}"`}
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
            {/* Action buttons */}
            <div className="border-t p-2 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {pendingCount > 0 && `${pendingCount} valda`}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-8 text-xs"
                >
                  Avbryt
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplySelection}
                  disabled={pendingCount === 0}
                  className="h-8 text-xs"
                >
                  Lägg till ({pendingCount})
                </Button>
              </div>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
