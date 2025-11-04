# Kubernetes Deployment Manifests

This directory will contain Kubernetes manifest files for deploying the Project Management Dashboard.

## Purpose

Store Kubernetes YAML files for different deployment targets:
- **ubuntu/** - K3s deployment for Ubuntu servers (lightweight Kubernetes)
- **aws/** - EKS deployment for AWS cloud (enterprise Kubernetes)

## What Will Go Here

### For Ubuntu/K3s Deployment:
- Namespace definitions
- ConfigMaps and Secrets
- Service deployments (auth, project, audit, etc.)
- Service definitions (ClusterIP, NodePort)
- Ingress rules
- PersistentVolumeClaims
- HorizontalPodAutoscalers

### For AWS/EKS Deployment:
- Same as above, plus:
- AWS-specific configurations (ALB Ingress)
- EBS storage classes
- IAM roles and service accounts
- Auto-scaling configurations
- Multi-AZ deployment manifests

## When to Create These

Create Kubernetes manifests when you're ready to:
1. Deploy to Ubuntu server for testing/POC
2. Deploy to AWS for production
3. Need container orchestration
4. Want auto-scaling and self-healing

## Examples of What Will Be Here

```
kubernetes/
├── ubuntu/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── auth-service/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── project-service/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── ingress.yaml
│
└── aws/
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secrets.yaml
    ├── storage-class.yaml
    ├── auth-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── hpa.yaml
    └── alb-ingress.yaml
```

## Current Status

**Status:** Planning phase - manifests not yet created

**Next Steps:**
1. Decide on deployment strategy (see SUMMARY.md)
2. Create service Docker images first
3. Then generate Kubernetes manifests
4. Test on Ubuntu before AWS

## Notes

- Don't create these until you actually need Kubernetes deployment
- Your current Docker Compose setup is sufficient for development
- K3s on Ubuntu is perfect for testing before AWS
- These manifests can be auto-generated from Helm charts if preferred

---

**Last Updated:** 2025-11-02
**Status:** Empty - Awaiting implementation decision
