"""Utility helpers for applying task filters."""
from __future__ import annotations

from dataclasses import replace
from datetime import datetime
from typing import Iterable, List

from .dto import TaskFilters, TaskRecord, TaskStatus


_STATUS_ORDER = {
    TaskStatus.OPEN: 0,
    TaskStatus.IN_PROGRESS: 1,
    TaskStatus.BLOCKED: 2,
    TaskStatus.CANCELLED: 3,
    TaskStatus.COMPLETED: 4,
}


def apply_filters(records: Iterable[TaskRecord], filters: TaskFilters) -> list[TaskRecord]:
    """Return records matching provided filters."""

    filtered: List[TaskRecord] = []
    statuses = filters.sanitized_statuses()
    search = filters.search.lower() if filters.search else None

    for record in records:
        if statuses and record.status not in statuses:
            continue
        if filters.assigned_to_id and record.assigned_to_id != filters.assigned_to_id:
            continue
        if filters.association_id and record.association_id != filters.association_id:
            continue
        if filters.due_before and record.due_date and record.due_date > filters.due_before:
            continue
        if filters.due_after and record.due_date and record.due_date < filters.due_after:
            continue
        if search:
            haystacks = [record.title, record.description]
            if not any(haystack and search in haystack.lower() for haystack in haystacks):
                continue
        filtered.append(record)

    filtered.sort(key=_sort_key)
    limit = filters.limit or len(filtered)
    return filtered[:limit]


def _sort_key(record: TaskRecord) -> tuple[int, datetime, datetime]:
    status_rank = _STATUS_ORDER.get(record.status, len(_STATUS_ORDER))
    due_date = record.due_date or datetime.max
    return (status_rank, due_date, record.created_at)


def touch_timestamp(record: TaskRecord, *, updated_at: datetime) -> TaskRecord:
    """Return a record with updated timestamp."""

    return replace(record, updated_at=updated_at)
