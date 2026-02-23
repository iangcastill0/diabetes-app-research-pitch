# Development environment
environment = "development"
aws_region  = "us-east-1"

# VPC
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]
private_subnets    = ["10.0.1.0/24", "10.0.2.0/24"]
public_subnets     = ["10.0.101.0/24", "10.0.102.0/24"]

# EKS
node_desired_size     = 2
node_min_size         = 1
node_max_size         = 3
node_instance_types   = ["t3.medium"]

# RDS
db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 100

# Redis
redis_node_type = "cache.t3.micro"