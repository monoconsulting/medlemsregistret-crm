"""Domain models for the task service."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class TaskStatus(str, Enum):
    """Enumeration of the supported lifecycle states for tasks."""

    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    BLOCKED = "BLOCKED"


class TaskPriority(str, Enum):
    """Enumeration of the supported priority levels."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass(slots=True)
class TaskAssociation:
    """Lightweight projection of an association linked to a task."""

    id: str
    name: str
    municipality: Optional[str] = None


@dataclass(slots=True)
class TaskUser:
    """Lightweight projection of a user linked to a task."""

    id: str
    name: str
    email: Optional[str] = None


@dataclass(slots=True)
class Task:
    """Domain representation of a task."""

    id: str
    title: str
    status: TaskStatus
    priority: TaskPriority
    description: Optional[str]
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    association: Optional[TaskAssociation]
    assigned_to: Optional[TaskUser]
    created_by: TaskUser


__all__ = [
    "Task",
    "TaskStatus",
    "TaskPriority",
    "TaskAssociation",
    "TaskUser",
]
