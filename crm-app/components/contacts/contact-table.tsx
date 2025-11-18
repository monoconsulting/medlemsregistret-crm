'use client'

import { Fragment } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ContactListItem } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Facebook,
  Instagram,
  Mail,
  Phone,
  Twitter,
  User,
} from "lucide-react"

export type ContactTableSortKey =
  | "name"
  | "association"
  | "municipality"
  | "primary"
  | "address"
  | "phone"
  | "email"
  | "facebook"
  | "instagram"
  | "twitter"

interface ContactTableProps {
  contacts: ContactListItem[]
  sort: string
  onSortChange: (column: ContactTableSortKey) => void
  onRowClick?: (contact: ContactListItem) => void
  selectedIds?: Set<string>
  onToggleContact?: (contactId: string, checked: boolean) => void
  onToggleAll?: (checked: boolean) => void
  headerCheckboxState?: boolean | "indeterminate"
  actionsRenderer?: (contact: ContactListItem) => React.ReactNode
  emptyMessage?: string
}

function SortableHeader({
  column,
  currentSort,
  onSort,
  children,
}: {
  column: ContactTableSortKey
  currentSort: string
  onSort: (column: ContactTableSortKey) => void
  children: React.ReactNode
}) {
  const icon = (() => {
    if (currentSort === `${column}_asc`) return <ArrowUp className="ml-1 h-4 w-4" />
    if (currentSort === `${column}_desc`) return <ArrowDown className="ml-1 h-4 w-4" />
    return <ArrowUpDown className="ml-1 h-4 w-4 opacity-30" />
  })()

  return (
    <TableHead>
      <button className="flex items-center hover:text-gray-900 transition-colors" onClick={() => onSort(column)}>
        {children}
        {icon}
      </button>
    </TableHead>
  )
}

export function ContactTable({
  contacts,
  sort,
  onSortChange,
  onRowClick,
  selectedIds,
  onToggleContact,
  onToggleAll,
  headerCheckboxState = false,
  actionsRenderer,
  emptyMessage = "Inga kontakter tillgängliga.",
}: ContactTableProps) {
  const showSelection = typeof selectedIds !== "undefined"

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            {showSelection ? (
              <TableHead className="px-4 py-3 text-left text-sm text-gray-600">
                <Checkbox
                  checked={headerCheckboxState}
                  onCheckedChange={(checked) => onToggleAll?.(Boolean(checked))}
                  aria-label="Markera alla kontakter"
                />
              </TableHead>
            ) : null}
            <SortableHeader column="name" currentSort={sort} onSort={onSortChange}>
              Namn
            </SortableHeader>
            <SortableHeader column="association" currentSort={sort} onSort={onSortChange}>
              Förening
            </SortableHeader>
            <SortableHeader column="municipality" currentSort={sort} onSort={onSortChange}>
              Kommun
            </SortableHeader>
            <SortableHeader column="primary" currentSort={sort} onSort={onSortChange}>
              Primär kontakt
            </SortableHeader>
            <SortableHeader column="address" currentSort={sort} onSort={onSortChange}>
              Adress
            </SortableHeader>
            <SortableHeader column="phone" currentSort={sort} onSort={onSortChange}>
              Telefonnummer
            </SortableHeader>
            <SortableHeader column="email" currentSort={sort} onSort={onSortChange}>
              E-post
            </SortableHeader>
            <SortableHeader column="facebook" currentSort={sort} onSort={onSortChange}>
              Facebook
            </SortableHeader>
            <SortableHeader column="instagram" currentSort={sort} onSort={onSortChange}>
              Instagram
            </SortableHeader>
            <SortableHeader column="twitter" currentSort={sort} onSort={onSortChange}>
              Twitter
            </SortableHeader>
            <TableHead className="px-4 py-3 text-left text-sm text-gray-600">Åtgärder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {contacts.map((contact) => {
            const selected = showSelection ? selectedIds?.has(contact.id) : false
            const rowContent = (
              <TableRow
                key={contact.id}
                className={cn("hover:bg-gray-50 transition-colors", onRowClick && "cursor-pointer")}
                onClick={() => onRowClick?.(contact)}
              >
                {showSelection ? (
                  <TableCell className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) => onToggleContact?.(contact.id, Boolean(checked))}
                      aria-label={`Markera ${contact.name ?? "okänd kontakt"}`}
                    />
                  </TableCell>
                ) : null}
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{contact.name || "-"}</div>
                      {contact.role ? <div className="text-xs text-gray-500">{contact.role}</div> : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="text-sm text-gray-900">{contact.association_name || "-"}</span>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="text-sm text-gray-900">{contact.municipality_name || "-"}</span>
                </TableCell>
                <TableCell className="px-4 py-4">
                  {contact.is_primary ? <Badge variant="secondary">Ja</Badge> : <span className="text-sm text-gray-500">Nej</span>}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <span className="text-sm text-gray-900">
                    {contact.association_address ||
                      contact.association_street_address ||
                      contact.association_city ||
                      contact.association_postal_code ||
                      "-"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{contact.phone || contact.mobile || "-"}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 break-all">{contact.email || "-"}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  {contact.facebook_url ? (
                    <ExternalSocialLink icon={<Facebook className="h-4 w-4" />} url={contact.facebook_url} label="Facebook" />
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  {contact.instagram_url ? (
                    <ExternalSocialLink icon={<Instagram className="h-4 w-4" />} url={contact.instagram_url} label="Instagram" />
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4">
                  {contact.twitter_url ? (
                    <ExternalSocialLink icon={<Twitter className="h-4 w-4" />} url={contact.twitter_url} label="Twitter" />
                  ) : (
                    <span className="text-sm text-gray-500">-</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center gap-1">{actionsRenderer?.(contact)}</div>
                </TableCell>
              </TableRow>
            )
            return <Fragment key={contact.id}>{rowContent}</Fragment>
          })}
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showSelection ? 12 : 11} className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}

function ExternalSocialLink({ icon, url, label }: { icon: React.ReactNode; url: string; label: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-sm text-orange-700 hover:text-orange-800">
      <a href={url} target="_blank" rel="noreferrer" title={label}>
        <span className="inline-flex items-center gap-2">
          {icon}
          Öppna
        </span>
      </a>
    </Button>
  )
}
