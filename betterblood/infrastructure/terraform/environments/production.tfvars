# Production environment
environment = "production"
aws_region  = "us-east-1"

# VPC
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
private_subnets    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
public_subnets     = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

# EKS
node_desired_size     = 3
node_min_size         = 2
node_max_size         = 10
node_instance_types   = ["t3.large"]

# RDS
db_instance_class        = "db.r5.large"
db_allocated_storage     = 100
db_max_allocated_storage = 1000

# Redis
redis_node_type = "cache.r5.large"