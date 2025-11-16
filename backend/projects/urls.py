"""
URL routing for Projects app
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .search import ProjectSearchViewSet
from .views import (
    BulkOperationViewSet,
    CommentViewSet,
    MilestoneViewSet,
    ProjectViewSet,
    RoleViewSet,
    TagViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"milestones", MilestoneViewSet, basename="milestone")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"tags", TagViewSet, basename="tag")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"users", UserViewSet, basename="user")
router.register(r"bulk", BulkOperationViewSet, basename="bulk-operation")
router.register(r"search", ProjectSearchViewSet, basename="search")

urlpatterns = [
    path("", include(router.urls)),
]
