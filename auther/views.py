from django.shortcuts import render
from .forms import UserRegrestrationForm
from django.shortcuts import get_object_or_404,redirect # Fetches an object from the database or returns a 404 error if it doesn’t exist.
from django.contrib.auth import login,authenticate,logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
# Create your views here.


def register(request):
    if request.method == "POST":
        form = UserRegrestrationForm(request.POST)
        if form.is_valid():
            user = form.save()          # Save the new user
            login(request, user)        # Automatically log the user in
            messages.success(request, f"Welcome, {user.username}! You’re now logged in.")
            return redirect('home')     # Redirect to your home page
    else:
        form = UserRegrestrationForm()
    return render(request, "auther_content/signup.html", {'form': form})


def user_login(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f"Welcome back, {username}!")
                return redirect('home')  # change to your desired page
        else:
            messages.error(request, "Invalid username or password")
    else:
        form = AuthenticationForm()

    return render(request, "auther_content/login.html", {"form": form})



def log_out(request):
    logout(request)  
    return render(request,'auther_content/log_out.html')