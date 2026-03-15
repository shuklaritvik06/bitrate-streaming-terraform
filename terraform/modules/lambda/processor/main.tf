data "archive_file" "this" {
  type        = "zip"
  source_dir  = local.source_dir
  output_path = "/tmp/${local.function_name}.zip"
}

resource "aws_lambda_function" "this" {
  function_name    = local.function_name
  role             = var.lambda_role_arn
  handler          = "process-sqs-message.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.this.output_path
  source_code_hash = data.archive_file.this.output_base64sha256
  timeout          = 900

  environment {
    variables = {
      PRIVATE_SUBNET_ONE_ID       = var.private_subnet_ids[0]
      PRIVATE_SUBNET_TWO_ID       = var.private_subnet_ids[1]
      SECURITY_GROUP_ID           = var.encoder_sg_id
      ECS_CLUSTER                 = var.ecs_cluster_arn
      ENCODER_TASK_DEFINITION_ARN = var.encoder_task_definition_arn
      STREAM_URL                  = var.stream_url
    }
  }

  tags = merge(var.tags, { Name = local.function_name })
}

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn                   = var.queue_arn
  function_name                      = aws_lambda_function.this.arn
  batch_size                         = 5
  maximum_batching_window_in_seconds = 5
  enabled                            = true

  scaling_config {
    maximum_concurrency = 5
  }

  function_response_types = ["ReportBatchItemFailures"]
}

resource "aws_lambda_permission" "sqs_invoke" {
  statement_id  = "AllowSQSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = "sqs.amazonaws.com"
  source_arn    = var.queue_arn
}
