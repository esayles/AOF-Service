from django.db import models

#Defines a user within the system
class User(models.Model):
    #Name fields:
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    #Email address field:
    email_address = models.CharField(max_length=30)

#Defines a student user within the system
class Student(User):
    #Enables the student user to be in 1 of 5 grade levels
    #This eliminates the errors that come with the use of an IntegerField
    #(like when the student is entered in as a grade > 13 or < 9
    FRESHMAN = "FR"
    SOPHOMORE = "SO"
    JUNIOR = "JR"
    SENIOR = "SR"
    POSTGRADUATE = "PG"
    YEAR_IN_SCHOOL_CHOICES = {
        FRESHMAN: "Freshman",
        SOPHOMORE: "Sophomore",
        JUNIOR: "Junior",
        SENIOR: "Senior",
        POSTGRADUATE: "Postgraduate",
    }
        year_in_school = models.CharField(
        max_length=2,
        choices=YEAR_IN_SCHOOL_CHOICES,
        default=FRESHMAN,
    )

#Defines a faculty user within the system
class Faculty(User):
    is_admin = False
    
#Defines an admin user within the system
class Admin(Faculty):
    super().is_admin = True
