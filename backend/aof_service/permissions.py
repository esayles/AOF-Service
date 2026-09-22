"""Contains a DRF Permission class to check if a user is faculty or admin."""

from rest_framework.permissions import BasePermission
from .models import User

class IsFacultyOrAdminPermission(BasePermission):

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) in User.FACULTY_VERIFIER_ROLES

# Gives administrative operations only to admins of the app (THANK YOU IF YOU'RE READING THIS!!!!)
class IsAdminPermission(BasePermission):

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) in User.ADMIN_ROLES


class IsSchoolActivityAdminPermission(BasePermission):
    """Allow both administrator personas to view school-wide activities."""

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return False
        return getattr(user, "role", None) in User.ADMIN_ROLES
