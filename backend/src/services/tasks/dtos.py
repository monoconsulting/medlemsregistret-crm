"""Data transfer objects used by the task service."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Optional

from .models import TaskPriority, TaskStatus


@dataclass(slots=True)
class TaskCreate:
    """Payload required to create a task."""

    title: str
    created_by_id: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    association_id: Optional[str] = None
    assigned_to_id: Optional[str] = None


@dataclass(slots=True)
class TaskUpdate:
    """Payload used for partial updates."""

    id: str
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    association_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    status: Optional[TaskStatus] = None


@dataclass(slots=True)
class TaskStatusUpdate:
    """Dedicated payload for status transitions."""

    id: str
    status: TaskStatus
    completed_at: Optional[datetime] = None


@dataclass(slots=True)
class TaskFilter:
    """Filter options used when listing tasks."""

    status: Optional[Iterable[TaskStatus]] = None
    assigned_to_id: Optional[str] = None
    association_id: Optional[str] = None
    due_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    search: Optional[str] = None
    limit: Optional[int] = None


__all__ = [
    "TaskCreate",
    "TaskUpdate",
    "TaskStatusUpdate",
    "TaskFilter",
]
