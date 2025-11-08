"""Data transfer objects and domain models for the task service."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Iterable, Optional, Sequence


class TaskPriority(str, Enum):
    """Supported task priority levels."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TaskStatus(str, Enum):
    """Lifecycle state of a task."""

    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    BLOCKED = "BLOCKED"


@dataclass(slots=True)
class TaskCreate:
    """Payload for creating a task."""

    title: str
    created_by_id: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    association_id: Optional[str] = None
    assigned_to_id: Optional[str] = None


@dataclass(slots=True)
class TaskUpdate:
    """Mutable fields when updating an existing task."""

    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    association_id: Optional[str] = None
    assigned_to_id: Optional[str] = None
    status: Optional[TaskStatus] = None


@dataclass(slots=True)
class TaskStatusUpdate:
    """Explicit status update payload."""

    status: TaskStatus
    completed_at: Optional[datetime] = None


@dataclass(slots=True)
class TaskFilters:
    """Filters accepted when listing tasks."""

    status: Optional[Sequence[TaskStatus]] = None
    assigned_to_id: Optional[str] = None
    association_id: Optional[str] = None
    due_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    search: Optional[str] = None
    limit: Optional[int] = None

    def sanitized_statuses(self) -> Optional[tuple[TaskStatus, ...]]:
        """Return unique statuses while preserving ordering."""

        if self.status is None:
            return None
        seen: set[TaskStatus] = set()
        ordered: list[TaskStatus] = []
        for item in self.status:
            if item not in seen:
                ordered.append(item)
                seen.add(item)
        return tuple(ordered)


@dataclass(slots=True, frozen=True)
class TaskRecord:
    """Representation of a persisted task."""

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


@dataclass(slots=True)
class TaskListResult:
    """Response returned from :meth:`TaskService.list`."""

    items: list[TaskRecord] = field(default_factory=list)
    total: int = 0

    def extend(self, records: Iterable[TaskRecord]) -> None:
        for record in records:
            self.items.append(record)
        self.total = len(self.items)
