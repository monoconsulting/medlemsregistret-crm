"""Validation helpers for the task service."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from .dto import TaskCreate, TaskFilters, TaskStatus, TaskStatusUpdate, TaskUpdate
from .exceptions import TaskValidationError


MAX_LIST_LIMIT = 100
DEFAULT_LIST_LIMIT = 20


def _ensure_non_empty(text: Optional[str], field: str) -> str:
    if text is None:
        raise TaskValidationError(f"{field} is required")
    cleaned = text.strip()
    if not cleaned:
        raise TaskValidationError(f"{field} can not be blank")
    return cleaned


def validate_task_create(payload: TaskCreate) -> TaskCreate:
    payload.title = _ensure_non_empty(payload.title, "title")
    payload.created_by_id = _ensure_non_empty(payload.created_by_id, "created_by_id")

    if payload.description is not None:
        payload.description = payload.description.strip()
    return payload


def validate_task_update(payload: TaskUpdate) -> TaskUpdate:
    if not any(
        [
            payload.title is not None,
            payload.description is not None,
            payload.due_date is not None,
            payload.priority is not None,
            payload.association_id is not None,
            payload.assigned_to_id is not None,
            payload.status is not None,
        ]
    ):
        raise TaskValidationError("At least one field must be provided for update")

    if payload.title is not None:
        payload.title = _ensure_non_empty(payload.title, "title")
    if payload.description is not None:
        payload.description = payload.description.strip()
    return payload


def validate_task_status_update(payload: TaskStatusUpdate) -> TaskStatusUpdate:
    if not isinstance(payload.status, TaskStatus):
        raise TaskValidationError("Invalid task status provided")
    return payload


def validate_task_filters(filters: Optional[TaskFilters]) -> TaskFilters:
    if filters is None:
        filters = TaskFilters()

    if filters.limit is not None:
        if filters.limit <= 0:
            raise TaskValidationError("limit must be a positive integer")
        if filters.limit > MAX_LIST_LIMIT:
            raise TaskValidationError(f"limit can not exceed {MAX_LIST_LIMIT}")
    else:
        filters.limit = DEFAULT_LIST_LIMIT

    if filters.due_before and filters.due_after:
        if filters.due_before < filters.due_after:
            raise TaskValidationError("due_before can not be earlier than due_after")

    if filters.search:
        filters.search = filters.search.strip()

    return filters


def coalesce_completed_at(status: TaskStatus, completed_at: Optional[datetime]) -> Optional[datetime]:
    if status == TaskStatus.COMPLETED and completed_at is None:
        return datetime.utcnow()
    return completed_at
