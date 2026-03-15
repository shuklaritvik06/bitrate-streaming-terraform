resource "aws_cloudwatch_log_group" "ecs" {
  name              = local.log_group_name
  retention_in_days = var.retention_days
  tags              = merge(var.tags, { Name = local.log_group_name })
}