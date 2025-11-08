"""Validation helpers for task payloads."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional

from .dtos import TaskCreate, TaskFilter, TaskStatusUpdate, TaskUpdate
from .exceptions import TaskValidationError
from .models import TaskPriority, TaskStatus

_TITLE_MAX_LENGTH = 255
_DESCRIPTION_MAX_LENGTH = 4000


def _ensure_not_blank(value: Optional[str], field: str) -> None:
    if value is None:
        raise TaskValidationError(f"{field} är obligatorisk")
    if not value.strip():
        raise TaskValidationError(f"{field} får inte vara tom")


def _validate_length(value: Optional[str], field: str, max_length: int) -> None:
    if value is not None and len(value) > max_length:
        raise TaskValidationError(f"{field} får vara högst {max_length} tecken")


def _normalize_statuses(statuses: Iterable[TaskStatus | str]) -> tuple[TaskStatus, ...]:
    values = tuple(_coerce_status(status) for status in statuses)
    unique = set(values)
    if len(unique) != len(values):
        raise TaskValidationError("Statusfilter får inte innehålla dubbletter")
    return values


def _validate_due_dates(due_before: Optional[datetime], due_after: Optional[datetime]) -> None:
    if due_before and due_after and due_before < due_after:
        raise TaskValidationError("due_before måste vara senare än due_after")


def _coerce_priority(value: TaskPriority | str | None) -> TaskPriority:
    if isinstance(value, TaskPriority):
        return value
    if value is None:
        return TaskPriority.MEDIUM
    try:
        return TaskPriority(value)
    except ValueError as exc:
        raise TaskValidationError("Ogiltig prioritet") from exc


def _coerce_status(value: TaskStatus | str | None) -> TaskStatus:
    if isinstance(value, TaskStatus):
        return value
    if value is None:
        raise TaskValidationError("Ogiltig status")
    try:
        return TaskStatus(value)
    except ValueError as exc:
        raise TaskValidationError("Ogiltig status") from exc


def validate_task_create(payload: TaskCreate) -> None:
    """Validate creation payloads."""

    _ensure_not_blank(payload.title, "Titel")
    _ensure_not_blank(payload.created_by_id, "Skapare")
    _validate_length(payload.title, "Titel", _TITLE_MAX_LENGTH)
    _validate_length(payload.description, "Beskrivning", _DESCRIPTION_MAX_LENGTH)
    payload.priority = _coerce_priority(payload.priority)


def validate_task_update(payload: TaskUpdate) -> None:
    """Validate update payloads."""

    _ensure_not_blank(payload.id, "Id")
    if payload.title is not None:
        _ensure_not_blank(payload.title, "Titel")
        _validate_length(payload.title, "Titel", _TITLE_MAX_LENGTH)
    _validate_length(payload.description, "Beskrivning", _DESCRIPTION_MAX_LENGTH)
    if payload.priority is not None:
        payload.priority = _coerce_priority(payload.priority)
    if payload.status is not None:
        payload.status = _coerce_status(payload.status)


def validate_status_update(payload: TaskStatusUpdate) -> None:
    """Validate status transition payloads."""

    _ensure_not_blank(payload.id, "Id")
    payload.status = _coerce_status(payload.status)
    if payload.completed_at and payload.status != TaskStatus.COMPLETED:
        raise TaskValidationError("completed_at får endast sättas när status är COMPLETED")


def validate_filters(filters: Optional[TaskFilter]) -> TaskFilter:
    """Return a sanitized filter object."""

    filters = filters or TaskFilter()
    if filters.limit is not None and filters.limit <= 0:
        raise TaskValidationError("limit måste vara större än noll")
    if filters.limit is not None and filters.limit > 100:
        raise TaskValidationError("limit får vara högst 100")
    if filters.search is not None:
        if not filters.search.strip():
            raise TaskValidationError("Söksträngen får inte vara tom")
        filters.search = filters.search.strip()

    if filters.status is not None:
        filters.status = _normalize_statuses(filters.status)
    _validate_due_dates(filters.due_before, filters.due_after)

    return filters


__all__ = [
    "validate_filters",
    "validate_status_update",
    "validate_task_create",
    "validate_task_update",
]
