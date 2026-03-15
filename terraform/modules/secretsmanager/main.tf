resource "aws_secretsmanager_secret" "this" {
  name                    = local.secret_name
  recovery_window_in_days = 7
  tags                    = merge(var.tags, { Name = local.secret_name })
}