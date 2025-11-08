"""Public interface for task related functionality."""
from __future__ import annotations

from typing import Optional

from .task_components.dto import (
    TaskCreate,
    TaskFilters,
    TaskListResult,
    TaskPriority,
    TaskRecord,
    TaskStatus,
    TaskStatusUpdate,
    TaskUpdate,
)
from .task_components.exceptions import TaskError, TaskNotFoundError, TaskValidationError
from .task_components.repository import InMemoryTaskRepository, TaskRepository
from .task_components.service import TaskService

__all__ = [
    "TaskCreate",
    "TaskFilters",
    "TaskListResult",
    "TaskPriority",
    "TaskRecord",
    "TaskStatus",
    "TaskStatusUpdate",
    "TaskUpdate",
    "TaskError",
    "TaskNotFoundError",
    "TaskValidationError",
    "TaskRepository",
    "TaskService",
    "build_task_service",
    "list_tasks",
    "create_task",
    "update_task",
    "update_task_status",
    "delete_task",
]


def build_task_service(repository: Optional[TaskRepository] = None) -> TaskService:
    """Return a service instance using provided repository or an in-memory fallback."""

    repo = repository or InMemoryTaskRepository()
    return TaskService(repo)


def list_tasks(
    service: TaskService,
    filters: Optional[TaskFilters] = None,
) -> TaskListResult:
    """List tasks using supplied service."""

    return service.list(filters)


def create_task(service: TaskService, payload: TaskCreate) -> TaskRecord:
    """Create a task using the provided service."""

    return service.create(payload)


def update_task(service: TaskService, task_id: str, payload: TaskUpdate) -> TaskRecord:
    """Update the task identified by ``task_id``."""

    return service.update(task_id, payload)


def update_task_status(
    service: TaskService,
    task_id: str,
    payload: TaskStatusUpdate,
) -> TaskRecord:
    """Update status for a single task."""

    return service.update_status(task_id, payload)


def delete_task(service: TaskService, task_id: str) -> None:
    """Delete a task."""

    service.delete(task_id)
