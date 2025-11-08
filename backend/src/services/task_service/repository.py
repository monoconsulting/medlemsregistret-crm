"""Repository contract used by the task service."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Protocol

from .dto import TaskCreate, TaskSearchFilters, TaskStatusUpdate, TaskUpdate
from .models import Task


@dataclass(slots=True)
class TaskQuery:
    """Materialised query built from TaskSearchFilters."""

    filters: TaskSearchFilters
    limit: int


class TaskRepository(Protocol):
    """Interface a repository implementation must fulfil."""

    def fetch(self, query: TaskQuery) -> Iterable[Task]:
        ...

    def create(self, payload: TaskCreate) -> Task:
        ...

    def update(self, task_id: str, payload: TaskUpdate) -> Task:
        ...

    def update_status(self, task_id: str, payload: TaskStatusUpdate) -> Task:
        ...

    def delete(self, task_id: str) -> None:
        ...

    def touch(self, task_id: str, timestamp: datetime) -> None:
        """Update the modification timestamp without changing other fields."""


__all__ = ["TaskRepository", "TaskQuery"]
