locals {
  org     = "ritvik"
  project = "web-streamer"
  env     = "prod"
  region  = "us-west-2"
  prefix  = "${local.org}-${local.project}-${local.env}"

  media_bucket_name   = "web-streamer-ritvik-${local.env}"
  encoded_bucket_name = "transformed-videos-streamer-ritvik-${local.env}"
  secret_name         = "webstream/${local.env}/frontend"

  tags = {
    Project     = local.project
    Org         = local.org
    Environment = local.env
    ManagedBy   = "terraform"
  }
}

module "vpc" {
  source               = "../../modules/vpc"
  name_prefix          = local.prefix
  vpc_cidr             = "10.2.0.0/16"
  public_subnet_cidrs  = ["10.2.0.0/24", "10.2.1.0/24"]
  private_subnet_cidrs = ["10.2.2.0/24", "10.2.3.0/24"]
  availability_zones   = ["us-west-2a", "us-west-2b"]
  tags                 = local.tags
}

module "igw" {
  source      = "../../modules/networking/igw"
  name_prefix = local.prefix
  vpc_id      = module.vpc.vpc_id
  tags        = local.tags
}

module "nat" {
  source            = "../../modules/networking/nat"
  name_prefix       = local.prefix
  public_subnet_ids = module.vpc.public_subnet_ids
  tags              = local.tags
}

module "route_tables" {
  source             = "../../modules/networking/route_tables"
  name_prefix        = local.prefix
  vpc_id             = module.vpc.vpc_id
  igw_id             = module.igw.igw_id
  nat_gateway_ids    = module.nat.nat_gateway_ids
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  tags               = local.tags
}

module "security_groups" {
  source      = "../../modules/networking/security_groups"
  name_prefix = local.prefix
  vpc_id      = module.vpc.vpc_id
  tags        = local.tags
}

module "ecr" {
  source      = "../../modules/ecr"
  name_prefix = local.prefix
  repo_names  = ["${local.prefix}-frontend", "${local.prefix}-encoder"]
  tags        = local.tags
}

module "secrets" {
  source      = "../../modules/secretsmanager"
  name_prefix = local.prefix
  secret_name = local.secret_name
  tags        = local.tags
}

module "iam_roles" {
  source      = "../../modules/iam/roles"
  name_prefix = local.prefix
  tags        = local.tags
}

module "logs" {
  source         = "../../modules/cloudwatch/logs"
  name_prefix    = local.prefix
  retention_days = 90
  tags           = local.tags
}

module "dlq" {
  source      = "../../modules/sqs/dlq"
  name_prefix = local.prefix
  tags        = local.tags
}

module "event_handler_lambda" {
  source           = "../../modules/lambda/event_handler"
  name_prefix      = local.prefix
  lambda_role_arn  = module.iam_roles.lambda_role_arn
  queue_url        = module.sqs_queue.queue_url
  media_bucket_arn = module.media_bucket.bucket_arn
  tags             = local.tags
}

module "media_bucket" {
  source      = "../../modules/s3/media_bucket"
  bucket_name = local.media_bucket_name
  lambda_arn  = module.event_handler_lambda.function_arn
  tags        = local.tags
}

module "encoded_bucket" {
  source      = "../../modules/s3/encoded_bucket"
  bucket_name = local.encoded_bucket_name
  tags        = local.tags
}

module "sqs_queue" {
  source           = "../../modules/sqs/queue"
  name_prefix      = local.prefix
  dlq_arn          = module.dlq.dlq_arn
  media_bucket_arn = module.media_bucket.bucket_arn
  tags             = local.tags
}

module "ecs_cluster" {
  source      = "../../modules/ecs_cluster"
  name_prefix = local.prefix
  tags        = local.tags
}

module "encoder_task" {
  source             = "../../modules/ecs_service/encoder"
  name_prefix        = local.prefix
  encoder_image_url  = "${module.ecr.repository_urls["${local.prefix}-encoder"]}:${var.encoder_image_tag}"
  execution_role_arn = module.iam_roles.ecs_task_execution_role_arn
  task_role_arn      = module.iam_roles.ecs_task_role_arn
  log_group_name     = module.logs.log_group_name
  aws_region         = local.region
  tags               = local.tags
}

module "iam_policies" {
  source                      = "../../modules/iam/policies"
  name_prefix                 = local.prefix
  queue_arn                   = module.sqs_queue.queue_arn
  media_bucket_arn            = module.media_bucket.bucket_arn
  encoded_bucket_arn          = module.encoded_bucket.bucket_arn
  encoder_task_definition_arn = module.encoder_task.task_definition_arn
  lambda_role_name            = module.iam_roles.lambda_role_name
  ecs_task_role_name          = module.iam_roles.ecs_task_role_name
  secret_arn                  = module.secrets.secret_arn
  tags                        = local.tags
}

module "processor_lambda" {
  source                      = "../../modules/lambda/processor"
  name_prefix                 = local.prefix
  lambda_role_arn             = module.iam_roles.lambda_role_arn
  queue_arn                   = module.sqs_queue.queue_arn
  private_subnet_ids          = module.vpc.private_subnet_ids
  encoder_sg_id               = module.security_groups.encoder_sg_id
  ecs_cluster_arn             = module.ecs_cluster.cluster_arn
  encoder_task_definition_arn = module.encoder_task.task_definition_arn
  stream_url                  = "https://${module.encoded_bucket.bucket_regional_domain}"
  tags                        = local.tags
}

module "target_group" {
  source      = "../../modules/load_balancer/target_groups"
  name_prefix = local.prefix
  vpc_id      = module.vpc.vpc_id
  tags        = local.tags
}

module "alb" {
  source            = "../../modules/load_balancer/alb"
  name_prefix       = local.prefix
  public_subnet_ids = module.vpc.public_subnet_ids
  alb_sg_id         = module.security_groups.alb_sg_id
  target_group_arn  = module.target_group.target_group_arn
  tags              = local.tags
}

module "frontend_service" {
  source             = "../../modules/ecs_service/frontend"
  name_prefix        = local.prefix
  cluster_id         = module.ecs_cluster.cluster_id
  frontend_image_url = "${module.ecr.repository_urls["${local.prefix}-frontend"]}:${var.frontend_image_tag}"
  execution_role_arn = module.iam_roles.ecs_task_execution_role_arn
  task_role_arn      = module.iam_roles.ecs_task_role_arn
  private_subnet_ids = module.vpc.private_subnet_ids
  ecs_sg_id          = module.security_groups.ecs_sg_id
  target_group_arn   = module.target_group.target_group_arn
  desired_count      = var.desired_count
  secret_arn         = module.secrets.secret_arn
  log_group_name     = module.logs.log_group_name
  aws_region         = local.region
  tags               = local.tags
}

module "alarms" {
  source      = "../../modules/cloudwatch/alarms"
  name_prefix = local.prefix
  dlq_name    = module.dlq.dlq_name
  tags        = local.tags
}