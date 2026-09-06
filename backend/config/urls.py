from django.contrib import admin
from django.urls import path

from attendance_app.views import (
    admin_login,
    admin_change_password,

    student_login,
    student_forgot_password,

    logout_api,
    current_user,

    students,
    delete_student,
    update_student,

    student_profile,
    student_attendance,
    student_dashboard,
    student_change_password,

    attendance,
    attendance_count,
    attendance_list,
    dashboard_stats,

    face_recognition_api,
    face_register_api,

    team_list,
    update_team_member,
    delete_team_member,
)


urlpatterns = [

    # ============================================================
    # AUTHENTICATION
    # ============================================================

    path(
        "admin/login/",
        admin_login
    ),

    path(
        "admin/change-password/",
        admin_change_password
    ),

    path(
        "student/login/",
        student_login
    ),

    path(
        "student/forgot-password/",
        student_forgot_password
    ),

    path(
        "logout/",
        logout_api
    ),

    path(
        "current-user/",
        current_user
    ),


    # ============================================================
    # DJANGO ADMIN
    # ============================================================

    path(
        "admin/",
        admin.site.urls
    ),


    # ============================================================
    # STUDENT MANAGEMENT
    # ============================================================

    path(
        "students/",
        students
    ),

    path(
        "students/<str:student_id>/",
        update_student
    ),

    path(
        "students/<str:student_id>/delete/",
        delete_student
    ),


    # ============================================================
    # STUDENT PORTAL
    # ============================================================

    path(
        "student/profile/",
        student_profile
    ),

    path(
        "student/attendance/",
        student_attendance
    ),

    path(
        "student/dashboard/",
        student_dashboard
    ),

    path(
        "student/change-password/",
        student_change_password
    ),


    # ============================================================
    # ATTENDANCE
    # ============================================================

    path(
        "attendance/",
        attendance
    ),

    path(
        "attendance-count/",
        attendance_count
    ),

    path(
        "attendance-list/",
        attendance_list
    ),

    path(
        "dashboard-stats/",
        dashboard_stats
    ),


    # ============================================================
    # FACE RECOGNITION
    # ============================================================

    path(
        "face-recognition/",
        face_recognition_api
    ),

    path(
        "face-register/",
        face_register_api
    ),


    # ============================================================
    # TEAM MANAGEMENT
    # ============================================================

    path(
        "team/",
        team_list
    ),

    path(
        "team/<str:team_id>/",
        update_team_member
    ),

    path(
        "team/<str:team_id>/delete/",
        delete_team_member
    ),
]