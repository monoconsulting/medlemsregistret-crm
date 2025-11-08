"""Custom exceptions for the task service."""


class TaskServiceError(RuntimeError):
    """Base error for all task service failures."""


class TaskNotFoundError(TaskServiceError):
    """Raised when a task could not be located."""


class TaskValidationError(TaskServiceError):
    """Raised when user input fails validation."""


__all__ = [
    "TaskServiceError",
    "TaskNotFoundError",
    "TaskValidationError",
]
