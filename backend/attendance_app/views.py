from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash

import json
import os
import sys
import cv2
import numpy as np

from datetime import datetime
from zoneinfo import ZoneInfo

from deepface import DeepFace
from bson import ObjectId

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    )
)

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from config.database import (
    students_collection,
    attendance_collection,
    faces_collection,
    team_collection
)

from recognition.recognition import recognize_face
from attendance import mark_attendance


# =========================================================
# HELPERS
# =========================================================

def json_error(message, status=400):
    return JsonResponse({
        "status": "error",
        "message": message
    }, status=status)


def no_cache_response(data, status=200):
    response = JsonResponse(data, status=status)
    response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response["Pragma"] = "no-cache"
    response["Expires"] = "0"
    return response


def get_current_user(request):
    if request.user.is_authenticated:
        return request.user
    return None


def require_admin(request):
    user = get_current_user(request)

    if user is None:
        return json_error(
            "Authentication required",
            401
        )

    if not user.is_staff:
        return json_error(
            "Admin access is required",
            403
        )

    return None


def require_student(request):
    user = get_current_user(request)

    if user is None:
        return json_error(
            "Authentication required",
            401
        )

    if user.is_staff:
        return json_error(
            "Student access is required",
            403
        )

    return None


# =========================================================
# ADMIN LOGIN
# =========================================================

