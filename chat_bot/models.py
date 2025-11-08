
from django.db import models
from django.contrib.auth.models import User

class Rides(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    starting_point = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    vehicle_type = models.CharField(max_length=50)
    driver_name = models.CharField(max_length=100)
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    time_estimate = models.CharField(max_length=50)
    date_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.starting_point} → {self.destination}"
