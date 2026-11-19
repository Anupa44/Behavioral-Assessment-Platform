from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Framework
from .serializers import FrameworkSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def framework_list(request):
    frameworks = Framework.objects.all()
    return Response(FrameworkSerializer(frameworks, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def framework_detail(request, slug):
    try:
        framework = Framework.objects.get(slug=slug)
    except Framework.DoesNotExist:
        from rest_framework import status
        return Response({"error": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(FrameworkSerializer(framework).data)
