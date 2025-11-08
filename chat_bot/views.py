from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Rides
import json
from django.shortcuts import render

@csrf_exempt
def save_trip(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        if not request.user.is_authenticated:
            return JsonResponse({'status': 'error', 'message': 'User not logged in'}, status=401)

        trip = Rides.objects.create(
            user=request.user,
            starting_point=data.get('starting_point'),
            destination=data.get('destination'),
            vehicle_type=data.get('vehicle_type'),
            driver_name=data.get('driver_name'),
            cost=data.get('cost'),
            time_estimate=data.get('time_estimate')
        )

        return JsonResponse({'status': 'success', 'trip_id': trip.id})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


def booking(request):
    bkng = Rides.objects.filter(user=request.user).order_by('-date_time')
    return render(request,'booking.html',{'bkng':bkng})