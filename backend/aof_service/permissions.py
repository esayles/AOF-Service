"""Contains a DRF Permission class to check if a user is faculty or admin."""

from rest_framework.permissions import BasePermission

class IsFacultyOrAdminPermission(BasePermission):

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) in ("faculty", "admin")
