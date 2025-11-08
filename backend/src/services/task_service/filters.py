"""Helpers to transform raw filter input into repository friendly structures."""
from __future__ import annotations

from dataclasses import replace
from typing import Iterable

from .dto import TaskSearchFilters
from .models import TaskStatus


DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def normalise_filters(raw_filters: TaskSearchFilters | None) -> TaskSearchFilters:
    """Return a sanitised instance of :class:`TaskSearchFilters`."""

    if raw_filters is None:
        return TaskSearchFilters(limit=DEFAULT_LIMIT)

    limit = min(max(raw_filters.limit, 1), MAX_LIMIT)
    statuses: Iterable[TaskStatus] = raw_filters.statuses or ()
    unique_statuses = tuple(dict.fromkeys(statuses))

    return replace(
        raw_filters,
        limit=limit,
        statuses=unique_statuses,
    )


__all__ = ["DEFAULT_LIMIT", "MAX_LIMIT", "normalise_filters"]
