"""Input validation helpers for the task service."""
from __future__ import annotations

from datetime import datetime

from .dto import TaskCreate, TaskStatusUpdate, TaskUpdate
from .exceptions import TaskValidationError
from .models import TaskPriority, TaskStatus


MAX_TITLE_LENGTH = 255
MAX_DESCRIPTION_LENGTH = 2000


def validate_create(payload: TaskCreate) -> None:
    """Validate the payload for creating a task."""

    if not payload.title.strip():
        raise TaskValidationError("Titel måste anges.")

    if len(payload.title) > MAX_TITLE_LENGTH:
        raise TaskValidationError("Titeln är för lång.")

    if payload.description and len(payload.description) > MAX_DESCRIPTION_LENGTH:
        raise TaskValidationError("Beskrivningen är för lång.")

    _validate_priority(payload.priority)
    _validate_due_date(payload.due_date)


def validate_update(payload: TaskUpdate) -> None:
    """Validate the payload for updating a task."""

    if payload.title is not None:
        if not payload.title.strip():
            raise TaskValidationError("Titeln får inte vara tom.")
        if len(payload.title) > MAX_TITLE_LENGTH:
            raise TaskValidationError("Titeln är för lång.")

    if payload.description is not None and len(payload.description) > MAX_DESCRIPTION_LENGTH:
        raise TaskValidationError("Beskrivningen är för lång.")

    if payload.priority is not None:
        _validate_priority(payload.priority)

    if payload.due_date is not None:
        _validate_due_date(payload.due_date)


def validate_status_update(payload: TaskStatusUpdate) -> None:
    """Validate a pure status update payload."""

    if payload.completed_at is not None and payload.status != TaskStatus.COMPLETED:
        raise TaskValidationError("completed_at får endast sättas för avslutade uppgifter.")


def _validate_priority(priority: TaskPriority) -> None:
    if not isinstance(priority, TaskPriority):
        raise TaskValidationError("Ogiltig prioritet.")


def _validate_due_date(due_date: datetime | None) -> None:
    if due_date is None:
        return

    if due_date.year < 1970:
        raise TaskValidationError("Ogiltigt förfallodatum.")


__all__ = [
    "MAX_TITLE_LENGTH",
    "MAX_DESCRIPTION_LENGTH",
    "validate_create",
    "validate_update",
    "validate_status_update",
]
