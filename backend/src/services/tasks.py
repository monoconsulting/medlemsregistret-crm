"""Public compatibility entry point for the refactored task service."""

from typing import Optional

from .task_service import (
    Task,
    TaskCreate,
    TaskNotFoundError,
    TaskRepository,
    TaskSearchFilters,
    TaskService,
    TaskStatusUpdate,
    TaskUpdate,
)

__all__ = [
    "configure_task_service",
    "list_tasks",
    "create_task",
    "update_task",
    "update_task_status",
    "delete_task",
    "Task",
    "TaskCreate",
    "TaskUpdate",
    "TaskStatusUpdate",
    "TaskSearchFilters",
    "TaskService",
    "TaskRepository",
    "TaskNotFoundError",
]


_service: Optional[TaskService] = None


def configure_task_service(repository: TaskRepository) -> TaskService:
    """Configure the global task service instance used by convenience functions."""

    global _service
    _service = TaskService(repository)
    return _service


def _get_service() -> TaskService:
    if _service is None:
        raise RuntimeError("TaskService saknar konfiguration. Anropa configure_task_service först.")
    return _service


def list_tasks(filters: TaskSearchFilters | None = None) -> list[Task]:
    """Return tasks using the configured service instance."""

    return _get_service().list_tasks(filters)


def create_task(payload: TaskCreate) -> Task:
    """Create a new task using the configured service instance."""

    return _get_service().create_task(payload)


def update_task(task_id: str, payload: TaskUpdate) -> Task:
    """Update a task using the configured service instance."""

    return _get_service().update_task(task_id, payload)


def update_task_status(task_id: str, payload: TaskStatusUpdate) -> Task:
    """Update the status of a task using the configured service instance."""

    return _get_service().update_status(task_id, payload)


def delete_task(task_id: str) -> None:
    """Delete a task using the configured service instance."""

    _get_service().delete_task(task_id)
