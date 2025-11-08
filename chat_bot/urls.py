# from django.urls import path
# from . import views


# urlpatterns = [
#    path('chat_bot/',views.chat,name='chat')

    
# ]




from django.urls import path
from . import views

app_name = 'chatbot'

urlpatterns = [
    # path('', views.index, name='index'),
    # path('api/estimate-fare/', views.estimate_fare, name='estimate_fare'),
    # path('api/book-ride/', views.book_ride, name='book_ride'),
    path('save_trip/', views.save_trip, name='save_trip'),
    path('bookings',views.booking,name='bookings')
]
