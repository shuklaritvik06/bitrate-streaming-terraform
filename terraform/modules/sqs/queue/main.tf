resource "aws_sqs_queue" "this" {
  name                       = local.queue_name
  visibility_timeout_seconds = 910
  message_retention_seconds  = 86400

  redrive_policy = jsonencode({
    deadLetterTargetArn = var.dlq_arn
    maxReceiveCount     = 5
  })

  tags = merge(var.tags, { Name = local.queue_name })
}

resource "aws_sqs_queue_policy" "this" {
  queue_url = aws_sqs_queue.this.url

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.this.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = var.media_bucket_arn }
      }
    }]
  })
}