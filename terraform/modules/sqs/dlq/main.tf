resource "aws_sqs_queue" "this" {
  name = local.queue_name
  tags = merge(var.tags, { Name = local.queue_name })
}