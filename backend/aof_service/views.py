from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.core.exceptions import PermissionDenied

from .forms import ServiceHourForm
from .models import StudentProfile, ServiceHour


@login_required
def submit_service_hours(request):
    if request.user.role != "student":
        raise PermissionDenied("Only students can submit service hours.")

    student_profile = StudentProfile.objects.get(user=request.user)

    if request.method == "POST":
        form = ServiceHourForm(request.POST)
        if form.is_valid():
            service_hour = form.save(commit=False)
            service_hour.student = student_profile
            service_hour.save()
            return redirect("student_dashboard")
    else:
        form = ServiceHourForm()

    return render(request, "submit_hours.html", {"form": form})