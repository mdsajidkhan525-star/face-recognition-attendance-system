import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update the initial admin and student users."

    def handle(self, *args, **options):
        User = get_user_model()

        admin_username = os.getenv("ADMIN_USERNAME")
        admin_password = os.getenv("ADMIN_PASSWORD")

        student_id = os.getenv("STUDENT_ID")
        student_password = os.getenv("STUDENT_PASSWORD")

        if admin_username and admin_password:
            admin_user, created = User.objects.get_or_create(
                username=admin_username
            )

            admin_user.is_active = True
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.set_password(admin_password)
            admin_user.save()

            action = "created" if created else "updated"
            self.stdout.write(
                self.style.SUCCESS(
                    f"Admin user '{admin_username}' {action} successfully."
                )
            )

        if student_id and student_password:
            student_user, created = User.objects.get_or_create(
                username=str(student_id)
            )

            student_user.is_active = True
            student_user.is_staff = False
            student_user.is_superuser = False
            student_user.set_password(student_password)
            student_user.save()

            action = "created" if created else "updated"
            self.stdout.write(
                self.style.SUCCESS(
                    f"Student user '{student_id}' {action} successfully."
                )
            )

        if not admin_username and not student_id:
            self.stdout.write(
                self.style.WARNING(
                    "No bootstrap user credentials were provided."
                )
            )