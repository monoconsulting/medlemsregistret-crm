"""Data transfer objects for the task service."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from .models import TaskPriority, TaskStatus


@dataclass(slots=True)
class TaskSearchFilters:
    """Filter parameters accepted by the service layer when listing tasks."""

    statuses: tuple[TaskStatus, ...] = ()
    assigned_to_id: Optional[str] = None
    association_id: Optional[str] = None
    due_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    search: Optional[str] = None
    limit: int = 20


@dataclass(slots=True)
class TaskCreate:
    """Fields required to create a new task."""

    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    priority: TaskPriority
    association_id: Optional[str]
    assigned_to_id: Optional[str]
    created_by_id: str


@dataclass(slots=True)
class TaskUpdate:
    """Fields accepted when updating an existing task."""

    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    association_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    status: Optional[TaskStatus] = None


@dataclass(slots=True)
class TaskStatusUpdate:
    """DTO used when only the status of a task is being changed."""

    status: TaskStatus
    completed_at: Optional[datetime]


__all__ = [
    "TaskSearchFilters",
    "TaskCreate",
    "TaskUpdate",
    "TaskStatusUpdate",
]
