"""Filtering helpers for task queries."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable

from .dtos import TaskFilter
from .models import Task


def _matches_status(task: Task, filters: TaskFilter) -> bool:
    if not filters.status:
        return True
    return task.status in set(filters.status)


def _matches_assigned(task: Task, filters: TaskFilter) -> bool:
    if not filters.assigned_to_id:
        return True
    return task.assigned_to_id == filters.assigned_to_id


def _matches_association(task: Task, filters: TaskFilter) -> bool:
    if not filters.association_id:
        return True
    return task.association_id == filters.association_id


def _matches_due(task: Task, filters: TaskFilter) -> bool:
    due_before = filters.due_before
    due_after = filters.due_after
    if not (due_before or due_after):
        return True
    if task.due_date is None:
        return False
    if due_before and task.due_date > due_before:
        return False
    if due_after and task.due_date < due_after:
        return False
    return True


def _matches_search(task: Task, filters: TaskFilter) -> bool:
    if not filters.search:
        return True
    term = filters.search.casefold()
    if term in task.title.casefold():
        return True
    description = (task.description or "").casefold()
    return term in description


def apply_filters(tasks: Iterable[Task], filters: TaskFilter) -> Iterable[Task]:
    """Yield tasks that satisfy all filter predicates."""

    for task in tasks:
        if not _matches_status(task, filters):
            continue
        if not _matches_assigned(task, filters):
            continue
        if not _matches_association(task, filters):
            continue
        if not _matches_due(task, filters):
            continue
        if not _matches_search(task, filters):
            continue
        yield task


def limit_tasks(tasks: Iterable[Task], limit: int | None) -> Iterable[Task]:
    """Yield at most ``limit`` tasks preserving order."""

    if limit is None:
        yield from tasks
        return

    count = 0
    for task in tasks:
        if count >= limit:
            break
        count += 1
        yield task


__all__ = ["apply_filters", "limit_tasks"]
