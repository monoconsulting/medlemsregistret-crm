"""Repository abstractions for tasks."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from typing import Dict, Protocol
from uuid import uuid4

from .dtos import TaskFilter
from .exceptions import TaskConflictError, TaskNotFoundError
from .models import Task
from .filters import apply_filters, limit_tasks


class TaskRepository(Protocol):
    """Repository interface used by :class:`TaskService`."""

    def list(self, filters: TaskFilter) -> Iterable[Task]:
        ...

    def add(self, task: Task) -> Task:
        ...

    def get(self, task_id: str) -> Task:
        ...

    def save(self, task: Task) -> Task:
        ...

    def remove(self, task_id: str) -> None:
        ...


class InMemoryTaskRepository:
    """Simple repository useful for tests and prototyping."""

    def __init__(self) -> None:
        self._tasks: Dict[str, Task] = {}

    def list(self, filters: TaskFilter) -> Iterable[Task]:
        ordered = sorted(
            self._tasks.values(),
            key=lambda task: (
                task.status.value,
                task.due_date or datetime.max,
                -task.created_at.timestamp(),
            ),
        )
        tasks = apply_filters(ordered, filters)
        return list(limit_tasks(tasks, filters.limit))

    def add(self, task: Task) -> Task:
        if task.id in self._tasks:
            raise TaskConflictError(f"Task {task.id} finns redan")
        self._tasks[task.id] = task
        return task

    def get(self, task_id: str) -> Task:
        try:
            return self._tasks[task_id]
        except KeyError as exc:
            raise TaskNotFoundError(f"Task {task_id} hittades inte") from exc

    def save(self, task: Task) -> Task:
        if task.id not in self._tasks:
            raise TaskNotFoundError(f"Task {task.id} hittades inte")
        self._tasks[task.id] = task
        return task

    def remove(self, task_id: str) -> None:
        if task_id not in self._tasks:
            raise TaskNotFoundError(f"Task {task_id} hittades inte")
        del self._tasks[task_id]


def generate_task_id() -> str:
    """Return a new unique identifier."""

    return uuid4().hex


__all__ = ["TaskRepository", "InMemoryTaskRepository", "generate_task_id"]
