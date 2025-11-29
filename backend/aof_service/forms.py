from django import forms
from .models import ServiceHour

class ServiceHourForm(forms.ModelForm):
    class Meta:
        model = ServiceHour
        fields = ["description", "hours", "date_performed"]

        widgets = {
            "description": forms.Textarea(attrs={"rows": 3}),
            "date_performed": forms.DateInput(attrs={"type": "date"}),
        }