@csrf_exempt
def admin_login(request):

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    try:
        data = json.loads(request.body)

        username = str(
            data.get("username", "")
        ).strip()

        password = data.get("password")

        if not username or not password:
            return json_error(
                "Username and password are required",
                400
            )

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is None:
            return json_error(
                "Invalid username or password",
                401
            )

        if not user.is_active:
            return json_error(
                "User account is inactive",
                403
            )

        if not user.is_staff:
            return json_error(
                "Admin access is required",
                403
            )

        login(request, user)

        request.session["authenticated_role"] = "admin"
        request.session.set_expiry(60 * 60 * 24 * 14)
        request.session.modified = True
        request.session.save()

        return no_cache_response({
            "status": "success",
            "message": "Login successful",
            "role": "admin",
            "user": {
                "username": user.username,
                "email": user.email,
                "is_staff": True
            }
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# ADMIN CHANGE PASSWORD
# =========================================================

@csrf_exempt
def admin_change_password(request):

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    if not request.user.is_authenticated:
        return json_error(
            "Authentication required",
            401
        )

    if not request.user.is_staff:
        return json_error(
            "Admin access is required",
            403
        )

    try:
        data = json.loads(request.body)

        new_password = data.get(
            "new_password",
            ""
        )

        if not new_password:
            return json_error(
                "New password is required",
                400
            )

        if len(new_password) < 8:
            return json_error(
                "Password must be at least 8 characters long",
                400
            )

        user = request.user

        user.set_password(
            new_password
        )

        user.save()

        update_session_auth_hash(
            request,
            user
        )

        request.session["authenticated_role"] = "admin"
        request.session.save()

        return JsonResponse({
            "status": "success",
            "message": "Password changed successfully"
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# STUDENT LOGIN
# =========================================================

@csrf_exempt
def student_login(request):

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    try:
        data = json.loads(request.body)

        student_id = str(
            data.get("student_id", "")
        ).strip()

        password = data.get("password")

        if not student_id or not password:
            return json_error(
                "Student ID and password are required",
                400
            )

        student = students_collection.find_one({
            "student_id": student_id
        })

        if not student:
            return json_error(
                "Student not found",
                404
            )

        user = authenticate(
            request,
            username=student_id,
            password=password
        )

        if user is None:
            return json_error(
                "Invalid Student ID or password",
                401
            )

        if not user.is_active:
            return json_error(
                "Student account is inactive",
                403
            )

        if user.is_staff:
            return json_error(
                "Student access is required",
                403
            )

        login(request, user)

        request.session["authenticated_role"] = "student"
        request.session.set_expiry(60 * 60 * 24 * 14)
        request.session.modified = True
        request.session.save()

        return no_cache_response({
            "status": "success",
            "message": "Login successful",
            "role": "student",
            "student": {
                "student_id": student.get(
                    "student_id",
                    ""
                ),
                "name": student.get(
                    "name",
                    ""
                ),
                "email": student.get(
                    "email",
                    ""
                ),
                "course": student.get(
                    "course",
                    ""
                )
            },
            "user": {
                "student_id": student.get(
                    "student_id",
                    ""
                ),
                "name": student.get(
                    "name",
                    ""
                ),
                "email": student.get(
                    "email",
                    ""
                ),
                "course": student.get(
                    "course",
                    ""
                )
            }
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# LOGOUT
# =========================================================

@csrf_exempt
def logout_api(request):

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    logout(request)

    response = no_cache_response({
        "status": "success",
        "message": "Logout successful"
    })

    response.delete_cookie("sessionid", path="/")
    return response


# =========================================================
# CURRENT USER
# =========================================================

def current_user(request):

    user = get_current_user(request)

    if user is None:
        return no_cache_response({
            "status": "error",
            "message": "Authentication required"
        }, status=401)

    if user.is_staff:

        request.session["authenticated_role"] = "admin"
        request.session.modified = True
        request.session.save()

        return no_cache_response({
            "status": "success",
            "role": "admin",
            "user": {
                "username": user.username,
                "email": user.email,
                "is_staff": True
            }
        })

    student = students_collection.find_one({
        "student_id": user.username
    })

    if not student:
        return json_error(
            "Student profile not found",
            404
        )

    request.session["authenticated_role"] = "student"
    request.session.modified = True
    request.session.save()

    student_data = {
        "student_id": student.get(
            "student_id",
            ""
        ),
        "name": student.get(
            "name",
            ""
        ),
        "email": student.get(
            "email",
            ""
        ),
        "course": student.get(
            "course",
            ""
        )
    }

    return no_cache_response({
        "status": "success",
        "role": "student",
        "student": student_data,
        "user": student_data
    })


# =========================================================
# STUDENTS
# =========================================================

@csrf_exempt
def students(request):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method == "GET":

        data = list(
            students_collection.find(
                {},
                {"_id": 0}
            )
        )

        return JsonResponse({
            "status": "success",
            "students": data
        })

    if request.method == "POST":

        try:
            data = json.loads(request.body)

            student_id = str(
                data.get("student_id", "")
            ).strip()

            name = str(
                data.get("name", "")
            ).strip()

            email = str(
                data.get("email", "")
            ).strip()

            course = str(
                data.get("course", "")
            ).strip()

            password = data.get("password")

            if not student_id or not name:
                return json_error(
                    "Student ID and Name are required",
                    400
                )

            if not password:
                return json_error(
                    "Student password is required",
                    400
                )

            if len(password) < 8:
                return json_error(
                    "Password must contain at least 8 characters",
                    400
                )

            existing = students_collection.find_one({
                "student_id": student_id
            })

            if existing:
                return json_error(
                    "Student already exists",
                    409
                )

            existing_user = User.objects.filter(
                username=student_id
            ).first()

            if existing_user:
                return json_error(
                    "Student account already exists",
                    409
                )

            student = {
                "student_id": student_id,
                "name": name,
                "email": email,
                "course": course
            }

            students_collection.insert_one(
                student
            )

            try:
                user = User.objects.create_user(
                    username=student_id,
                    email=email,
                    password=password
                )

                user.first_name = name
                user.is_staff = False
                user.is_active = True
                user.save()

            except Exception:
                students_collection.delete_one({
                    "student_id": student_id
                })
                raise

            student.pop(
                "_id",
                None
            )

            return JsonResponse({
                "status": "success",
                "message": "Student added successfully",
                "student": student
            }, status=201)

        except json.JSONDecodeError:
            return json_error(
                "Invalid JSON data",
                400
            )

        except Exception as e:
            return json_error(
                str(e),
                500
            )

    return json_error(
        "Only GET and POST methods are allowed",
        405
    )


# =========================================================
# DELETE STUDENT
# =========================================================

@csrf_exempt
def delete_student(
    request,
    student_id
):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method != "DELETE":
        return json_error(
            "Only DELETE method is allowed",
            405
        )

    try:
        student = students_collection.find_one({
            "student_id": student_id
        })

        if not student:
            return json_error(
                "Student not found",
                404
            )

        students_result = students_collection.delete_one({
            "student_id": student_id
        })

        faces_result = faces_collection.delete_many({
            "student_id": student_id
        })

        attendance_result = attendance_collection.delete_many({
            "student_id": student_id
        })

        User.objects.filter(
            username=student_id,
            is_staff=False
        ).delete()

        return JsonResponse({
            "status": "success",
            "message": "Student and related data deleted successfully",
            "student_id": student_id,
            "deleted": {
                "student_records":
                    students_result.deleted_count,
                "face_embeddings":
                    faces_result.deleted_count,
                "attendance_records":
                    attendance_result.deleted_count
            }
        })

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# UPDATE STUDENT
# =========================================================

@csrf_exempt
def update_student(
    request,
    student_id
):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method != "PUT":
        return json_error(
            "Only PUT method is allowed",
            405
        )

    try:
        data = json.loads(request.body)

        name = str(
            data.get("name", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip()

        course = str(
            data.get("course", "")
        ).strip()

        password = data.get("password")

        if not name:
            return json_error(
                "Student name is required",
                400
            )

        if password and len(password) < 8:
            return json_error(
                "Password must contain at least 8 characters",
                400
            )

        result = students_collection.update_one(
            {
                "student_id": student_id
            },
            {
                "$set": {
                    "name": name,
                    "email": email,
                    "course": course
                }
            }
        )

        if result.matched_count == 0:
            return json_error(
                "Student not found",
                404
            )

        user = User.objects.filter(
            username=student_id,
            is_staff=False
        ).first()

        if user is None and password:

            user = User.objects.create_user(
                username=student_id,
                email=email,
                password=password
            )

            user.first_name = name
            user.is_staff = False
            user.is_active = True
            user.save()

        elif user:

            user.first_name = name
            user.email = email
            user.is_staff = False
            user.is_active = True

            if password:
                user.set_password(password)

            user.save()

        updated_student = students_collection.find_one(
            {
                "student_id": student_id
            },
            {
                "_id": 0
            }
        )

        return JsonResponse({
            "status": "success",
            "message": "Student updated successfully",
            "student": updated_student
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# ADMIN RESET STUDENT PASSWORD
# =========================================================

@csrf_exempt
def admin_reset_student_password(
    request,
    student_id
):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    try:
        data = json.loads(request.body)

        new_password = data.get(
            "new_password"
        )

        confirm_password = data.get(
            "confirm_password"
        )

        if not new_password or not confirm_password:
            return json_error(
                "New password and confirmation are required",
                400
            )

        if new_password != confirm_password:
            return json_error(
                "Passwords do not match",
                400
            )

        if len(new_password) < 8:
            return json_error(
                "Password must contain at least 8 characters",
                400
            )

        student = students_collection.find_one({
            "student_id": student_id
        })

        if not student:
            return json_error(
                "Student not found",
                404
            )

        user = User.objects.filter(
            username=student_id,
            is_staff=False
        ).first()

        if user is None:

            user = User.objects.create_user(
                username=student_id,
                email=student.get(
                    "email",
                    ""
                ),
                password=new_password
            )

            user.first_name = student.get(
                "name",
                ""
            )

            user.is_staff = False
            user.is_active = True
            user.save()

        else:

            user.set_password(
                new_password
            )

            user.is_staff = False
            user.is_active = True
            user.save()

        return JsonResponse({
            "status": "success",
            "message": "Student password reset successfully",
            "student_id": student_id
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# STUDENT CHANGE PASSWORD
# =========================================================

@csrf_exempt
def student_change_password(request):

    student_error = require_student(request)

    if student_error:
        return student_error

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    try:
        data = json.loads(request.body)

        current_password = data.get(
            "current_password"
        )

        new_password = data.get(
            "new_password"
        )

        confirm_password = data.get(
            "confirm_password"
        )

        if not current_password:
            return json_error(
                "Current password is required",
                400
            )

        if not new_password:
            return json_error(
                "New password is required",
                400
            )

        if not confirm_password:
            return json_error(
                "Password confirmation is required",
                400
            )

        if new_password != confirm_password:
            return json_error(
                "Passwords do not match",
                400
            )

        if len(new_password) < 8:
            return json_error(
                "Password must contain at least 8 characters",
                400
            )

        user = authenticate(
            request,
            username=request.user.username,
            password=current_password
        )

        if user is None:
            return json_error(
                "Current password is incorrect",
                401
            )

        if new_password == current_password:
            return json_error(
                "New password must be different from current password",
                400
            )

        user.set_password(
            new_password
        )

        user.save()

        login(
            request,
            user
        )

        request.session["authenticated_role"] = "student"
        request.session.save()

        return JsonResponse({
            "status": "success",
            "message": "Password changed successfully"
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# STUDENT FORGOT PASSWORD
# =========================================================

@csrf_exempt
def student_forgot_password(request):

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    try:
        data = json.loads(request.body)

        student_id = str(
            data.get("student_id", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip()

        new_password = data.get(
            "new_password"
        )

        confirm_password = data.get(
            "confirm_password"
        )

        if not student_id:
            return json_error(
                "Student ID is required",
                400
            )

        if not email:
            return json_error(
                "Registered email is required",
                400
            )

        if not new_password:
            return json_error(
                "New password is required",
                400
            )

        if not confirm_password:
            return json_error(
                "Password confirmation is required",
                400
            )

        if new_password != confirm_password:
            return json_error(
                "Passwords do not match",
                400
            )

        if len(new_password) < 8:
            return json_error(
                "Password must contain at least 8 characters",
                400
            )

        student = students_collection.find_one({
            "student_id": student_id
        })

        if not student:
            return json_error(
                "Student not found",
                404
            )

        registered_email = str(
            student.get("email", "")
        ).strip().lower()

        if registered_email != email.lower():
            return json_error(
                "Student ID and registered email do not match",
                401
            )

        user = User.objects.filter(
            username=student_id,
            is_staff=False
        ).first()

        if user is None:

            user = User.objects.create_user(
                username=student_id,
                email=registered_email,
                password=new_password
            )

            user.first_name = student.get(
                "name",
                ""
            )

            user.is_staff = False
            user.is_active = True
            user.save()

        else:

            user.set_password(
                new_password
            )

            user.email = registered_email

            user.first_name = student.get(
                "name",
                ""
            )

            user.is_staff = False
            user.is_active = True

            user.save()

        return JsonResponse({
            "status": "success",
            "message": "Password reset successfully",
            "student_id": student_id
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# STUDENT PROFILE
# =========================================================

def student_profile(request):

    student_error = require_student(request)

    if student_error:
        return student_error

    student_id = request.user.username

    student = students_collection.find_one(
        {
            "student_id": student_id
        },
        {
            "_id": 0
        }
    )

    if not student:
        return json_error(
            "Student profile not found",
            404
        )

    return JsonResponse({
        "status": "success",
        "student": {
            "student_id": student.get(
                "student_id",
                ""
            ),
            "name": student.get(
                "name",
                ""
            ),
            "email": student.get(
                "email",
                ""
            ),
            "course": student.get(
                "course",
                ""
            )
        }
    })


# =========================================================
# STUDENT ATTENDANCE
# =========================================================

def student_attendance(request):

    student_error = require_student(request)

    if student_error:
        return student_error

    if request.method != "GET":
        return json_error(
            "Only GET method is allowed",
            405
        )

    student_id = request.user.username

    records = list(
        attendance_collection.find(
            {
                "student_id": student_id
            },
            {
                "_id": 0
            }
        ).sort(
            [
                ("date", -1),
                ("time", -1)
            ]
        )
    )

    return JsonResponse({
        "status": "success",
        "attendance": records,
        "total_records": len(records)
    })


# =========================================================
# STUDENT DASHBOARD
# =========================================================

def student_dashboard(request):

    student_error = require_student(request)

    if student_error:
        return student_error

    student_id = request.user.username

    student = students_collection.find_one(
        {
            "student_id": student_id
        },
        {
            "_id": 0
        }
    )

    if not student:
        return json_error(
            "Student profile not found",
            404
        )

    total_days = attendance_collection.count_documents({
        "student_id": student_id,
        "status": "PRESENT"
    })

    today = datetime.now(
        ZoneInfo("Asia/Kolkata")
    ).strftime("%Y-%m-%d")

    today_record = attendance_collection.find_one(
        {
            "student_id": student_id,
            "date": today,
            "status": "PRESENT"
        },
        {
            "_id": 0
        }
    )

    present_today = 1 if today_record else 0

    attendance_rate = 0

    if total_days > 0:
        attendance_rate = 100

    student_data = {
        "student_id": student.get(
            "student_id",
            ""
        ),
        "name": student.get(
            "name",
            ""
        ),
        "email": student.get(
            "email",
            ""
        ),
        "course": student.get(
            "course",
            ""
        )
    }

    return JsonResponse({
        "status": "success",
        "student": student_data,
        "present_today": present_today,
        "total_days": total_days,
        "total_attendance": total_days,
        "attendance_rate": attendance_rate,
        "rate": attendance_rate,
        "attendance_status_today":
            "PRESENT"
            if today_record
            else "NOT_MARKED",
        "today_attendance": today_record
    })


# =========================================================
# ATTENDANCE
# =========================================================

@csrf_exempt
def attendance(request):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method == "POST":

        try:
            data = json.loads(request.body)

            student_id = data.get(
                "student_id"
            )

            student_name = data.get(
                "student_name"
            )

            similarity = data.get(
                "similarity",
                0
            )

            if not student_id:
                return json_error(
                    "Student ID is required",
                    400
                )

            india_time = datetime.now(
                ZoneInfo("Asia/Kolkata")
            )

            today = india_time.strftime(
                "%Y-%m-%d"
            )

            current_time = india_time.strftime(
                "%H:%M:%S"
            )

            existing = attendance_collection.find_one({
                "student_id": student_id,
                "date": today
            })

            if existing:
                return JsonResponse({
                    "status": "ALREADY_MARKED",
                    "message":
                        "Attendance already marked today",
                    "student_id":
                        student_id,
                    "student_name":
                        student_name,
                    "date":
                        today,
                    "time":
                        existing["time"]
                }, status=409)

            record = {
                "student_id":
                    student_id,
                "student_name":
                    student_name,
                "similarity":
                    round(
                        float(similarity),
                        4
                    ),
                "date":
                    today,
                "time":
                    current_time,
                "status":
                    "PRESENT"
            }

            attendance_collection.insert_one(
                record
            )

            return JsonResponse({
                "status": "success",
                "message":
                    "Attendance marked successfully",
                "student_id":
                    student_id,
                "student_name":
                    student_name,
                "similarity":
                    record["similarity"],
                "date":
                    today,
                "time":
                    current_time,
                "attendance_status":
                    "PRESENT"
            }, status=201)

        except Exception as e:
            return json_error(
                str(e),
                400
            )

    return json_error(
        "Only POST method is allowed",
        405
    )


# =========================================================
# ATTENDANCE COUNT
# =========================================================

def attendance_count(request):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    india_time = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    today = india_time.strftime(
        "%Y-%m-%d"
    )

    count = attendance_collection.count_documents({
        "date": today,
        "status": "PRESENT"
    })

    return JsonResponse({
        "status": "success",
        "date": today,
        "attendance_count": count
    })


# =========================================================
# ATTENDANCE LIST
# =========================================================

def attendance_list(request):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method == "GET":

        data = list(
            attendance_collection.find(
                {},
                {
                    "_id": 0
                }
            ).sort(
                [
                    ("date", -1),
                    ("time", -1)
                ]
            )
        )

        return JsonResponse({
            "status": "success",
            "attendance": data
        })

    return json_error(
        "Only GET method is allowed",
        405
    )


# =========================================================
# DASHBOARD STATS
# =========================================================

def dashboard_stats(request):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    india_time = datetime.now(
        ZoneInfo("Asia/Kolkata")
    )

    today = india_time.strftime(
        "%Y-%m-%d"
    )

    total_students = (
        students_collection.count_documents({})
    )

    present_students = (
        attendance_collection.count_documents({
            "date": today,
            "status": "PRESENT"
        })
    )

    absent_students = max(
        total_students - present_students,
        0
    )

    if total_students > 0:
        attendance_rate = round(
            (
                present_students /
                total_students
            ) * 100,
            2
        )
    else:
        attendance_rate = 0

    return JsonResponse({
        "status": "success",
        "date": today,
        "total_students":
            total_students,
        "present_students":
            present_students,
        "absent_students":
            absent_students,
        "attendance_rate":
            attendance_rate
    })


# =========================================================
# FACE RECOGNITION
# =========================================================

@csrf_exempt
def face_recognition_api(request):

    user = get_current_user(request)

    if user is None:
        return json_error(
            "Authentication required",
            401
        )

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    try:

        if "image" not in request.FILES:
            return json_error(
                "Image is required",
                400
            )

        image_file = request.FILES["image"]

        image_bytes = image_file.read()

        image_array = np.frombuffer(
            image_bytes,
            np.uint8
        )

        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        if frame is None:
            return json_error(
                "Invalid image",
                400
            )

        print(
            "Face recognition processing..."
        )

        result = DeepFace.represent(
            img_path=frame,
            model_name="Facenet512",
            detector_backend="opencv",
            enforce_detection=True
        )

        test_embedding = result[0]["embedding"]

        match = recognize_face(
            test_embedding
        )

        if match is None:

            return JsonResponse({
                "status": "NOT_RECOGNIZED",
                "message":
                    "Face not recognized",
                "similarity": 0
            })

        student_id = match[
            "student_id"
        ]

        student_name = match[
            "student_name"
        ]

        similarity = round(
            float(match["similarity"]),
            4
        )

        print(
            "Student:",
            student_name
        )

        print(
            "Similarity:",
            similarity
        )

        if similarity < 0.80:

            return JsonResponse({
                "status": "NOT_RECOGNIZED",
                "message":
                    "Face not recognized",
                "similarity":
                    similarity
            })

        if not user.is_staff:

            if str(user.username) != str(student_id):

                return JsonResponse({
                    "status":
                        "NOT_AUTHORIZED",
                    "message":
                        "The recognized face does not belong to the logged-in student.",
                    "student_id":
                        student_id,
                    "student_name":
                        student_name,
                    "similarity":
                        similarity
                }, status=403)

        print(
            "FACE RECOGNIZED"
        )

        attendance_result = mark_attendance(
            student_id=student_id,
            student_name=student_name,
            similarity=similarity
        )

        return JsonResponse({
            "status":
                attendance_result.get(
                    "status"
                ),
            "message":
                attendance_result.get(
                    "message"
                ),
            "student_id":
                student_id,
            "student_name":
                student_name,
            "similarity":
                similarity,
            "date":
                attendance_result.get(
                    "date"
                ),
            "time":
                attendance_result.get(
                    "time"
                ),
            "attendance":
                attendance_result
        })

    except Exception as e:

        print(
            "Face Recognition Error:",
            e
        )

        return json_error(
            str(e),
            500
        )


# =========================================================
# FACE REGISTRATION
# =========================================================

@csrf_exempt
def face_register_api(request):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method != "POST":
        return json_error(
            "Only POST method is allowed",
            405
        )

    try:

        student_id = request.POST.get(
            "student_id"
        )

        image_index = request.POST.get(
            "image_index"
        )

        if not student_id:
            return json_error(
                "Student ID is required",
                400
            )

        if "image" not in request.FILES:
            return json_error(
                "Image is required",
                400
            )

        student = students_collection.find_one({
            "student_id": student_id
        })

        if not student:
            return json_error(
                "Student not found",
                404
            )

        image_file = request.FILES["image"]

        image_bytes = image_file.read()

        image_array = np.frombuffer(
            image_bytes,
            np.uint8
        )

        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

        if frame is None:
            return json_error(
                "Invalid image",
                400
            )

        print(
            "Face registration processing..."
        )

        # =====================================================
        # GENERATE FACE EMBEDDING
        # =====================================================

        result = DeepFace.represent(
            img_path=frame,
            model_name="Facenet512",
            detector_backend="opencv",
            enforce_detection=True
        )

        embedding = result[0]["embedding"]

        # =====================================================
        # DATASET DIRECTORY
        # =====================================================

        dataset_dir = os.path.join(
            BASE_DIR,
            "dataset",
            str(student_id)
        )

        os.makedirs(
            dataset_dir,
            exist_ok=True
        )

        # =====================================================
        # START NEW REGISTRATION SESSION
        # =====================================================

        if image_index == "1":

            # Remove previous dataset images
            for filename in os.listdir(
                dataset_dir
            ):

                file_path = os.path.join(
                    dataset_dir,
                    filename
                )

                if os.path.isfile(
                    file_path
                ):

                    if filename.lower().endswith(
                        (
                            ".jpg",
                            ".jpeg",
                            ".png"
                        )
                    ):

                        os.remove(
                            file_path
                        )

            # Remove previous face embeddings
            faces_collection.delete_many({
                "student_id":
                    student_id
            })

        # =====================================================
        # IMAGE NUMBER
        # =====================================================

        image_number = (
            int(image_index)
            if image_index
            else 1
        )

        # =====================================================
        # SAVE IMAGE TO DATASET
        # =====================================================

        dataset_filename = (
            f"face_{image_number:02d}.jpg"
        )

        dataset_path = os.path.join(
            dataset_dir,
            dataset_filename
        )

        saved = cv2.imwrite(
            dataset_path,
            frame
        )

        if not saved:

            return json_error(
                "Unable to save image to dataset",
                500
            )

        print(
            "Dataset image saved:",
            dataset_path
        )

        # =====================================================
        # SAVE FACE EMBEDDING TO MONGODB
        # =====================================================

        face_record = {

            "student_id":
                student_id,

            "student_name":
                student.get(
                    "name",
                    ""
                ),

            "image_index":
                image_number,

            "embedding":
                embedding,

            "created_at":
                datetime.now(
                    ZoneInfo("Asia/Kolkata")
                ).isoformat()
        }

        faces_collection.insert_one(
            face_record
        )

        # =====================================================
        # COUNT FACE EMBEDDINGS
        # =====================================================

        total_faces = (
            faces_collection.count_documents({
                "student_id":
                    student_id
            })
        )

        # =====================================================
        # COUNT DATASET IMAGES
        # =====================================================

        dataset_images = 0

        if os.path.exists(
            dataset_dir
        ):

            dataset_images = len([
                filename
                for filename in os.listdir(
                    dataset_dir
                )
                if filename.lower().endswith(
                    (
                        ".jpg",
                        ".jpeg",
                        ".png"
                    )
                )
            ])

        # =====================================================
        # LOG INFORMATION
        # =====================================================

        print(
            "Face registered:",
            student.get(
                "name",
                ""
            )
        )

        print(
            "Student ID:",
            student_id
        )

        print(
            "Image index:",
            image_number
        )

        print(
            "Total face embeddings:",
            total_faces
        )

        print(
            "Total dataset images:",
            dataset_images
        )

        # =====================================================
        # RESPONSE
        # =====================================================

        return JsonResponse({

            "status":
                "success",

            "message":
                "Face registered successfully",

            "student_id":
                student_id,

            "student_name":
                student.get(
                    "name",
                    ""
                ),

            "image_index":
                image_number,

            "total_faces":
                total_faces,

            "dataset_images":
                dataset_images

        }, status=201)

    except Exception as e:

        print(
            "Face Registration Error:",
            e
        )

        return json_error(
            str(e),
            500
        )


# =========================================================
# TEAM MANAGEMENT
# =========================================================

@csrf_exempt
def team_list(request):

    user = get_current_user(request)

    if user is None:
        return json_error(
            "Authentication required",
            401
        )

    if request.method == "GET":

        members = []

        for member in team_collection.find(
            {}
        ).sort(
            "name",
            1
        ):

            members.append({
                "team_id":
                    str(member["_id"]),
                "name":
                    member.get(
                        "name",
                        ""
                    ),
                "role":
                    member.get(
                        "role",
                        ""
                    ),
                "description":
                    member.get(
                        "description",
                        ""
                    ),
                "photo":
                    member.get(
                        "photo",
                        ""
                    )
            })

        return JsonResponse({
            "status": "success",
            "team": members
        })

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method == "POST":

        try:

            data = json.loads(
                request.body
            )

            name = data.get(
                "name",
                ""
            ).strip()

            role = data.get(
                "role",
                ""
            ).strip()

            description = data.get(
                "description",
                ""
            ).strip()

            photo = data.get(
                "photo",
                ""
            )

            if not name or not role:
                return json_error(
                    "Name and role are required",
                    400
                )

            member = {
                "name":
                    name,
                "role":
                    role,
                "description":
                    description,
                "photo":
                    photo,
                "created_at":
                    datetime.now(
                        ZoneInfo("Asia/Kolkata")
                    ).isoformat()
            }

            result = team_collection.insert_one(
                member
            )

            return JsonResponse({
                "status":
                    "success",
                "message":
                    "Team member added successfully",
                "team_member": {
                    "team_id":
                        str(
                            result.inserted_id
                        ),
                    "name":
                        name,
                    "role":
                        role,
                    "description":
                        description,
                    "photo":
                        photo
                }
            }, status=201)

        except json.JSONDecodeError:
            return json_error(
                "Invalid JSON data",
                400
            )

        except Exception as e:
            return json_error(
                str(e),
                500
            )

    return json_error(
        "Only GET and POST methods are allowed",
        405
    )


# =========================================================
# UPDATE TEAM MEMBER
# =========================================================

@csrf_exempt
def update_team_member(
    request,
    team_id
):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method != "PUT":
        return json_error(
            "Only PUT method is allowed",
            405
        )

    try:

        if not ObjectId.is_valid(
            team_id
        ):
            return json_error(
                "Invalid team member ID",
                400
            )

        data = json.loads(
            request.body
        )

        name = data.get(
            "name",
            ""
        ).strip()

        role = data.get(
            "role",
            ""
        ).strip()

        description = data.get(
            "description",
            ""
        ).strip()

        if not name or not role:
            return json_error(
                "Name and role are required",
                400
            )

        update_data = {
            "name":
                name,
            "role":
                role,
            "description":
                description,
            "updated_at":
                datetime.now(
                    ZoneInfo("Asia/Kolkata")
                ).isoformat()
        }

        if "photo" in data:
            update_data["photo"] = data.get(
                "photo",
                ""
            )

        result = team_collection.update_one(
            {
                "_id":
                    ObjectId(team_id)
            },
            {
                "$set":
                    update_data
            }
        )

        if result.matched_count == 0:
            return json_error(
                "Team member not found",
                404
            )

        updated_member = team_collection.find_one({
            "_id":
                ObjectId(team_id)
        })

        return JsonResponse({
            "status":
                "success",
            "message":
                "Team member updated successfully",
            "team_member": {
                "team_id":
                    str(
                        updated_member["_id"]
                    ),
                "name":
                    updated_member.get(
                        "name",
                        ""
                    ),
                "role":
                    updated_member.get(
                        "role",
                        ""
                    ),
                "description":
                    updated_member.get(
                        "description",
                        ""
                    ),
                "photo":
                    updated_member.get(
                        "photo",
                        ""
                    )
            }
        })

    except json.JSONDecodeError:
        return json_error(
            "Invalid JSON data",
            400
        )

    except Exception as e:
        return json_error(
            str(e),
            500
        )


# =========================================================
# DELETE TEAM MEMBER
# =========================================================

@csrf_exempt
def delete_team_member(
    request,
    team_id
):

    admin_error = require_admin(request)

    if admin_error:
        return admin_error

    if request.method != "DELETE":
        return json_error(
            "Only DELETE method is allowed",
            405
        )

    try:

        if not ObjectId.is_valid(
            team_id
        ):
            return json_error(
                "Invalid team member ID",
                400
            )

        result = team_collection.delete_one({
            "_id":
                ObjectId(team_id)
        })

        if result.deleted_count == 0:
            return json_error(
                "Team member not found",
                404
            )

        return JsonResponse({
            "status":
                "success",
            "message":
                "Team member deleted successfully"
        })

    except Exception as e:
        return json_error(
            str(e),
            500
        )