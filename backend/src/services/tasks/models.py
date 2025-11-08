"""Domain models for tasks."""

from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime
from enum import Enum
from typing import Optional


class TaskStatus(str, Enum):
    """All allowed task statuses."""

    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    BLOCKED = "BLOCKED"


class TaskPriority(str, Enum):
    """Supported priority levels."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


@dataclass(frozen=True)
class Task:
    """Immutable representation of a task entry."""

    id: str
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    priority: TaskPriority
    status: TaskStatus
    association_id: Optional[str]
    assigned_to_id: Optional[str]
    created_by_id: str
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    def with_updates(self, **changes: object) -> "Task":
        """Return a copy of the task with the provided updates applied."""

        return replace(self, **changes)

    @property
    def is_completed(self) -> bool:
        """Return whether the task is in a completed state."""

        return self.status == TaskStatus.COMPLETED


__all__ = ["Task", "TaskStatus", "TaskPriority"]
