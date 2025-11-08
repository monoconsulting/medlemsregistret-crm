"""Task service public API.

This module exposes the high-level service and DTOs used throughout the
codebase. The heavy lifting lives in the sibling modules so that the
package remains maintainable even as the domain grows.
"""

from .dtos import TaskCreate, TaskFilter, TaskStatusUpdate, TaskUpdate
from .exceptions import TaskError, TaskNotFoundError, TaskValidationError
from .models import Task, TaskPriority, TaskStatus
from .repository import InMemoryTaskRepository, TaskRepository
from .service import TaskService

__all__ = [
    "Task",
    "TaskCreate",
    "TaskFilter",
    "TaskPriority",
    "TaskRepository",
    "TaskService",
    "TaskStatus",
    "TaskStatusUpdate",
    "TaskUpdate",
    "TaskError",
    "TaskNotFoundError",
    "TaskValidationError",
    "InMemoryTaskRepository",
]
