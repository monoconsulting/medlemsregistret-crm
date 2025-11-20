"use client"

import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { api, type Contact } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Loader2,
  Search as SearchIcon,
  Pencil,
  Trash2,
} from "lucide-react"
import { ContactTable } from "@/components/contacts/contact-table"
import { ContactHubModal, type ContactHubAssociationSummary } from "@/components/modals/contact-hub-modal"

const PAGE_SIZE_OPTIONS = [25, 50, 100, 250, 500]

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 10

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      let start = Math.max(2, currentPage - Math.floor(maxVisible / 2))
      let end = Math.min(totalPages - 1, start + maxVisible - 1)

      if (end === totalPages - 1) {
        start = Math.max(2, end - maxVisible + 1)
      }

      pages.push(1)

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3"
      >
        Föregående
      </Button>

      {pages.map((page, index) => (
        typeof page === 'number' ? (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={cn(
              "w-10",
              currentPage === page && "bg-orange-600 hover:bg-orange-700 text-white"
            )}
          >
            {page}
          </Button>
        ) : (
          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
            {page}
          </span>
        )
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3"
      >
        Nästa
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3"
      >
        Sista
      </Button>
    </div>
  )
}

export default function ContactsPage() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState("name_asc")

  const [contactHubOpen, setContactHubOpen] = useState(false)
  const [contactHubAssociation, setContactHubAssociation] = useState<ContactHubAssociationSummary | null>(null)
  const [contactHubContactId, setContactHubContactId] = useState<string | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const loadContacts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getAllContacts({
        q: search,
        page,
        pageSize,
        sort,
      })
      setContacts(result.items)
      setTotal(result.total)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte hämta kontakter"
      setError(message)
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [search, page, pageSize, sort, toast])

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  const handleSortChange = (column: string) => {
    const currentSort = sort
    let newSort = "name_asc"

    if (column === "name") {
      newSort = currentSort === "name_asc" ? "name_desc" : "name_asc"
    } else if (column === "email") {
      newSort = currentSort === "email_asc" ? "email_desc" : "email_asc"
    } else if (column === "phone") {
      newSort = currentSort === "phone_asc" ? "phone_desc" : "phone_asc"
    } else if (column === "association") {
      newSort = currentSort === "association_asc" ? "association_desc" : "association_asc"
    } else if (column === "municipality") {
      newSort = currentSort === "municipality_asc" ? "municipality_desc" : "municipality_asc"
    } else if (column === "primary") {
      newSort = currentSort === "primary_desc" ? "primary_asc" : "primary_desc"
    } else if (column === "address") {
      newSort = currentSort === "address_asc" ? "address_desc" : "address_asc"
    } else if (column === "facebook") {
      newSort = currentSort === "facebook_asc" ? "facebook_desc" : "facebook_asc"
    } else if (column === "instagram") {
      newSort = currentSort === "instagram_asc" ? "instagram_desc" : "instagram_asc"
    } else if (column === "twitter") {
      newSort = currentSort === "twitter_asc" ? "twitter_desc" : "twitter_asc"
    }

    setSort(newSort)
  }

  const openContactHub = (contact: Contact) => {
    if (!contact.association_id) return
    setContactHubAssociation({
      id: contact.association_id,
      name: contact.association_name || "Okänd förening",
      municipalityName: contact.municipality_name,
      streetAddress: contact.association_street_address ?? null,
      postalCode: contact.association_postal_code ?? null,
      city: contact.association_city ?? null,
    })
    setContactHubContactId(contact.id)
    setContactHubOpen(true)
  }

  const toggleContactSelection = (contactId: string, checked: boolean) => {
    setSelectedContacts((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(contactId)
      } else {
        next.delete(contactId)
      }
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(contacts.map((contact) => contact.id)))
      return
    }
    setSelectedContacts(new Set())
  }

  const resetMissingSelections = useCallback(
    (current: Contact[]) => {
      setSelectedContacts((prev) => {
        const next = new Set<string>()
        current.forEach((contact) => {
          if (prev.has(contact.id)) {
            next.add(contact.id)
          }
        })
        return next
      })
    },
    [setSelectedContacts],
  )

  useEffect(() => {
    resetMissingSelections(contacts)
  }, [contacts, resetMissingSelections])

  const allSelected = contacts.length > 0 && contacts.every((contact) => selectedContacts.has(contact.id))
  const headerCheckboxState: boolean | "indeterminate" =
    contacts.length === 0
      ? false
      : allSelected
        ? true
        : selectedContacts.size > 0
          ? "indeterminate"
          : false

  const handleDeleteContact = async (contactId: string) => {
    setDeletingId(contactId)
    try {
      await api.deleteContact(contactId)
      toast({ title: "Kontakt markerad som borttagen" })
      setSelectedContacts((prev) => {
        const next = new Set(prev)
        next.delete(contactId)
        return next
      })
      void loadContacts()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte ta bort kontakt"
      toast({ title: "Fel", description: message, variant: "destructive" })
    } finally {
      setDeletingId((current) => (current === contactId ? null : current))
    }
  }

  return (
    <AppLayout
      title="Kontakter"
      description={`Visar ${contacts.length} av ${total} kontakter`}
    >
      <div className="space-y-6">
        <Card className="border-gray-200 rounded-xl">
          <CardHeader>
            <CardTitle className="text-gray-900">Sök och filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök kontakt, förening, kommun, e-post, telefon..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={`${pageSize} per sida`}>
                    {pageSize} per sida
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} per sida
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-900">Kontaktlista</CardTitle>
            {pageCount > 1 && (
              <div className="text-sm text-gray-600">
                Sida {page} av {pageCount}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" /> Hämtar kontakter…
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-destructive">{error}</div>
            ) : (
              <ContactTable
                contacts={contacts}
                sort={sort}
                onSortChange={handleSortChange}
                onRowClick={(contact) => openContactHub(contact)}
                selectedIds={selectedContacts}
                onToggleContact={toggleContactSelection}
                onToggleAll={toggleSelectAll}
                headerCheckboxState={headerCheckboxState}
                actionsRenderer={(contact) => (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Öppna kontaktmodal"
                      onClick={() => openContactHub(contact)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact.id)}
                      title="Radera kontakt"
                      disabled={deletingId === contact.id}
                    >
                      {deletingId === contact.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </Button>
                  </>
                )}
              />
            )}
            {!loading && !error && pageCount > 1 && (
              <div className="border-t px-6 py-4">
                <Pagination
                  currentPage={page}
                  totalPages={pageCount}
                  onPageChange={setPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ContactHubModal
        association={contactHubAssociation}
        open={contactHubOpen}
        selectedContactId={contactHubContactId}
        onOpenChange={(open) => {
          setContactHubOpen(open)
          if (!open) {
            setContactHubAssociation(null)
            setContactHubContactId(null)
          }
        }}
        onUpdated={() => {
          void loadContacts()
        }}
      />
    </AppLayout>
  )
}
